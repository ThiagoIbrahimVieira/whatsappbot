import type { WASocket } from '@whiskeysockets/baileys';
import { CONSTANTS } from '../config/constants.js';
import { recentMessages } from '../utils/cache.js';
import { WhatsAppSendError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sanitizeJidForLogs } from './chat-utils.js';

export class StickerSender {
  /**
   * Envia uma figurinha WebP para um chat do WhatsApp.
   */
  public async sendSticker(
    sock: WASocket,
    chatId: string,
    stickerBuffer: Buffer,
    quotedMessage?: any,
    options?: { isAnimated?: boolean }
  ): Promise<void> {
    try {
      logger.debug({ chat: sanitizeJidForLogs(chatId) }, 'Enviando figurinha para o WhatsApp...');

      const sent = await sock.sendMessage(
        chatId,
        {
          sticker: stickerBuffer,
          isAnimated: Boolean(options?.isAnimated),
          width: CONSTANTS.STICKER_WIDTH,
          height: CONSTANTS.STICKER_HEIGHT,
        },
        quotedMessage ? { quoted: quotedMessage } : undefined
      );

      if (sent?.key?.id) {
        recentMessages.add(sent.key.id);
      }

      logger.info(
        {
          event: 'sticker_sent',
          chat: sanitizeJidForLogs(chatId),
          bytes: stickerBuffer.length,
        },
        'Figurinha enviada com sucesso'
      );
    } catch (err) {
      logger.error(
        { err, chat: sanitizeJidForLogs(chatId) },
        'Falha ao enviar figurinha para o chat'
      );
      throw new WhatsAppSendError(
        `Falha ao enviar figurinha: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Envia uma mensagem amigável de texto (usado apenas em conversas privadas para comandos ou avisos).
   */
  public async sendText(
    sock: WASocket,
    chatId: string,
    text: string,
    quotedMessage?: any
  ): Promise<void> {
    try {
      const sent = await sock.sendMessage(
        chatId,
        { text },
        quotedMessage ? { quoted: quotedMessage } : undefined
      );

      if (sent?.key?.id) {
        recentMessages.add(sent.key.id);
      }
    } catch (err) {
      logger.error(
        { err, chat: sanitizeJidForLogs(chatId) },
        'Falha ao enviar mensagem de texto para o chat'
      );
    }
  }
}

export const stickerSender = new StickerSender();
