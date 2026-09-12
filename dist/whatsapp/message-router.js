import { isGroupChat, isBroadcastChat, isNewsletterChat, sanitizeJidForLogs } from './chat-utils.js';
import { detectMedia } from '../media/media-detector.js';
import { parseCommand } from '../commands/command-parser.js';
import { commandRouter } from '../commands/command-router.js';
import { mediaDownloader } from './media-downloader.js';
import { stickerSender } from './sticker-sender.js';
import { stickerProcessor } from '../media/sticker-processor.js';
import { jobQueue } from '../queue/job-queue.js';
import { recentMessages } from '../utils/cache.js';
import { createJobDir, removeJobDir } from '../utils/files.js';
import { generateJobId } from '../utils/ids.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { AppError } from '../utils/errors.js';
import { botState } from '../control/bot-state.js';
import { accessControl } from '../control/access-control.js';
import { activityStore } from '../control/activity-store.js';
export class MessageRouter {
    botStartedAtSeconds = Math.floor(Date.now() / 1000) - 10;
    /**
     * Ponto central de entrada para todos os eventos de novas mensagens do Baileys.
     */
    async handleMessage(sock, rawMessage) {
        const key = rawMessage?.key;
        if (!key)
            return;
        const chatId = key.remoteJid;
        const messageId = key.id;
        if (!chatId || !messageId)
            return;
        // =========================================================================
        // REGRA 1 (ABSOLUTA): SE FOR GRUPO, IGNORAR IMEDIATAMENTE ANTES DE QUALQUER DOWNLOAD
        // =========================================================================
        if (isGroupChat(chatId)) {
            logger.debug({ event: 'message_ignored_group', chat: sanitizeJidForLogs(chatId) }, 'Mensagem de grupo descartada imediatamente (GROUP = IGNORE)');
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
            logger.debug({ messageId, msgTimestamp, startedAt: this.botStartedAtSeconds }, 'Mensagem histórica ou recebida offline antes da inicialização do bot descartada');
            return;
        }
        // =========================================================================
        // REGRA 3: SE FOR MENSAGEM DA PRÓPRIA CONTA, IGNORAR (PREVENÇÃO DE LOOP)
        // EXCETO SE:
        // 1. O usuário estiver no chat com ele mesmo (isSelfChat)
        // 2. Ou se for um comando manual explícito (/help, /sticker, /status, etc.)
        // 3. Ou se IGNORE_OWN_MESSAGES for false
        // =========================================================================
        const myPhone = (sock.user?.id || '').split(':')[0].split('@')[0] || config.PAIRING_NUMBER;
        const chatPhone = (chatId || '').split(':')[0].split('@')[0];
        const myLid = (sock.user?.lid || '').split(':')[0].split('@')[0];
        const isSelfChat = Boolean(chatId.endsWith('@lid') ||
            (myLid && chatId.includes(myLid)) ||
            (myPhone && chatPhone && myPhone === chatPhone) ||
            (config.PAIRING_NUMBER && chatId.includes(config.PAIRING_NUMBER)) ||
            (sock.user?.id && chatId.includes(sock.user.id.split('@')[0])) ||
            !config.IGNORE_OWN_MESSAGES);
        const rawText = (rawMessage.message?.conversation ||
            rawMessage.message?.extendedTextMessage?.text ||
            rawMessage.message?.imageMessage?.caption ||
            rawMessage.message?.videoMessage?.caption || '').trim();
        const isExplicitCommand = rawText.startsWith('/');
        if (key.fromMe && config.IGNORE_OWN_MESSAGES && !isSelfChat && !isExplicitCommand) {
            console.log(`⏩ Mensagem ignorada: enviada pela própria conta para terceiros (chat: ${chatId})`);
            logger.debug({ event: 'message_ignored_own', messageId }, 'Mensagem enviada pela própria conta ignorada para evitar loop');
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
        // REGRA 5: DETECÇÃO DE CONTEÚDO E MÍDIA
        // =========================================================================
        const detected = detectMedia(rawMessage);
        // Extrai mensagem citada (quoted) se houver
        const quotedRaw = rawMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage || undefined;
        const detectedQuoted = quotedRaw ? detectMedia(quotedRaw) : undefined;
        const extracted = {
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
                    senderJid: rawMessage.message?.extendedTextMessage?.contextInfo?.participant || chatId,
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
        logger.info({
            event: 'message_received',
            chat: sanitizeJidForLogs(chatId),
            mediaType: detected.type,
            hasQuoted: Boolean(extracted.quotedMessage),
        }, `Mensagem privada recebida (tipo: ${detected.type})`);
        const commandText = extracted.caption || extracted.text || '';
        const parsedCmd = parseCommand(commandText);
        console.log(`💬 Chat ${chatId} | Tipo: ${detected.type} | Texto: "${commandText}"`);
        const senderPhone = (extracted.senderJid || chatId || '').split(':')[0].split('@')[0];
        const senderName = rawMessage.pushName || 'Desconhecido';
        // =========================================================================
        // REGRA 6.1: BOT MASTER SWITCH (ATIVO / PAUSADO VIA DASHBOARD)
        // =========================================================================
        if (!botState.isBotActive() && !isSelfChat) {
            logger.info({ chat: chatId }, 'Mensagem ignorada: Bot está pausado no painel de controle');
            if (detected.type !== 'UNKNOWN' || parsedCmd.isCommand) {
                activityStore.addActivity({
                    senderName,
                    senderPhone,
                    mediaType: (detected.type !== 'UNKNOWN' ? detected.type : 'STICKER'),
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
        const access = accessControl.isAllowed(chatId, extracted.senderJid, isSelfChat);
        if (!access.allowed) {
            logger.info({ chat: chatId, reason: access.reason }, 'Mensagem rejeitada por controle de acesso');
            if (detected.type !== 'UNKNOWN' || parsedCmd.isCommand) {
                activityStore.addActivity({
                    senderName,
                    senderPhone,
                    mediaType: (detected.type !== 'UNKNOWN' ? detected.type : 'STICKER'),
                    status: 'Unauthorized',
                    failureReason: access.reason || 'User not on Whitelist',
                    commandUsed: parsedCmd.isCommand ? `/${parsedCmd.name}` : undefined,
                });
            }
            return;
        }
        const currentSettings = botState.getSettings();
        if (currentSettings.commandsEnabled && parsedCmd.isCommand) {
            console.log(`🤖 Executando comando /${parsedCmd.name}...`);
            await commandRouter.route({
                message: extracted,
                command: parsedCmd,
                reply: async (text) => {
                    await stickerSender.sendText(sock, chatId, text, rawMessage);
                },
                processMedia: async (options) => {
                    await this.queueMediaProcessing(sock, extracted, extracted.quotedMessage && extracted.quotedMessage.mediaType !== 'UNKNOWN'
                        ? extracted.quotedMessage
                        : extracted, options);
                },
            });
            return;
        }
        // =========================================================================
        // REGRA 7: MODO AUTOMÁTICO DE CRIAÇÃO DE FIGURINHAS
        // =========================================================================
        if (!config.AUTO_STICKER) {
            return;
        }
        // Verifica se o tipo específico está habilitado no estado dinâmico
        if (detected.type === 'IMAGE' && !currentSettings.autoImage)
            return;
        if (detected.type === 'VIDEO' && !currentSettings.autoVideo)
            return;
        if (detected.type === 'GIF' && !currentSettings.autoGif)
            return;
        // Se não for mídia suportada (ex: texto comum, áudio, documento, sticker) -> ignorar silenciosamente
        if (detected.type !== 'IMAGE' &&
            detected.type !== 'VIDEO' &&
            detected.type !== 'GIF') {
            logger.debug({ event: 'message_ignored_type', type: detected.type }, `Tipo de mensagem ignorado: ${detected.type}`);
            return;
        }
        // Enfileira para processamento automático
        console.log(`⚡ Mídia recebida (${detected.type})! Criando figurinha automaticamente sem precisar de comando...`);
        await this.queueMediaProcessing(sock, extracted, extracted);
    }
    /**
     * Cria o job e o envia para a fila de processamento em memória.
     */
    async queueMediaProcessing(sock, sourceMessage, mediaTarget, options = {}) {
        const jobId = generateJobId();
        const job = {
            id: jobId,
            chatId: sourceMessage.chatId,
            messageId: mediaTarget.id,
            mediaType: mediaTarget.mediaType,
            status: 'queued',
            createdAt: Date.now(),
        };
        try {
            await jobQueue.enqueue(job, async (activeJob) => {
                const jobDir = await createJobDir(activeJob.id);
                try {
                    // 1. Faz o download seguro da mídia
                    const downloaded = await mediaDownloader.download(mediaTarget.rawMessage, mediaTarget.mediaType, jobDir, sock.updateMediaMessage);
                    // 2. Converte a mídia para figurinha WebP (Sharp para imagem, FFmpeg para vídeo/GIF)
                    const result = await stickerProcessor.process(mediaTarget.mediaType, downloaded.filePath, jobDir, options);
                    // 3. Envia a figurinha gerada de volta para o chat privado
                    await stickerSender.sendSticker(sock, sourceMessage.chatId, result.outputBuffer, sourceMessage.rawMessage, { isAnimated: result.isAnimated });
                    console.log(`✅ Figurinha entregue com sucesso para ${sourceMessage.chatId}!`);
                    activityStore.addActivity({
                        senderName: sourceMessage.rawMessage?.pushName || 'Desconhecido',
                        senderPhone: (sourceMessage.senderJid || sourceMessage.chatId).split(':')[0].split('@')[0],
                        mediaType: mediaTarget.mediaType,
                        status: 'Processed',
                        processingTimeMs: result.processingTimeMs,
                        sizeKb: Math.round(result.sizeBytes / 1024),
                        commandUsed: sourceMessage.caption || sourceMessage.text ? 'Manual' : 'Auto-detect',
                    });
                    accessControl.incrementConverted((sourceMessage.senderJid || sourceMessage.chatId).split(':')[0].split('@')[0]);
                    return result;
                }
                finally {
                    // Garante a limpeza completa dos arquivos temporários após conclusão ou erro
                    await removeJobDir(jobDir);
                }
            });
        }
        catch (err) {
            console.error(`❌ Falha ao processar figurinha: ${err?.message || err}`);
            logger.error({ err, jobId }, 'Erro durante processamento do job de figurinha');
            activityStore.addActivity({
                senderName: sourceMessage.rawMessage?.pushName || 'Desconhecido',
                senderPhone: (sourceMessage.senderJid || sourceMessage.chatId).split(':')[0].split('@')[0],
                mediaType: mediaTarget.mediaType,
                status: 'Failed',
                failureReason: err?.message || 'Erro no processamento',
                commandUsed: sourceMessage.caption || sourceMessage.text ? 'Manual' : 'Auto-detect',
            });
            // Se falhar em conversa privada, envia uma mensagem amigável de erro
            const friendlyMsg = err instanceof AppError
                ? err.userFriendlyMessage
                : '❌ Não consegui transformar essa mídia em figurinha.';
            await stickerSender.sendText(sock, sourceMessage.chatId, friendlyMsg, sourceMessage.rawMessage);
        }
    }
}
export const messageRouter = new MessageRouter();
//# sourceMappingURL=message-router.js.map