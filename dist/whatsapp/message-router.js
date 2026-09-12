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
import { sessionManager } from '../control/session-manager.js';
import { libraryManager } from '../storage/library-manager.js';
import { historyStore } from '../storage/history-store.js';
import { statisticsManager } from '../control/statistics-manager.js';
import { applyPresetToOptions } from '../media/presets.js';
import { systemMonitor } from '../control/system-monitor.js';
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
        // =========================================================================
        const myPhone = (sock.user?.id || '').split(':')[0].split('@')[0] || config.PAIRING_NUMBER;
        const chatPhone = (chatId || '').split(':')[0].split('@')[0];
        const myLid = (sock.user?.lid || '').split(':')[0].split('@')[0];
        const isSelfChat = Boolean(key.fromMe && ((myPhone && chatPhone && myPhone === chatPhone) ||
            (myLid && chatId.includes(myLid)) ||
            (config.PAIRING_NUMBER && chatId.includes(config.PAIRING_NUMBER)) ||
            (sock.user?.id && chatId.includes(sock.user.id.split('@')[0]))));
        const rawText = (rawMessage.message?.conversation ||
            rawMessage.message?.extendedTextMessage?.text ||
            rawMessage.message?.imageMessage?.caption ||
            rawMessage.message?.videoMessage?.caption || '').trim();
        const isExplicitCommand = rawText.startsWith('/');
        if (key.fromMe && !isSelfChat && !isExplicitCommand) {
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
        const commandText = (extracted.caption || extracted.text || '').trim();
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
            console.log(`⛔ Mensagem de ${senderName} (${chatId}) bloqueada pelo Controle de Acesso [Motivo: ${access.reason || 'Não autorizado'}]`);
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
        // =========================================================================
        // REGRA 6.3: COMANDOS EXPLÍCITOS (/help, /sticker, /meme, etc.)
        // =========================================================================
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
        // REGRA 6.4: RESPOSTA A SESSÃO INTERATIVA ATIVA (FASE A / B)
        // =========================================================================
        const activeSession = sessionManager.getSession(chatId);
        if (activeSession && detected.type === 'TEXT') {
            const handled = await this.handleInteractiveReply(sock, rawMessage, extracted, activeSession, commandText);
            if (handled)
                return;
        }
        // Se não for mídia suportada (ex: texto comum, áudio, documento, sticker) -> ignorar silenciosamente
        if (detected.type !== 'IMAGE' &&
            detected.type !== 'VIDEO' &&
            detected.type !== 'GIF') {
            logger.debug({ event: 'message_ignored_type', type: detected.type }, `Tipo de mensagem ignorado: ${detected.type}`);
            return;
        }
        // Verifica se o tipo específico está habilitado no estado dinâmico
        if (detected.type === 'IMAGE' && !currentSettings.autoImage)
            return;
        if (detected.type === 'VIDEO' && !currentSettings.autoVideo)
            return;
        if (detected.type === 'GIF' && !currentSettings.autoGif)
            return;
        // =========================================================================
        // REGRA 7: PROCESSAMENTO DE MÍDIA (INTERATIVO VS AUTOMÁTICO)
        // =========================================================================
        if (currentSettings.processingMode === 'interactive') {
            // Cria a sessão com TTL de 5 minutos
            const session = sessionManager.createSession({
                chatId,
                senderJid: extracted.senderJid,
                sourceMessageId: messageId,
                mediaType: detected.type.toLowerCase(),
                mimetype: rawMessage.message?.imageMessage?.mimetype ||
                    rawMessage.message?.videoMessage?.mimetype ||
                    'image/jpeg',
            });
            // Menu interativo dinâmico
            let prompt = 'Recebi sua mídia 👀\nO que você quer fazer?\n\n';
            if (detected.type === 'IMAGE') {
                prompt += [
                    '1. 🖼️ *Figurinha* (Padrão)',
                    '2. 🎭 *Meme* (Adicionar texto)',
                    '3. 🔲 *Figurinha + Borda* (Outline)',
                    '4. 👤 *Figurinha + Sombra* (Shadow)',
                    '5. 📸 *Imagem estática*',
                ].join('\n');
            }
            else if (detected.type === 'GIF') {
                prompt += [
                    '1. 🎞️ *Figurinha animada*',
                    '2. 📸 *Imagem estática* (Frame)',
                    '3. 🎭 *Meme* (Frame + Texto)',
                ].join('\n');
            }
            else {
                prompt += [
                    '1. 🎞️ *Figurinha animada*',
                    '2. 📸 *Imagem estática* (Frame)',
                    '3. 🎭 *Meme* (Frame + Texto)',
                    '4. ✂️ *Recortar* (Trim)',
                ].join('\n');
            }
            prompt += '\n\n_(Envie o número da opção ou "cancelar")_';
            console.log(`📱 Menu interativo enviado para ${chatId} (Sessão: ${session.id})`);
            await stickerSender.sendText(sock, chatId, prompt, rawMessage);
            return;
        }
        // Modo automático direto
        console.log(`⚡ Mídia recebida (${detected.type})! Criando figurinha automaticamente sem precisar de comando...`);
        await this.queueMediaProcessing(sock, extracted, extracted);
    }
    /**
     * Processa a resposta do usuário dentro de um fluxo interativo ativo.
     */
    async handleInteractiveReply(sock, rawMessage, extracted, session, text) {
        const chatId = session.chatId;
        const lower = text.trim().toLowerCase();
        // Cancelamento
        if (['cancelar', '/cancel', '0', 'sair', 'cancel'].includes(lower)) {
            sessionManager.cancelSession(chatId, 'Cancelado pelo usuário');
            await stickerSender.sendText(sock, chatId, '❌ Operação cancelada.', rawMessage);
            return true;
        }
        // Etapa 1: Escolha da Ação Principal
        if (session.currentStep === 'WAITING_FOR_ACTION') {
            const choice = lower;
            if (session.mediaType === 'image') {
                if (choice === '1' || choice.includes('figurinha') || choice.includes('sticker')) {
                    sessionManager.completeSession(session.id);
                    await stickerSender.sendText(sock, chatId, '⏳ Criando sua figurinha...', rawMessage);
                    await this.queueMediaProcessing(sock, extracted, extracted);
                    return true;
                }
                if (choice === '2' || choice.includes('meme')) {
                    sessionManager.updateSession(session.id, {
                        currentStep: 'WAITING_FOR_TEXT',
                        selectedAction: 'meme',
                    });
                    await stickerSender.sendText(sock, chatId, '🎭 *Criador de Meme:*\nDigite o texto desejado.\n\n_Dica: Use | para dividir entre topo e rodapé._\nExemplo: *MEU CÓDIGO | COMPILOU*', rawMessage);
                    return true;
                }
                if (choice === '3' || choice.includes('borda') || choice.includes('outline')) {
                    sessionManager.completeSession(session.id);
                    await stickerSender.sendText(sock, chatId, '⏳ Aplicando contorno branco...', rawMessage);
                    await this.queueMediaProcessing(sock, extracted, extracted, { outline: '#FFFFFF' });
                    return true;
                }
                if (choice === '4' || choice.includes('sombra') || choice.includes('shadow')) {
                    sessionManager.completeSession(session.id);
                    await stickerSender.sendText(sock, chatId, '⏳ Aplicando sombra projetada...', rawMessage);
                    await this.queueMediaProcessing(sock, extracted, extracted, { shadow: 'soft' });
                    return true;
                }
                if (choice === '5' || choice.includes('estatica') || choice.includes('foto')) {
                    sessionManager.completeSession(session.id);
                    await stickerSender.sendText(sock, chatId, '⏳ Gerando imagem estática...', rawMessage);
                    await this.queueMediaProcessing(sock, extracted, extracted, { forceStatic: true });
                    return true;
                }
            }
            else {
                // GIF ou VÍDEO
                if (choice === '1') {
                    sessionManager.completeSession(session.id);
                    await stickerSender.sendText(sock, chatId, '⏳ Gerando figurinha animada...', rawMessage);
                    await this.queueMediaProcessing(sock, extracted, extracted);
                    return true;
                }
                if (choice === '2') {
                    sessionManager.completeSession(session.id);
                    await stickerSender.sendText(sock, chatId, '⏳ Extraindo frame estático...', rawMessage);
                    await this.queueMediaProcessing(sock, extracted, extracted, { forceStatic: true });
                    return true;
                }
                if (choice === '3') {
                    sessionManager.updateSession(session.id, {
                        currentStep: 'WAITING_FOR_TEXT',
                        selectedAction: 'meme',
                    });
                    await stickerSender.sendText(sock, chatId, '🎭 *Criador de Meme:*\nDigite o texto para o frame.\n\nExemplo: *QUANDO O BOT | RESPONDE*', rawMessage);
                    return true;
                }
                if (choice === '4' && session.mediaType === 'video') {
                    sessionManager.updateSession(session.id, {
                        currentStep: 'WAITING_FOR_PARAMETER',
                        selectedAction: 'trim',
                    });
                    await stickerSender.sendText(sock, chatId, '✂️ *Corte de Vídeo:*\nEnvie a duração em segundos para cortar (ex: *5* ou *8*):', rawMessage);
                    return true;
                }
            }
            await stickerSender.sendText(sock, chatId, '❓ Opção inválida. Digite o número correspondente à opção desejada ou *cancelar*.', rawMessage);
            return true;
        }
        // Etapa 2: Aguardando Texto (Meme)
        if (session.currentStep === 'WAITING_FOR_TEXT') {
            const memeText = text.trim();
            sessionManager.completeSession(session.id);
            await stickerSender.sendText(sock, chatId, '⏳ Gerando seu meme...', rawMessage);
            await this.queueMediaProcessing(sock, extracted, extracted, {
                memeText,
                forceStatic: session.mediaType !== 'image',
            });
            return true;
        }
        // Etapa 3: Aguardando Parâmetro (Trim)
        if (session.currentStep === 'WAITING_FOR_PARAMETER') {
            const duration = Number(text.trim()) || 5;
            sessionManager.completeSession(session.id);
            await stickerSender.sendText(sock, chatId, `⏳ Cortando vídeo para ${duration}s...`, rawMessage);
            await this.queueMediaProcessing(sock, extracted, extracted, {
                trimSeconds: Math.max(1, Math.min(10, duration)),
            });
            return true;
        }
        return false;
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
        const senderPhone = (sourceMessage.senderJid || sourceMessage.chatId).split(':')[0].split('@')[0];
        const senderName = sourceMessage.rawMessage?.pushName || 'Desconhecido';
        // FASE I: Aplica preset de qualidade configurado
        const currentSettings = botState.getSettings();
        const finalOptions = applyPresetToOptions(currentSettings.qualityPreset, options);
        systemMonitor.addDebugLog('queue', `Job ${jobId} enfileirado`, {
            mediaType: mediaTarget.mediaType,
            preset: currentSettings.qualityPreset,
        });
        try {
            await jobQueue.enqueue(job, async (activeJob) => {
                const jobDir = await createJobDir(activeJob.id);
                try {
                    systemMonitor.addDebugLog('processor', `Iniciando download e processamento para job ${jobId}`);
                    // 1. Faz o download seguro da mídia
                    const downloaded = await mediaDownloader.download(mediaTarget.rawMessage, mediaTarget.mediaType, jobDir, sock.updateMediaMessage);
                    // 2. Converte a mídia para figurinha WebP (Sharp para imagem, FFmpeg para vídeo/GIF)
                    const result = await stickerProcessor.process(mediaTarget.mediaType, downloaded.filePath, jobDir, finalOptions);
                    // 3. Envia a figurinha gerada de volta para o chat privado
                    await stickerSender.sendSticker(sock, sourceMessage.chatId, result.outputBuffer, sourceMessage.rawMessage, { isAnimated: result.isAnimated });
                    console.log(`✅ Figurinha entregue com sucesso para ${sourceMessage.chatId}!`);
                    // FASE F & G: Salva na Biblioteca de Stickers local
                    const operationName = finalOptions.memeText
                        ? 'meme'
                        : finalOptions.outline
                            ? 'outline'
                            : finalOptions.shadow
                                ? 'shadow'
                                : finalOptions.forceStatic
                                    ? 'static'
                                    : 'sticker';
                    await libraryManager.saveSticker(result.outputBuffer, {
                        mediaType: mediaTarget.mediaType,
                        isAnimated: result.isAnimated,
                        originUser: senderPhone,
                        operation: operationName,
                    });
                    // FASE H: Registra estatística de uso bem-sucedido
                    statisticsManager.recordSuccess(senderPhone, senderName, mediaTarget.mediaType, result.processingTimeMs);
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
                        mediaType: mediaTarget.mediaType,
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
                    return result;
                }
                finally {
                    await removeJobDir(jobDir);
                }
            });
        }
        catch (err) {
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
                mediaType: mediaTarget.mediaType,
                status: 'Failed',
                failureReason: err?.message || 'Erro no processamento',
                commandUsed: sourceMessage.caption || sourceMessage.text ? 'Manual' : 'Auto-detect',
            });
            systemMonitor.addDebugLog('processor', 'Falha no processamento do job', {
                error: err?.message,
            });
            const friendlyMsg = err instanceof AppError
                ? err.userFriendlyMessage
                : '❌ Não consegui transformar essa mídia em figurinha.';
            await stickerSender.sendText(sock, sourceMessage.chatId, friendlyMsg, sourceMessage.rawMessage);
        }
    }
}
export const messageRouter = new MessageRouter();
//# sourceMappingURL=message-router.js.map