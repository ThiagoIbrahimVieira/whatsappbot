import type { WASocket } from '@whiskeysockets/baileys';
import { type StickerPack } from '../storage/pack-manager.js';
export declare class StickerPackSender {
    /**
     * Envia o pacote de figurinhas no formato oficial de Card do WhatsApp (com grade 2x2 e botão "Ver pacote").
     */
    sendStickerPackCard(sock: WASocket, chatId: string, pack: StickerPack, rawMessage?: any): Promise<boolean>;
}
export declare const stickerPackSender: StickerPackSender;
