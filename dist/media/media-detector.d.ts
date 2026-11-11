import type { MediaType } from '../types/media.js';
export interface DetectedMedia {
    type: MediaType;
    mimetype?: string;
    isGif: boolean;
    caption?: string;
    text?: string;
    rawMediaMessage?: any;
    fileLength?: number;
    seconds?: number;
}
/**
 * Desembrulha mensagens aninhadas como ViewOnce, Ephemeral, etc.
 */
export declare function unwrapMessage(rawMessage: any): any;
/**
 * Detecta o tipo de mídia ou conteúdo de uma mensagem sem realizar download ou processamento.
 */
export declare function detectMedia(rawMessage: any): DetectedMedia;
