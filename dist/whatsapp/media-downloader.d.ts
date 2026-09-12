import type { MediaType } from '../types/media.js';
export interface DownloadedMedia {
    filePath: string;
    buffer: Buffer;
    sizeBytes: number;
}
export declare class MediaDownloader {
    /**
     * Baixa a mídia diretamente do WhatsApp via Baileys e salva com segurança no diretório do job.
     */
    download(rawMessageInfo: any, mediaType: MediaType, jobDir: string, reuploadRequest?: (msg: any) => Promise<any>): Promise<DownloadedMedia>;
}
export declare const mediaDownloader: MediaDownloader;
