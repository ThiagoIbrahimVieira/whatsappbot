import type { WASocket } from '@whiskeysockets/baileys';
export declare class StickerSender {
    /**
     * Envia uma figurinha WebP para um chat do WhatsApp.
     */
    sendSticker(sock: WASocket, chatId: string, stickerBuffer: Buffer, quotedMessage?: any, options?: {
        isAnimated?: boolean;
    }): Promise<void>;
    /**
     * Envia uma mensagem amigável de texto (usado apenas em conversas privadas para comandos ou avisos).
     */
    sendText(sock: WASocket, chatId: string, text: string, quotedMessage?: any): Promise<void>;
}
export declare const stickerSender: StickerSender;
