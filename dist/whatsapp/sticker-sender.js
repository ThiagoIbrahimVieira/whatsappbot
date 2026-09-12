import { CONSTANTS } from '../config/constants.js';
import { WhatsAppSendError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sanitizeJidForLogs } from './chat-utils.js';
export class StickerSender {
    /**
     * Envia uma figurinha WebP para um chat do WhatsApp.
     */
    async sendSticker(sock, chatId, stickerBuffer, quotedMessage, options) {
        try {
            logger.debug({ chat: sanitizeJidForLogs(chatId) }, 'Enviando figurinha para o WhatsApp...');
            await sock.sendMessage(chatId, {
                sticker: stickerBuffer,
                isAnimated: Boolean(options?.isAnimated),
                width: CONSTANTS.STICKER_WIDTH,
                height: CONSTANTS.STICKER_HEIGHT,
            }, quotedMessage ? { quoted: quotedMessage } : undefined);
            logger.info({
                event: 'sticker_sent',
                chat: sanitizeJidForLogs(chatId),
                bytes: stickerBuffer.length,
            }, 'Figurinha enviada com sucesso');
        }
        catch (err) {
            logger.error({ err, chat: sanitizeJidForLogs(chatId) }, 'Falha ao enviar figurinha para o chat');
            throw new WhatsAppSendError(`Falha ao enviar figurinha: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    /**
     * Envia uma mensagem amigável de texto (usado apenas em conversas privadas para comandos ou avisos).
     */
    async sendText(sock, chatId, text, quotedMessage) {
        try {
            await sock.sendMessage(chatId, { text }, quotedMessage ? { quoted: quotedMessage } : undefined);
        }
        catch (err) {
            logger.error({ err, chat: sanitizeJidForLogs(chatId) }, 'Falha ao enviar mensagem de texto para o chat');
        }
    }
}
export const stickerSender = new StickerSender();
//# sourceMappingURL=sticker-sender.js.map