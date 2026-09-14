import { getAggregateVotesInPollMessage, normalizeMessageContent, jidNormalizedUser, type WASocket } from '@whiskeysockets/baileys';
import { decryptPollVote } from '@whiskeysockets/baileys/lib/Utils/process-message.js';
import crypto from 'node:crypto';
import { isGroupChat, isBroadcastChat, isNewsletterChat, sanitizeJidForLogs } from './chat-utils.js';
import { detectMedia } from '../media/media-detector.js';
import { parseCommand } from '../commands/command-parser.js';
import { commandRouter } from '../commands/command-router.js';
import { mediaDownloader } from './media-downloader.js';
import { stickerSender } from './sticker-sender.js';
import { stickerProcessor } from '../media/sticker-processor.js';
import { jobQueue } from '../queue/job-queue.js';
import { recentMessages, messageContentStore } from '../utils/cache.js';
import { createJobDir, removeJobDir } from '../utils/files.js';
import { generateJobId } from '../utils/ids.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import type { ExtractedMessage } from '../types/message.js';
import type { Job } from '../queue/job-types.js';
import type { ProcessingOptions } from '../types/media.js';
import { AppError } from '../utils/errors.js';
import { botState } from '../control/bot-state.js';
import { accessControl } from '../control/access-control.js';
import { activityStore } from '../control/activity-store.js';
import { sessionManager, type MediaSession } from '../control/session-manager.js';
import { receiptManager } from '../control/receipt-manager.js';
import { libraryManager } from '../storage/library-manager.js';
import { packManager, pendingPackCreation } from '../storage/pack-manager.js';
import { stickerPackSender } from './sticker-pack-sender.js';
import { historyStore } from '../storage/history-store.js';
import { statisticsManager } from '../control/statistics-manager.js';
import { dailyLimitStore } from '../control/daily-limit-store.js';
import { applyPresetToOptions } from '../media/presets.js';
import { systemMonitor } from '../control/system-monitor.js';
import {
  sendInteractiveMessage,
  sendInteractivePoll,
  activePolls,
  persistActivePolls,
  pendingStickersStore,
  resolveSemanticPollOption,
  type ActivePollRecord,
  type SemanticPollOption,
} from './interactive-messages.js';
import { userLock } from '../utils/user-lock.js';

interface PendingPackSuggestion {
  chatId: string;
  userPhone: string;
  stickerIds: string[];
  timer: NodeJS.Timeout;
}

const pendingPackSuggestions = new Map<string, PendingPackSuggestion>();

/**
 * Agrupa o envio de sugestão de pack com debounce de 2.5s.
 * Se o usuário enviar várias fotos/vídeos de uma só vez, aguarda todas terminarem
 * e envia apenas UMA enquete para salvar todas de uma vez no pack.
 */
function queuePackSuggestion(
  sock: WASocket,
  chatId: string,
  userPhone: string,
  stickerId?: string
) {
  const existing = pendingPackSuggestions.get(chatId);
  if (existing) {
    clearTimeout(existing.timer);
    if (stickerId && !existing.stickerIds.includes(stickerId)) {
      existing.stickerIds.push(stickerId);
    }
  } else {
    pendingPackSuggestions.set(chatId, {
      chatId,
      userPhone,
      stickerIds: stickerId ? [stickerId] : [],
      timer: null as any,
    });
  }

  const current = pendingPackSuggestions.get(chatId)!;
  current.timer = setTimeout(async () => {
    pendingPackSuggestions.delete(chatId);
    const count = current.stickerIds.length;
    const title = count > 1
      ? `📦 Salvar as ${count} figurinhas no seu Pack?`
      : '📦 Salvar no seu Pack de Figurinhas?';
    const semanticOptions: SemanticPollOption[] = [
      {
        id: 'save_pack',
        title: count > 1 ? '📁 Salvar todas no Meu Pack' : '📁 Salvar no Meu Pack',
      },
      {
        id: 'dont_save',
        title: '🚫 Não salvar',
      },
      {
        id: 'send_pack',
        title: '🚀 Enviar Meu Pack',
      },
      {
        id: 'new_pack',
        title: '➕ Criar Novo Pack',
      },
    ];

    try {
      await sendInteractivePoll(sock, chatId, {
        type: 'pack',
        title,
        options: semanticOptions,
        metadata: {
          stickerIds: current.stickerIds,
          stickerId: current.stickerIds[current.stickerIds.length - 1],
          userPhone: current.userPhone,
        },
        expiresInMs: 30 * 60 * 1000,
      });
    } catch (pollErr: any) {
      logger.warn({ pollErr: pollErr?.message }, 'Falha ao enviar enquete de pack debounced pós-sticker');
    }
  }, 2500);
}

export class MessageRouter {
  private readonly botStartedAtSeconds: number = Math.floor(Date.now() / 1000) - 10;

  /**
   * Ponto central de entrada para todos os eventos de novas mensagens do Baileys.
   */
  public async handleMessage(sock: WASocket, rawMessage: any): Promise<void> {
    const key = rawMessage?.key;
    if (!key) return;

    const chatId = key.remoteJid;
    const messageId = key.id;

    if (!chatId || !messageId) return;

    // =========================================================================
    // REGRA 1 (ABSOLUTA): SE FOR GRUPO, IGNORAR IMEDIATAMENTE ANTES DE QUALQUER DOWNLOAD
    // =========================================================================
    if (isGroupChat(chatId)) {
      logger.debug(
        { event: 'message_ignored_group', chat: sanitizeJidForLogs(chatId) },
        'Mensagem de grupo descartada imediatamente (GROUP = IGNORE)'
      );
      return;
    }

    // =========================================================================
    // REGRA 2: DESCARTAR STATUS/BROADCAST E CANAIS/NEWSLETTER
    // =========================================================================
    if (isBroadcastChat(chatId) || isNewsletterChat(chatId)) {
      return;
    }

    // =========================================================================
    // REGRA 2.1: DESCARTAR MENSAGENS HISTÓRICAS / ANTERIORES À INICIALIZAÇÃO DO BOT
    // =========================================================================
    const msgTimestamp = Number(rawMessage?.messageTimestamp);
    if (msgTimestamp > 0 && msgTimestamp < (this.botStartedAtSeconds - 120)) {
      logger.debug(
        { messageId, msgTimestamp, startedAt: this.botStartedAtSeconds },
        'Mensagem histórica ou recebida offline antes da inicialização do bot descartada'
      );
      return;
    }

    // =========================================================================
    // REGRA 3: SE FOR MENSAGEM DA PRÓPRIA CONTA, IGNORAR (PREVENÇÃO DE LOOP)
    // =========================================================================
    const myPhone = (sock.user?.id || '').split(':')[0].split('@')[0] || config.PAIRING_NUMBER;
    const chatPhone = (chatId || '').split(':')[0].split('@')[0];
    const myLid = (sock.user?.lid || '').split(':')[0].split('@')[0];

    const isSelfChat = Boolean(
      key.fromMe && (
        (myPhone && chatPhone && myPhone === chatPhone) ||
        (myLid && chatId.includes(myLid)) ||
        (config.PAIRING_NUMBER && chatId.includes(config.PAIRING_NUMBER)) ||
        (sock.user?.id && chatId.includes(sock.user.id.split('@')[0]))
      )
    );

    const rawText = (
      rawMessage.message?.conversation ||
      rawMessage.message?.extendedTextMessage?.text ||
      rawMessage.message?.imageMessage?.caption ||
      rawMessage.message?.videoMessage?.caption || ''
    ).trim();
    const isExplicitCommand = rawText.startsWith('/');

    // Ignora mensagens enviadas pelo próprio bot (respostas, avisos do pix, QR codes, etc) para prevenir loop
    if (key.fromMe) {
      const isBotOutgoing =
        rawText.includes('⚡ *PIX') ||
        rawText.includes('⚡ PIX') ||
        rawText.includes('CHAVE PIX') ||
        rawText.includes('CÓDIGO PIX') ||
        rawText.includes('Recebi sua mídia') ||
        rawText.includes('VOCÊ É UM ASSINANTE VIP') ||
        rawText.includes('PLANOS VIP') ||
        rawText.includes('Continue criando agora');
      if (isBotOutgoing) {
        logger.debug({ messageId }, 'Mensagem de saída do bot ignorada para evitar auto-resposta');
        return;
      }
    }

    const isPollVote = Boolean(
      rawMessage.message?.pollUpdateMessage ||
      rawMessage.message?.ephemeralMessage?.message?.pollUpdateMessage ||
      rawMessage.message?.viewOnceMessage?.message?.pollUpdateMessage
    );

    if (key.fromMe && !isSelfChat && !isExplicitCommand && !isPollVote) {
      console.log(`⏩ Mensagem ignorada: enviada pela própria conta para terceiros (chat: ${chatId})`);
      logger.debug(
        { event: 'message_ignored_own', messageId },
        'Mensagem enviada pela própria conta ignorada para evitar loop'
      );
      return;
    }

    // =========================================================================
    // REGRA 4: PREVENÇÃO DE DUPLICATAS (DEDUPLICAÇÃO POR MESSAGE ID)
    // =========================================================================
    if (recentMessages.has(messageId)) {
      logger.debug({ messageId }, 'Mensagem duplicada ou já processada recentemente');
      return;
    }
    recentMessages.add(messageId);

    // =========================================================================
    // REGRA 4.5: VOTO EM ENQUETE INTERATIVA (POLL UPDATE MESSAGE)
    // =========================================================================
    const normalizedMsg = normalizeMessageContent(rawMessage.message);
    const pollUpdate = normalizedMsg?.pollUpdateMessage;
    if (pollUpdate) {
      await this.handlePollVoteUpsert(sock, rawMessage, pollUpdate);
      return;
    }

    // =========================================================================
    // REGRA 5: DETECÇÃO DE CONTEÚDO E MÍDIA
    // =========================================================================
    const detected = detectMedia(rawMessage);

    const quotedRaw =
      rawMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage || undefined;
    const detectedQuoted = quotedRaw ? detectMedia(quotedRaw) : undefined;

    const extracted: ExtractedMessage = {
      id: messageId,
      chatId,
      senderJid: key.participant || chatId,
      fromMe: Boolean(key.fromMe),
      isGroup: false,
      mediaType: detected.type,
      caption: detected.caption,
      text: detected.text,
      timestamp: Number(rawMessage.messageTimestamp) || Date.now(),
      rawMediaMessage: detected.rawMediaMessage,
      rawMessage,
      quotedMessage: detectedQuoted
        ? {
            id: rawMessage.message?.extendedTextMessage?.contextInfo?.stanzaId || 'quoted',
            chatId,
            senderJid:
              rawMessage.message?.extendedTextMessage?.contextInfo?.participant || chatId,
            fromMe: false,
            isGroup: false,
            mediaType: detectedQuoted.type,
            caption: detectedQuoted.caption,
            text: detectedQuoted.text,
            timestamp: Date.now(),
            rawMediaMessage: detectedQuoted.rawMediaMessage,
            rawMessage: quotedRaw,
          }
        : undefined,
    };

    logger.info(
      {
        event: 'message_received',
        chat: sanitizeJidForLogs(chatId),
        mediaType: detected.type,
        hasQuoted: Boolean(extracted.quotedMessage),
      },
      `Mensagem privada recebida (tipo: ${detected.type})`
    );

    const commandText = (extracted.caption || extracted.text || '').trim();
    const parsedCmd = parseCommand(commandText);

    console.log(`💬 Chat ${chatId} | Tipo: ${detected.type} | Texto: "${commandText}"`);

    const senderPhone = (extracted.senderJid || chatId || '').split(':')[0].split('@')[0];
    const senderName = rawMessage.pushName || 'Desconhecido';

    // =========================================================================
    // REGRA 6.0: CRIAÇÃO INTUITIVA DE PACK POR NOME DIRETO (SEM /PACK)
    // =========================================================================
    const pendingPack = pendingPackCreation.get(senderPhone);
    if (pendingPack && !parsedCmd.isCommand && commandText && detected.type === 'UNKNOWN') {
      pendingPackCreation.delete(senderPhone);
      const packName = commandText.trim();
      const created = packManager.createPack(packName, senderPhone);

      await stickerSender.sendText(
        sock,
        chatId,
        [
          '✅ *Pack Criado com Sucesso!*',
          `📦 Nome: *${created.name}*`,
          '',
          '👉 *Como adicionar figurinhas:*',
          '• Toque em *📁 Salvar no Meu Pack* logo após criar qualquer figurinha',
          `• Ou responda a qualquer figurinha digitando: */pack add ${created.name}*`,
          '',
          '👉 *Para enviar seu pack:*',
          `• Digite: */pack enviar ${created.name}*`,
          `• Para compartilhar com amigos: */pack compartilhar ${created.name}*`,
        ].join('\n'),
        rawMessage
      );
      return;
    }

    // =========================================================================
    // REGRA 6.1: BOT MASTER SWITCH (ATIVO / PAUSADO VIA DASHBOARD)
    // =========================================================================
    if (!botState.isBotActive() && !isSelfChat) {
      logger.info({ chat: chatId }, 'Mensagem ignorada: Bot está pausado no painel de controle');
      if (detected.type !== 'UNKNOWN' || parsedCmd.isCommand) {
        activityStore.addActivity({
          senderName,
          senderPhone,
          mediaType: (detected.type !== 'UNKNOWN' ? detected.type : 'STICKER') as any,
          status: 'Unauthorized',
          failureReason: 'Bot currently paused',
          commandUsed: parsedCmd.isCommand ? `/${parsedCmd.name}` : undefined,
        });
      }
      return;
    }

    // =========================================================================
    // REGRA 6.2: CONTROLE DE ACESSO (WHITELIST / ONLY ME / EVERYONE)
    // =========================================================================
    const access = accessControl.isAllowed(chatId, extracted.senderJid, isSelfChat, parsedCmd.isCommand);
    if (!access.allowed) {
      console.log(`⛔ Mensagem de ${senderName} (${chatId}) bloqueada pelo Controle de Acesso [Motivo: ${access.reason || 'Não autorizado'}]`);
      logger.info({ chat: chatId, reason: access.reason }, 'Mensagem rejeitada por controle de acesso');
      if (detected.type !== 'UNKNOWN' || parsedCmd.isCommand) {
        activityStore.addActivity({
          senderName,
          senderPhone,
          mediaType: (detected.type !== 'UNKNOWN' ? detected.type : 'STICKER') as any,
          status: 'Unauthorized',
          failureReason: access.reason || 'User not on Whitelist',
          commandUsed: parsedCmd.isCommand ? `/${parsedCmd.name}` : undefined,
        });
      }
      return;
    }

    const currentSettings = botState.getSettings();

    // =========================================================================
    // REGRA 6.3: COMANDOS EXPLÍCITOS (/help, /sticker, /meme, etc.)
    // =========================================================================
    if (currentSettings.commandsEnabled && parsedCmd.isCommand) {
      console.log(`🤖 Executando comando /${parsedCmd.name}...`);
      await commandRouter.route({
        message: extracted,
        command: parsedCmd,
        reply: async (text: string) => {
          await stickerSender.sendText(sock, chatId, text, rawMessage);
        },
        sendSticker: async (buffer: Buffer, isAnimated = false) => {
          await stickerSender.sendSticker(sock, chatId, buffer, rawMessage, { isAnimated });
        },
        processMedia: async (options) => {
          await this.queueMediaProcessing(
            sock,
            extracted,
            extracted.quotedMessage && extracted.quotedMessage.mediaType !== 'UNKNOWN'
              ? extracted.quotedMessage
              : extracted,
            options
          );
        },
        senderPhone,
        senderName,
        isSelfChat,
      });
      return;
    }

    // =========================================================================
    // REGRA 6.3.5: RESPOSTAS A BOTÕES INTERATIVOS E ATALHOS VIP (1, 2, 3)
    // =========================================================================
    const rawMsg: any = rawMessage.message;
    let buttonId: string | undefined;
    if (rawMsg?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
      try {
        const parsed = JSON.parse(rawMsg.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
        buttonId = parsed.id;
      } catch {}
    } else if (rawMsg?.buttonsResponseMessage?.selectedButtonId) {
      buttonId = rawMsg.buttonsResponseMessage.selectedButtonId;
    } else if (rawMsg?.templateButtonReplyMessage?.selectedId) {
      buttonId = rawMsg.templateButtonReplyMessage.selectedId;
    }

    const lowerCmd = commandText.toLowerCase().trim();
    const isButtonOrVipShortcut =
      buttonId ||
      lowerCmd.includes('ativar_vip') ||
      lowerCmd.includes('ativar vip') ||
      lowerCmd.includes('pix_pro') ||
      lowerCmd.includes('pix pro') ||
      lowerCmd.includes('pix_mestre') ||
      lowerCmd.includes('pix mestre') ||
      lowerCmd.includes('beneficios');

    if (isButtonOrVipShortcut) {
      const target = (buttonId || lowerCmd).toLowerCase();
      let subCmd = 'planos';
      if (target.includes('pix_pro') || target.includes('pix pro')) {
        subCmd = 'pro';
      } else if (target.includes('pix_mestre') || target.includes('pix mestre')) {
        subCmd = 'mestre';
      } else if (target.includes('beneficios')) {
        subCmd = 'beneficios';
      }

      await commandRouter.route({
        message: extracted,
        command: { name: 'vip', args: [subCmd], rawText: commandText, isCommand: true },
        reply: async (text: string) => {
          await stickerSender.sendText(sock, chatId, text, rawMessage);
        },
        sendSticker: async (buffer: Buffer, isAnimated = false) => {
          await stickerSender.sendSticker(sock, chatId, buffer, rawMessage, { isAnimated });
        },
        processMedia: async () => {},
        senderPhone,
        senderName,
        isSelfChat,
      });
      return;
    }

    // =========================================================================
    // REGRA 6.3.8: RECONHECIMENTO INTELIGENTE DE COMPROVANTE DE PAGAMENTO PIX
    // =========================================================================
    const pendingPayment = receiptManager.getPendingPayment(chatId);
    if (pendingPayment) {
      // 1. Usuário em cobrança ativa enviou apenas texto ("paguei", etc.)
      if (
        receiptManager.isPendingReceiptText({
          captionOrText: commandText,
          mediaType: detected.type,
          hasPendingPayment: true,
        })
      ) {
        console.log(`💬 Usuário ${senderName} (${chatId}) enviou texto aguardando comprovante.`);
        const friendlyNotice = [
          '💳 *Entendi! Só preciso do comprovante para continuar.*',
          '',
          '📎 *Envie a imagem ou PDF do pagamento por aqui.*',
          'Assim que você enviar o arquivo, encaminho para conferência e liberação rápida! ✨',
        ].join('\n');

        await stickerSender.sendText(sock, chatId, friendlyNotice, rawMessage);
        return;
      }
    }

    // 2. Verificação estrita de arquivo real (APENAS IMAGE ou DOCUMENT/PDF)
    const isComprovante = receiptManager.isReceiptMessage({
      captionOrText: commandText,
      mediaType: detected.type,
      hasPendingPayment: Boolean(pendingPayment),
      quotedText: extracted.quotedMessage?.text || extracted.quotedMessage?.caption,
      mimetype:
        rawMessage.message?.documentMessage?.mimetype ||
        rawMessage.message?.imageMessage?.mimetype,
    });

    if (isComprovante) {
      let isDuplicate = false;
      await userLock.acquire(`receipt:${chatId}`, async () => {
        const receiptDedupKey = `receipt-${chatId}-${messageId}`;
        if (receiptManager.isAlreadyProcessedReceipt(receiptDedupKey)) {
          isDuplicate = true;
          return;
        }
        receiptManager.markReceiptProcessed(receiptDedupKey);
        receiptManager.clearPendingPayment(chatId);
        sessionManager.cancelSession(chatId, 'Comprovante recebido');
      });

      if (isDuplicate) {
        logger.debug({ chatId, messageId }, 'Comprovante duplicado ignorado');
        return;
      }

      const planName = pendingPayment?.planName || 'Plano VIP';
      console.log(`🧾 Comprovante detectado de ${senderName} (${chatId}) para o ${planName}!`);
      logger.info({ chatId, planName, senderPhone }, 'Comprovante de pagamento Pix recebido');

      const confirmText = [
        '🧾 *Comprovante recebido!* 📸',
        '────────────────────────────',
        `Já recebemos seu comprovante de pagamento do *${planName}*! 🎉`,
        '',
        '🔍 Encaminhei para conferência manual.',
        '⏳ *Prazo de ativação:* de *5 a 10 horas* para verificação e liberação.',
        '',
        'Assim que for aprovado, seu VIP será ativado automaticamente e avisaremos aqui! ❤️',
        '',
        '💡 _Desejava transformar essa foto em figurinha? Envie */s* respondendo a ela!_',
      ].join('\n');

      await stickerSender.sendText(sock, chatId, confirmText, rawMessage);

      activityStore.addActivity({
        senderName,
        senderPhone,
        mediaType: (detected.type === 'VIDEO' || detected.type === 'GIF' ? detected.type : 'IMAGE') as any,
        status: 'Processed',
        commandUsed: 'Comprovante Pix',
      });
      return;
    }

    // =========================================================================
    // REGRA 6.4: RESPOSTA A SESSÃO INTERATIVA ATIVA (FASE A / B)
    // =========================================================================
    const activeSession = sessionManager.getSession(chatId, extracted.senderJid);
    if (activeSession && detected.type === 'TEXT') {
      const handled = await this.handleInteractiveReply(
        sock,
        rawMessage,
        extracted,
        activeSession,
        commandText
      );
      if (handled) return;
    }

    // Se não for mídia suportada (ex: texto comum, áudio, documento, sticker) -> ignorar silenciosamente
    if (
      detected.type !== 'IMAGE' &&
      detected.type !== 'VIDEO' &&
      detected.type !== 'GIF'
    ) {
      logger.debug(
        { event: 'message_ignored_type', type: detected.type },
        `Tipo de mensagem ignorado: ${detected.type}`
      );
      return;
    }

    // Verifica se o tipo específico está habilitado no estado dinâmico
    if (detected.type === 'IMAGE' && !currentSettings.autoImage) return;
    if (detected.type === 'VIDEO' && !currentSettings.autoVideo) return;
    if (detected.type === 'GIF' && !currentSettings.autoGif) return;

    // =========================================================================
    // REGRA 6.5: VERIFICAÇÃO DE COTA DIÁRIA FREEMIUM
    // =========================================================================
    const isVipUser = accessControl.isVip(chatId, extracted.senderJid, isSelfChat);
    if (!isVipUser && currentSettings.freemiumEnabled) {
      if (!dailyLimitStore.canGenerate(senderPhone, currentSettings.dailyFreeLimit)) {
        const limit = currentSettings.dailyFreeLimit || 5;

        let shouldSendLimit = false;
        await userLock.acquire(`limit:${senderPhone}`, async () => {
          if (dailyLimitStore.shouldNotifyLimit(senderPhone)) {
            dailyLimitStore.markLimitNotified(senderPhone);
            shouldSendLimit = true;
          }
        });

        if (shouldSendLimit) {
          const limitAlertText = [
            '💖 *Continue criando agora*',
            '⭐ *Quer fazer mais figurinhas hoje? Com VIP, você cria à vontade.*',
            '',
            '⌛ *Próximas grátis em:* Meia-noite (00:00)',
            `📌 *Uso gratuito:* ${limit}/${limit} utilizado`,
          ].join('\n');

          const fallbackAlertText =
            limitAlertText + '\n\n👉 *Deseja assinar?* Digite */planos* para ver os planos VIP.';

          console.log(`🔒 Limite diário (${limit}/${limit}) atingido por ${senderName} (${senderPhone})`);
          await sendInteractiveMessage(sock, chatId, {
            text: limitAlertText,
            footer: 'Instagram: @𝚝.𝚒𝚋𝚛𝚑𝚡_',
            buttons: [{ name: 'quick_reply', displayText: '🌸 Ativar VIP', id: 'ativar_vip' }],
            fallbackText: fallbackAlertText,
          });

          activityStore.addActivity({
            senderName,
            senderPhone,
            mediaType: detected.type as any,
            status: 'Unauthorized',
            failureReason: `Limite diário atingido (${limit}/${limit})`,
          });
        } else {
          logger.debug({ senderPhone }, '[limit] notificação duplicada suprimida por cooldown');
        }
        return;
      }
    }

    // =========================================================================
    // REGRA 7: PROCESSAMENTO DE MÍDIA (INTERATIVO VS AUTOMÁTICO)
    // =========================================================================
    if (currentSettings.processingMode === 'interactive') {
      const debounceMs = process.env.NODE_ENV === 'test' ? 0 : 1500;

      await sessionManager.addMediaToBatch(
        {
          chatId,
          senderJid: extracted.senderJid,
          sourceMessageId: messageId,
          mediaType: detected.type.toLowerCase() as any,
          mimetype:
            rawMessage.message?.imageMessage?.mimetype ||
            rawMessage.message?.videoMessage?.mimetype ||
            'image/jpeg',
          originalMedia: extracted,
          rawMessage,
        },
        async (session, count) => {
          const isBatch = count > 1;
          const contextMsg = isBatch
            ? `📸 *Recebi ${count} mídias! Como você quer transformar elas?*`
            : '📸 *Recebi sua mídia! Como você quer transformar ela?*';

          logger.info(
            { chatId, sessionId: session.id, count },
            '📱 Menu interativo contextual enviado para lote de mídia'
          );

          await stickerSender.sendText(sock, chatId, contextMsg, session.rawMessage || rawMessage);

          const pollTitle = isBatch ? `🎨 Opções para as ${count} mídias:` : '🎨 Escolha o estilo da figurinha:';
          const pollOptions: SemanticPollOption[] =
            session.mediaType === 'image'
              ? [
                  { id: 'media_normal', title: '🖼️ Figurinha Normal' },
                  { id: 'media_meme', title: '🎭 Meme (Adicionar texto)' },
                  { id: 'media_outline', title: '🔲 Borda Branca' },
                  { id: 'media_shadow', title: '👤 Efeito Sombra' },
                  { id: 'media_static', title: '📸 Imagem estática' },
                  { id: 'cancel', title: '❌ Cancelar' },
                ]
              : [
                  { id: 'media_animated', title: '🎞️ Figurinha animada' },
                  { id: 'media_static', title: '📸 Imagem estática' },
                  { id: 'media_meme', title: '🎭 Meme (Com texto)' },
                  { id: 'cancel', title: '❌ Cancelar' },
                ];

          const sentPoll = await sendInteractivePoll(sock, chatId, {
            type: 'media',
            title: pollTitle,
            options: pollOptions,
            metadata: { sessionId: session.id },
            expiresInMs: 10 * 60 * 1000,
          });

          if (sentPoll?.key?.id) {
            sessionManager.updateSession(session.id, { pollMessageId: sentPoll.key.id });
          }
        },
        debounceMs
      );
      return;
    }

    // Modo automático direto
    console.log(`⚡ Mídia recebida (${detected.type})! Criando figurinha automaticamente sem precisar de comando...`);
    await this.queueMediaProcessing(sock, extracted, extracted);
  }

  /**
   * Processa a resposta do usuário dentro de um fluxo interativo ativo.
   */
  private async handleInteractiveReply(
    sock: WASocket,
    rawMessage: any,
    extracted: ExtractedMessage,
    session: MediaSession,
    text: string
  ): Promise<boolean> {
    const chatId = session.chatId;
    const lower = text.trim().toLowerCase();

    // Cancelamento
    if (lower === 'cancel' || ['cancelar', '/cancel', '0', 'sair', 'cancel'].includes(lower)) {
      sessionManager.cancelSession(chatId, 'Cancelado pelo usuário');
      await stickerSender.sendText(sock, chatId, '❌ Operação cancelada.', rawMessage);
      return true;
    }

    const mediaList: ExtractedMessage[] =
      session.mediaList && session.mediaList.length > 0
        ? session.mediaList
        : [session.originalMedia || extracted];
    const isBatch = mediaList.length > 1;
    const count = mediaList.length;

    // Helper para processar todas as mídias do lote com uma opção
    const processBatch = async (options: ProcessingOptions = {}) => {
      sessionManager.completeSession(session.id);
      const promises = mediaList.map((media) =>
        this.queueMediaProcessing(sock, extracted, media, options).catch((err) => {
          logger.error({ err, mediaId: media.id }, 'Erro ao processar item do lote');
        })
      );
      await Promise.all(promises);
    };

    // Etapa 1: Escolha da Ação Principal
    if (session.currentStep === 'WAITING_FOR_ACTION') {
      const choice = lower;

      // Helper para identificar a escolha do usuário com total flexibilidade (ex: "1", "1.", "opcao 1", "figurinha")
      const isChoice = (n: string, ...keywords: string[]) => {
        const clean = lower.replace(/[^a-z0-9]/g, '');
        if (
          lower === n ||
          lower.startsWith(`${n}.`) ||
          lower.startsWith(`${n} `) ||
          lower.startsWith(`${n}-`) ||
          lower.startsWith(`${n})`) ||
          clean === n ||
          clean === `opcao${n}` ||
          clean === `opc${n}` ||
          clean.startsWith(`opcao${n}`) ||
          clean.startsWith(`opc${n}`)
        ) {
          return true;
        }
        return keywords.some((kw) => lower.includes(kw));
      };

      if (session.mediaType === 'image') {
        if (choice === 'media_normal' || isChoice('1', 'figurinha', 'figurinhas', 'sticker', 'stickers', 'padrao', 'padrão')) {
          const msg = isBatch
            ? `⏳ Criando ${count} figurinhas...`
            : '⏳ Criando sua figurinha...';
          await stickerSender.sendText(sock, chatId, msg, rawMessage);
          await processBatch();
          return true;
        }

        if (choice === 'media_meme' || isChoice('2', 'meme', 'memes', 'texto')) {
          sessionManager.updateSession(session.id, {
            currentStep: 'WAITING_FOR_TEXT',
            selectedAction: 'meme',
          });
          const memePrompt = isBatch
            ? `🎭 *Criador de Meme (${count} imagens):*\nDigite o texto que deseja adicionar em todas as imagens.\n\n_Dica: Use | para dividir entre topo e rodapé._\nExemplo: *MEU CÓDIGO | COMPILOU*`
            : '🎭 *Criador de Meme:*\nDigite o texto desejado.\n\n_Dica: Use | para dividir entre topo e rodapé._\nExemplo: *MEU CÓDIGO | COMPILOU*';
          await stickerSender.sendText(sock, chatId, memePrompt, rawMessage);
          return true;
        }

        if (choice === 'media_outline' || isChoice('3', 'borda', 'bordas', 'outline', 'contorno')) {
          const msg = isBatch
            ? `⏳ Aplicando contorno branco em ${count} figurinhas...`
            : '⏳ Aplicando contorno branco...';
          await stickerSender.sendText(sock, chatId, msg, rawMessage);
          await processBatch({ outline: '#FFFFFF' });
          return true;
        }

        if (choice === 'media_shadow' || isChoice('4', 'sombra', 'sombras', 'shadow')) {
          const msg = isBatch
            ? `⏳ Aplicando sombra projetada em ${count} figurinhas...`
            : '⏳ Aplicando sombra projetada...';
          await stickerSender.sendText(sock, chatId, msg, rawMessage);
          await processBatch({ shadow: 'soft' });
          return true;
        }

        if (choice === 'media_static' || isChoice('5', 'estatica', 'estática', 'foto', 'fotos', 'imagem', 'imagens')) {
          const msg = isBatch
            ? `⏳ Gerando ${count} imagens estáticas...`
            : '⏳ Gerando imagem estática...';
          await stickerSender.sendText(sock, chatId, msg, rawMessage);
          await processBatch({ forceStatic: true });
          return true;
        }
      } else {
        // GIF ou VÍDEO
        if (choice === 'media_animated' || isChoice('1', 'animada', 'animadas', 'figurinha', 'sticker')) {
          const msg = isBatch
            ? `⏳ Gerando ${count} figurinhas animadas...`
            : '⏳ Gerando figurinha animada...';
          await stickerSender.sendText(sock, chatId, msg, rawMessage);
          await processBatch();
          return true;
        }

        if (choice === 'media_static' || isChoice('2', 'estatica', 'estática', 'frame', 'foto')) {
          const msg = isBatch
            ? `⏳ Extraindo frame estático de ${count} mídias...`
            : '⏳ Extraindo frame estático...';
          await stickerSender.sendText(sock, chatId, msg, rawMessage);
          await processBatch({ forceStatic: true });
          return true;
        }

        if (choice === 'media_meme' || isChoice('3', 'meme', 'memes', 'texto')) {
          sessionManager.updateSession(session.id, {
            currentStep: 'WAITING_FOR_TEXT',
            selectedAction: 'meme',
          });
          const memePrompt = isBatch
            ? `🎭 *Criador de Meme (${count} mídias):*\nDigite o texto para aplicar em todas.\n\nExemplo: *QUANDO O BOT | RESPONDE*`
            : '🎭 *Criador de Meme:*\nDigite o texto para o frame.\n\nExemplo: *QUANDO O BOT | RESPONDE*';
          await stickerSender.sendText(sock, chatId, memePrompt, rawMessage);
          return true;
        }

        if ((choice === 'media_trim' || isChoice('4', 'recortar', 'trim', 'cortar', 'corte') || choice === '4') && session.mediaType === 'video') {
          sessionManager.updateSession(session.id, {
            currentStep: 'WAITING_FOR_PARAMETER',
            selectedAction: 'trim',
          });
          await stickerSender.sendText(
            sock,
            chatId,
            '✂️ *Corte de Vídeo:*\nEnvie a duração em segundos para cortar (ex: *5* ou *8*):',
            rawMessage
          );
          return true;
        }
      }

      await stickerSender.sendText(
        sock,
        chatId,
        '❓ Opção inválida. Toque em uma opção da enquete ou digite o número correspondente.',
        rawMessage
      );
      return true;
    }

    // Etapa 2: Aguardando Texto (Meme)
    if (session.currentStep === 'WAITING_FOR_TEXT') {
      const memeText = text.trim();
      const msg = isBatch
        ? `⏳ Gerando meme para ${count} mídias...`
        : '⏳ Gerando seu meme...';
      await stickerSender.sendText(sock, chatId, msg, rawMessage);
      await processBatch({
        memeText,
        forceStatic: session.mediaType !== 'image',
      });
      return true;
    }

    // Etapa 3: Aguardando Parâmetro (Trim)
    if (session.currentStep === 'WAITING_FOR_PARAMETER') {
      const duration = Number(text.trim()) || 5;
      const msg = isBatch
        ? `⏳ Cortando vídeos para ${duration}s...`
        : `⏳ Cortando vídeo para ${duration}s...`;
      await stickerSender.sendText(sock, chatId, msg, rawMessage);
      await processBatch({
        trimSeconds: Math.max(1, Math.min(10, duration)),
      });
      return true;
    }

    return false;
  }

  /**
   * Cria o job e o envia para a fila de processamento em memória.
   */
  private async queueMediaProcessing(
    sock: WASocket,
    sourceMessage: ExtractedMessage,
    mediaTarget: ExtractedMessage,
    options: ProcessingOptions = {}
  ): Promise<void> {
    const jobId = generateJobId();

    const job: Job = {
      id: jobId,
      chatId: sourceMessage.chatId,
      messageId: mediaTarget.id,
      mediaType: mediaTarget.mediaType,
      status: 'queued',
      createdAt: Date.now(),
    };

    const senderPhone = (sourceMessage.senderJid || sourceMessage.chatId).split(':')[0].split('@')[0];
    const senderName = (sourceMessage.rawMessage as any)?.pushName || 'Desconhecido';

    // FASE I: Aplica preset de qualidade configurado
    const currentSettings = botState.getSettings();
    const finalOptions = applyPresetToOptions(currentSettings.qualityPreset, options);

    const isVipUser = accessControl.isVip(sourceMessage.chatId, sourceMessage.senderJid, sourceMessage.fromMe);
    let hasReservedSlot = false;

    if (!isVipUser && currentSettings.freemiumEnabled) {
      const reserved = await userLock.acquire(`limit:${senderPhone}`, () => {
        return dailyLimitStore.reserveSlot(senderPhone, currentSettings.dailyFreeLimit);
      });

      if (!reserved) {
        if (dailyLimitStore.shouldNotifyLimit(senderPhone)) {
          dailyLimitStore.markLimitNotified(senderPhone);
          const limit = currentSettings.dailyFreeLimit || 5;

          const limitAlertText = [
            '💖 *Continue criando agora*',
            '⭐ *Quer fazer mais figurinhas hoje? Com VIP, você cria à vontade.*',
            '',
            '⌛ *Próximas grátis em:* Meia-noite (00:00)',
            `📌 *Uso gratuito:* ${limit}/${limit} utilizado`,
          ].join('\n');

          const fallbackAlertText =
            limitAlertText + '\n\n👉 *Deseja assinar?* Digite */planos* ou envie *1* para ver os planos VIP.';

          await sendInteractiveMessage(sock, sourceMessage.chatId, {
            text: limitAlertText,
            footer: 'Instagram: @𝚝.𝚒𝚋𝚛𝚑𝚡_',
            buttons: [{ name: 'quick_reply', displayText: '🌸 Ativar VIP', id: 'ativar_vip' }],
            fallbackText: fallbackAlertText,
          });
        }
        return;
      }
      hasReservedSlot = true;
    }

    systemMonitor.addDebugLog('queue', `Job ${jobId} enfileirado`, {
      mediaType: mediaTarget.mediaType,
      preset: currentSettings.qualityPreset,
    });

    try {
      await jobQueue.enqueue(job, async (activeJob) => {
        const jobDir = await createJobDir(activeJob.id);

        try {
          systemMonitor.addDebugLog('processor', `Iniciando download e processamento para job ${jobId}`);

          // 1. Faz o download seguro da mídia (concorrente, sem lock)
          const downloaded = await mediaDownloader.download(
            mediaTarget.rawMessage,
            mediaTarget.mediaType,
            jobDir,
            sock.updateMediaMessage
          );

          // 2. Converte a mídia para figurinha WebP (Sharp para imagem, FFmpeg para vídeo/GIF) (concorrente, sem lock)
          const result = await stickerProcessor.process(
            mediaTarget.mediaType,
            downloaded.filePath,
            jobDir,
            finalOptions
          );

          // 3. Envia a figurinha gerada de volta para o chat privado
          await stickerSender.sendSticker(
            sock,
            sourceMessage.chatId,
            result.outputBuffer,
            mediaTarget.rawMessage || sourceMessage.rawMessage,
            { isAnimated: result.isAnimated }
          );

          console.log(`✅ Figurinha entregue com sucesso para ${sourceMessage.chatId}!`);

          // FASE H: Registra estatística de uso bem-sucedido
          const operationName = finalOptions.memeText
            ? 'meme'
            : finalOptions.outline
            ? 'outline'
            : finalOptions.shadow
            ? 'shadow'
            : finalOptions.forceStatic
            ? 'static'
            : 'sticker';

          statisticsManager.recordSuccess(
            senderPhone,
            senderName,
            mediaTarget.mediaType as any,
            result.processingTimeMs
          );

          // COTA FREEMIUM: Confirmação atômica da reserva (COMMIT)
          if (hasReservedSlot) {
            await userLock.acquire(`limit:${senderPhone}`, () => {
              dailyLimitStore.commitSlot(senderPhone);
              hasReservedSlot = false;
            });
          }

          // FASE F: Histórico metadata-only
          historyStore.record({
            user: senderPhone,
            mediaType: mediaTarget.mediaType,
            operation: operationName,
            result: 'success',
            processingTimeMs: result.processingTimeMs,
            sizeBytes: result.sizeBytes,
          });

          activityStore.addActivity({
            senderName,
            senderPhone,
            mediaType: mediaTarget.mediaType as any,
            status: 'Processed',
            processingTimeMs: result.processingTimeMs,
            sizeKb: Math.round(result.sizeBytes / 1024),
            commandUsed: sourceMessage.caption || sourceMessage.text ? 'Manual' : 'Auto-detect',
          });

          accessControl.incrementConverted(senderPhone);

          systemMonitor.addDebugLog('compression', 'Figurinha entregue com sucesso', {
            sizeBytes: result.sizeBytes,
            processingTimeMs: result.processingTimeMs,
          });

          // ARMAZENAMENTO VOLÁTIL: Retém o buffer em memória até a resposta da enquete do usuário
          const tempStickerId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          pendingStickersStore.set(tempStickerId, {
            buffer: result.outputBuffer,
            metadata: {
              mediaType: mediaTarget.mediaType as any,
              isAnimated: result.isAnimated,
              originUser: senderPhone,
              operation: operationName,
            },
            createdAt: Date.now(),
          });

          // Envia Enquete Interativa de 1 Toque com debounce (aguarda todas as figurinhas enviadas juntas)
          queuePackSuggestion(sock, sourceMessage.chatId, senderPhone, tempStickerId);

          return result;
        } finally {
          await removeJobDir(jobDir);
        }
      });
    } catch (err: any) {
      console.error(`❌ Falha ao processar figurinha: ${err?.message || err}`);
      logger.error({ err, jobId }, 'Erro durante processamento do job de figurinha');

      // FASE F: Histórico de falha
      historyStore.record({
        user: senderPhone,
        mediaType: mediaTarget.mediaType,
        operation: 'sticker',
        result: 'failed',
        processingTimeMs: 0,
        sizeBytes: 0,
      });

      activityStore.addActivity({
        senderName,
        senderPhone,
        mediaType: mediaTarget.mediaType as any,
        status: 'Failed',
        failureReason: err?.message || 'Erro no processamento',
        commandUsed: sourceMessage.caption || sourceMessage.text ? 'Manual' : 'Auto-detect',
      });

      systemMonitor.addDebugLog('processor', 'Falha no processamento do job', {
        error: err?.message,
      });

      const friendlyMsg =
        err instanceof AppError
          ? err.userFriendlyMessage
          : '❌ Não consegui transformar essa mídia em figurinha.';

      await stickerSender.sendText(
        sock,
        sourceMessage.chatId,
        friendlyMsg,
        sourceMessage.rawMessage
      );
    } finally {
      // FALHA OU EXCEÇÃO: Libera a cota reservada (RELEASE) se ainda estiver pendente
      if (hasReservedSlot) {
        await userLock.acquire(`limit:${senderPhone}`, () => {
          dailyLimitStore.releaseSlot(senderPhone);
          hasReservedSlot = false;
        });
      }
    }
  }

  /**
   * Processa eventos de voto em enquetes interativas recebidos via messages.upsert
   */
  public async handlePollVoteUpsert(
    sock: WASocket,
    rawMessage: any,
    pollUpdate: any
  ): Promise<void> {
    const creationKey = pollUpdate.pollCreationMessageKey;
    const pollId = creationKey?.id;
    if (!pollId) return;

    let pollRecord = activePolls.get(pollId);

    // Se não encontrou em activePolls, tenta recuperar da mensagem de criação em cache
    if (!pollRecord) {
      const storedMsg = messageContentStore.get(pollId);
      const pollMsg = storedMsg?.pollCreationMessageV3 || storedMsg?.pollCreationMessage;
      if (pollMsg) {
        const title = pollMsg.name || '';
        const values = (pollMsg.options || []).map((o: any) => o.optionName);
        const secret = storedMsg.messageContextInfo?.messageSecret;
        const pollEncKeyBase64 = secret
          ? (Buffer.isBuffer(secret) ? secret : Buffer.from(secret, typeof secret === 'string' ? 'base64' : undefined)).toString('base64')
          : undefined;
        const type = title.toLowerCase().includes('vip') || title.toLowerCase().includes('plano') ? 'vip' : 'media';

        pollRecord = {
          id: pollId,
          chatId: rawMessage.key.remoteJid,
          type,
          title,
          values,
          status: 'PENDING',
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          pollEncKeyBase64,
        };
        activePolls.set(pollId, pollRecord);
      }
    }

    if (!pollRecord) {
      logger.info({ pollId }, 'Enquete anterior não encontrada em memória/disco');
      return;
    }

    // Previne reprocessamento duplo do mesmo voto
    const voteDedupKey = `poll-vote-${pollId}-${rawMessage.key?.id || Date.now()}`;
    if (recentMessages.has(voteDedupKey)) return;
    recentMessages.add(voteDedupKey);

    // Obtém a chave secreta de criptografia da enquete
    let pollEncKey: Buffer | null = null;
    if (pollRecord.pollEncKeyBase64) {
      pollEncKey = Buffer.from(pollRecord.pollEncKeyBase64, 'base64');
    }
    if (!pollEncKey) {
      const storedMsg = messageContentStore.get(pollId);
      const secret = storedMsg?.messageContextInfo?.messageSecret;
      if (secret) {
        pollEncKey = Buffer.isBuffer(secret)
          ? secret
          : Buffer.from(secret, typeof secret === 'string' ? 'base64' : undefined);
      }
    }

    if (!pollEncKey) {
      logger.warn({ pollId }, 'Chave de criptografia da enquete não localizada');
      return;
    }

    const meIdNormalised = jidNormalizedUser(sock.user?.id || sock.user?.lid || '');
    const myLid = jidNormalizedUser(sock.user?.lid || '');

    const creatorCandidates = [
      meIdNormalised,
      myLid,
      jidNormalizedUser(creationKey.participant || creationKey.remoteJid || ''),
      creationKey.participant,
      creationKey.remoteJid,
    ].filter(Boolean) as string[];

    const voterCandidates = [
      rawMessage.key.fromMe ? meIdNormalised : undefined,
      rawMessage.key.fromMe ? myLid : undefined,
      jidNormalizedUser(rawMessage.key.participant || rawMessage.key.remoteJid || ''),
      rawMessage.key.participantAlt,
      rawMessage.key.remoteJidAlt,
      rawMessage.key.participant,
      rawMessage.key.remoteJid,
    ].filter(Boolean) as string[];

    let decrypted: any = null;
    for (const c of creatorCandidates) {
      for (const v of voterCandidates) {
        try {
          decrypted = decryptPollVote(pollUpdate.vote, {
            pollCreatorJid: c,
            pollMsgId: pollId,
            pollEncKey,
            voterJid: v,
          });
          if (decrypted) break;
        } catch {}
      }
      if (decrypted) break;
    }

    if (!decrypted) {
      logger.warn({ pollId }, 'Falha ao descriptografar voto da enquete com todos os candidatos JID');
      return;
    }

    const selectedHashes = (decrypted.selectedOptions || []).map((b: any) => Buffer.from(b));
    if (selectedHashes.length === 0) {
      logger.debug({ pollId }, 'Opção desmarcada na enquete');
      return;
    }

    let selectedOptionText: string | null = null;
    for (const val of pollRecord.values) {
      const hash = crypto.createHash('sha256').update(Buffer.from(val)).digest();
      if (selectedHashes.some((h: Buffer) => h.equals(hash))) {
        selectedOptionText = val;
        break;
      }
    }

    if (!selectedOptionText) {
      logger.warn({ pollId }, 'Opção votada não identificada na lista de valores da enquete');
      return;
    }

    const chatId = pollRecord.chatId || rawMessage.key.remoteJid;
    const voterJid = rawMessage.key.participant || rawMessage.key.remoteJid || chatId;
    const voterPhone = (voterJid || '').split(':')[0].split('@')[0];
    const isSelfChat = Boolean(rawMessage.key.fromMe);

    console.log(`🗳️ [Enquete] Voto detectado! Opção: "${selectedOptionText}" | Chat: ${chatId} | Tipo: ${pollRecord.type}`);
    logger.info({ chatId, selected: selectedOptionText, type: pollRecord.type }, 'Opção de enquete processada');

    await this.executePollAction(
      sock,
      rawMessage,
      pollRecord,
      selectedOptionText,
      voterPhone,
      voterJid,
      isSelfChat
    );
  }

  /**
   * Processa eventos de voto em enquetes interativas (botões de 1 toque do WhatsApp)
   */
  public async handlePollUpdate(sock: WASocket, update: any): Promise<void> {
    const key = update.key;
    if (!key) return;

    const pollId = key.id;
    const pollRecord = activePolls.get(pollId);
    if (!pollRecord) return;

    const pollCreationMsg = messageContentStore.get(pollId);
    if (!pollCreationMsg) return;

    let votes: any[] = [];
    try {
      votes = getAggregateVotesInPollMessage(
        { message: pollCreationMsg, pollUpdates: update.update?.pollUpdates },
        sock.user?.id
      );
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Erro ao descriptografar voto da enquete');
      return;
    }

    const votedOption = votes.find((v) => v.voters && v.voters.length > 0);
    if (!votedOption || !votedOption.name) return;

    const chatId = pollRecord.chatId;
    const voterJid = votedOption.voters[0] || chatId;
    const voterPhone = (voterJid || '').split(':')[0].split('@')[0];
    const isSelfChat = Boolean(update.key?.fromMe);

    logger.info({ chatId, selected: votedOption.name, type: pollRecord.type }, '👆 Voto/clique em enquete interativa detectado!');

    await this.executePollAction(
      sock,
      update,
      pollRecord,
      votedOption.name,
      voterPhone,
      voterJid,
      isSelfChat
    );
  }

  /**
   * Executa a ação correspondente ao voto/toque registrado em qualquer enquete interativa.
   */
  private async executePollAction(
    sock: WASocket,
    rawMessage: any,
    pollRecord: ActivePollRecord,
    selectedOptionText: string,
    voterPhone: string,
    voterJid: string,
    isSelfChat: boolean
  ): Promise<void> {
    const chatId = pollRecord.chatId || rawMessage.key?.remoteJid;
    if (!chatId) return;

    await userLock.acquire(`poll:${pollRecord.id}`, async () => {
      // 1. Verificação de Idempotência e Expiração
      if (pollRecord.status === 'COMPLETED' || pollRecord.status === 'PROCESSING') {
        logger.debug({ pollId: pollRecord.id, status: pollRecord.status }, 'Enquete já processada ou em processamento');
        return;
      }

      if (pollRecord.expiresAt && Date.now() > pollRecord.expiresAt) {
        pollRecord.status = 'EXPIRED';
        persistActivePolls();
        await stickerSender.sendText(
          sock,
          chatId,
          '⏳ Esta enquete expirou. Envie uma nova mídia ou comando quando desejar!',
          rawMessage
        );
        return;
      }

      pollRecord.status = 'PROCESSING';

      // 2. Resolução Semântica da Opção
      const semanticOption = resolveSemanticPollOption(pollRecord, selectedOptionText);
      const actionId = semanticOption?.id || selectedOptionText.toLowerCase();

      try {
        // 3. Enquetes do Fluxo VIP
        if (pollRecord.type === 'vip') {
          let subCommand = 'planos';
          if (actionId === 'vip_pro' || actionId.includes('pro') || actionId.includes('5')) {
            subCommand = 'pro';
          } else if (actionId === 'vip_mestre' || actionId.includes('mestre') || actionId.includes('10') || actionId.includes('permanente')) {
            subCommand = 'mestre';
          } else if (actionId === 'vip_beneficios' || actionId.includes('beneficio') || actionId.includes('benefício')) {
            subCommand = 'beneficios';
          }

          await commandRouter.route({
            command: {
              name: 'vip',
              args: [subCommand],
              rawText: `/vip ${subCommand}`,
              isCommand: true,
            },
            message: {
              id: `poll-click-${Date.now()}`,
              chatId,
              senderJid: voterJid,
              fromMe: false,
              isGroup: false,
              mediaType: 'UNKNOWN',
              timestamp: Date.now(),
              rawMessage,
            },
            reply: async (text: string) => {
              await stickerSender.sendText(sock, chatId, text, rawMessage);
            },
            sendSticker: async (buffer: Buffer, isAnimated = false) => {
              await stickerSender.sendSticker(sock, chatId, buffer, rawMessage, { isAnimated });
            },
            processMedia: async () => {},
            senderPhone: voterPhone,
            senderName: rawMessage.pushName || 'Usuário',
            isSelfChat,
          });
          pollRecord.status = 'COMPLETED';
          persistActivePolls();
          return;
        }

        // 4. Enquetes de Seleção de Estilo de Mídia (Modo Menu)
        if (pollRecord.type === 'media') {
          const activeSession =
            sessionManager.getSession(chatId, voterJid) ||
            (pollRecord.metadata?.sessionId ? sessionManager.getSessionById(pollRecord.metadata.sessionId) : undefined);

          if (activeSession) {
            await this.handleInteractiveReply(
              sock,
              activeSession.rawMessage || rawMessage,
              activeSession.originalMedia || {
                id: `poll-media-${Date.now()}`,
                chatId,
                senderJid: voterJid,
                fromMe: false,
                isGroup: false,
                mediaType: 'UNKNOWN',
                timestamp: Date.now(),
                rawMessage,
              },
              activeSession,
              actionId
            );
          }
          pollRecord.status = 'COMPLETED';
          persistActivePolls();
          return;
        }

        // 5. Enquetes de Packs de Figurinhas
        if (pollRecord.type === 'pack') {
          const userPhone = pollRecord.metadata?.userPhone || voterPhone;
          const rawIds: string[] = pollRecord.metadata?.stickerIds || [];
          const stickerIds: string[] = Array.isArray(rawIds) && rawIds.length > 0
            ? rawIds
            : pollRecord.metadata?.stickerId
            ? [pollRecord.metadata.stickerId]
            : [];

          // Opção A: Salvar no Meu Pack (persistência confirmada pelo usuário)
          if (actionId === 'save_pack' || actionId === 'save' || selectedOptionText.toLowerCase().includes('salvar')) {
            if (stickerIds.length === 0) {
              await stickerSender.sendText(sock, chatId, '⚠️ Figurinha recente não identificada para salvar.', rawMessage);
              pollRecord.status = 'COMPLETED';
              persistActivePolls();
              return;
            }

            await userLock.acquire(`pack:${userPhone}`, async () => {
              let lastPack = packManager.getOrCreateDefaultPack(userPhone);
              let addedCount = 0;
              for (const sid of stickerIds) {
                const pending = pendingStickersStore.get(sid);
                if (pending) {
                  // Persiste para a biblioteca física no disco apenas com confirmação
                  const saved = await libraryManager.saveSticker(pending.buffer, pending.metadata);
                  const res = packManager.addStickerToPack('default', saved.id, userPhone);
                  lastPack = res.pack;
                  if (res.success) addedCount++;
                  pendingStickersStore.delete(sid);
                } else {
                  const res = packManager.addStickerToPack('default', sid, userPhone);
                  lastPack = res.pack;
                  if (res.success) addedCount++;
                }
              }

              const msg = addedCount > 1
                ? `📁 *${addedCount} figurinhas salvas no seu Pack com sucesso!*\n\n⭐ *Meu Pack:* ${lastPack.stickerIds.length} figurinha(s) salvas.\n👉 Digite */pack enviar* para receber todas no chat quando quiser!`
                : `📁 *Figurinha salva no seu Pack com sucesso!*\n\n⭐ *Meu Pack:* ${lastPack.stickerIds.length} figurinha(s) salvas.\n👉 Digite */pack enviar* para receber todas no chat quando quiser!`;

              await stickerSender.sendText(sock, chatId, msg, rawMessage);
            });

            pollRecord.status = 'COMPLETED';
            persistActivePolls();
            return;
          }

          // Opção B: Não Salvar (entrega realizada, sem persistir na biblioteca)
          if (actionId === 'dont_save' || selectedOptionText.toLowerCase().includes('não salvar') || selectedOptionText.toLowerCase().includes('nao salvar')) {
            await userLock.acquire(`pack:${userPhone}`, () => {
              for (const sid of stickerIds) {
                pendingStickersStore.delete(sid);
              }
            });
            await stickerSender.sendText(
              sock,
              chatId,
              '👍 Tudo certo! A figurinha foi mantida apenas na conversa, sem salvar na sua biblioteca.',
              rawMessage
            );
            pollRecord.status = 'COMPLETED';
            persistActivePolls();
            return;
          }

          // Opção C: Cancelar
          if (actionId === 'cancel' || selectedOptionText.toLowerCase().includes('cancelar')) {
            await userLock.acquire(`pack:${userPhone}`, () => {
              for (const sid of stickerIds) {
                pendingStickersStore.delete(sid);
              }
            });
            await stickerSender.sendText(sock, chatId, '❌ Operação cancelada.', rawMessage);
            pollRecord.status = 'COMPLETED';
            persistActivePolls();
            return;
          }

          // Opção D: Enviar Meu Pack
          if (actionId === 'send_pack' || selectedOptionText.toLowerCase().includes('enviar')) {
            const pack = packManager.getOrCreateDefaultPack(userPhone);
            if (pack.stickerIds.length === 0) {
              await stickerSender.sendText(
                sock,
                chatId,
                '📭 Seu pack ainda está vazio!\nCrie figurinhas e toque em "Salvar no Meu Pack" logo após recebê-las.',
                rawMessage
              );
              pollRecord.status = 'COMPLETED';
              persistActivePolls();
              return;
            }

            const cardSent = await stickerPackSender.sendStickerPackCard(sock, chatId, pack, rawMessage);
            if (cardSent) {
              pollRecord.status = 'COMPLETED';
              persistActivePolls();
              return;
            }

            const buffers = await packManager.getStickerBuffersForPack(pack.id);
            if (buffers.length === 0) {
              await stickerSender.sendText(
                sock,
                chatId,
                `⚠️ As figurinhas de "${pack.name}" não foram encontradas no disco.`,
                rawMessage
              );
              pollRecord.status = 'COMPLETED';
              persistActivePolls();
              return;
            }

            await stickerSender.sendText(
              sock,
              chatId,
              `🚀 *Enviando ${buffers.length} figurinhas do seu pack...* Aguarde alguns segundos!`,
              rawMessage
            );

            for (const item of buffers) {
              await stickerSender.sendSticker(sock, chatId, item.buffer, rawMessage, {
                isAnimated: item.isAnimated,
              });
              await new Promise((r) => setTimeout(r, 350));
            }

            await stickerSender.sendText(
              sock,
              chatId,
              `✅ *Prontinho! ${buffers.length} figurinhas entregues com sucesso!* 🎉`,
              rawMessage
            );
            pollRecord.status = 'COMPLETED';
            persistActivePolls();
            return;
          }

          // Opção E: Criar Novo Pack
          if (actionId === 'new_pack' || selectedOptionText.toLowerCase().includes('criar')) {
            pendingPackCreation.set(userPhone, { chatId, timestamp: Date.now() });
            await stickerSender.sendText(
              sock,
              chatId,
              '✍️ *Criando seu novo Pack de Figurinhas!*\n\n👉 *Basta digitar o nome do seu pack aqui abaixo:*\n_(Exemplo: Memes, Gatinhos, Zoeira, etc.)_',
              rawMessage
            );
            pollRecord.status = 'COMPLETED';
            persistActivePolls();
            return;
          }

          // Opção F: Compartilhar com Amigos
          if (actionId === 'share_pack' || selectedOptionText.toLowerCase().includes('compartilhar')) {
            const pack = packManager.getOrCreateDefaultPack(userPhone);
            await stickerSender.sendText(
              sock,
              chatId,
              [
                '🔗 *COMPARTILHAR SEU PACK COM AMIGOS*',
                `📦 Pack: *${pack.name}* (${pack.stickerIds.length} figurinhas)`,
                '',
                '📢 *Envie esta mensagem para seus amigos:*',
                '────────────────────────────',
                `Olha esse pack de figurinhas que criei no WhatsApp Auto Sticker!`,
                `Envie para o bot:`,
                `*/pack baixar ${pack.name}*`,
                '────────────────────────────',
              ].join('\n'),
              rawMessage
            );
            pollRecord.status = 'COMPLETED';
            persistActivePolls();
            return;
          }

          // Opção G: Limpar Meu Pack
          if (actionId === 'clear_pack' || selectedOptionText.toLowerCase().includes('limpar')) {
            packManager.clearPack('default', userPhone);
            await stickerSender.sendText(sock, chatId, '🗑️ *Seu "Meu Pack" foi esvaziado com sucesso!*', rawMessage);
            pollRecord.status = 'COMPLETED';
            persistActivePolls();
            return;
          }

          pollRecord.status = 'COMPLETED';
          persistActivePolls();
          return;
        }

        // 6. Enquetes de Atalhos da Ajuda (/help)
        if (pollRecord.type === 'help') {
          let targetCmd = 'vip';
          let args: string[] = ['planos'];

          if (actionId === 'help_pack' || selectedOptionText.toLowerCase().includes('pack')) {
            targetCmd = 'pack';
            args = [];
          } else if (actionId === 'help_cafe' || selectedOptionText.toLowerCase().includes('café') || selectedOptionText.toLowerCase().includes('cafe') || selectedOptionText.toLowerCase().includes('doar')) {
            targetCmd = 'cafe';
            args = [];
          } else if (actionId === 'help_mode' || selectedOptionText.toLowerCase().includes('modo')) {
            targetCmd = 'modo';
            args = [];
          }

          await commandRouter.route({
            command: {
              name: targetCmd,
              args,
              rawText: `/${targetCmd}`,
              isCommand: true,
            },
            message: {
              id: `poll-click-${Date.now()}`,
              chatId,
              senderJid: voterJid,
              fromMe: false,
              isGroup: false,
              mediaType: 'UNKNOWN',
              timestamp: Date.now(),
              rawMessage,
            },
            reply: async (text: string) => {
              await stickerSender.sendText(sock, chatId, text, rawMessage);
            },
            sendSticker: async (buffer: Buffer, isAnimated = false) => {
              await stickerSender.sendSticker(sock, chatId, buffer, rawMessage, { isAnimated });
            },
            processMedia: async () => {},
            senderPhone: voterPhone,
            senderName: rawMessage.pushName || 'Usuário',
            isSelfChat,
          });
          pollRecord.status = 'COMPLETED';
          persistActivePolls();
          return;
        }

        // 7. Enquetes de Troca de Modo (/modo)
        if (pollRecord.type === 'mode') {
          if (actionId === 'mode_auto') {
            botState.setProcessingMode('automatic');
            await stickerSender.sendText(
              sock,
              chatId,
              '⚡ *Modo Automático ativado!*\n\nAgora você pode enviar fotos e vídeos que eles virarão figurinhas *imediatamente*!',
              rawMessage
            );
          } else if (actionId === 'mode_interactive') {
            botState.setProcessingMode('interactive');
            await stickerSender.sendText(
              sock,
              chatId,
              '📱 *Modo Interativo (Menu) ativado!*\n\nAo enviar fotos ou vídeos, o bot exibirá o menu com opções de memes, bordas, sombras e efeitos.',
              rawMessage
            );
          }
          pollRecord.status = 'COMPLETED';
          persistActivePolls();
          return;
        }

        pollRecord.status = 'COMPLETED';
        persistActivePolls();
      } catch (err: any) {
        logger.error({ err: err?.message, pollId: pollRecord.id }, 'Erro ao executar ação da enquete');
        pollRecord.status = 'PENDING'; // Permite re-tentativa caso ocorra falha
        throw err;
      }
    });
  }
}

export const messageRouter = new MessageRouter();
