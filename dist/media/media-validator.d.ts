import type { MediaType } from '../types/media.js';
export declare function getMaxSizeBytes(mediaType: MediaType): number;
/**
 * Valida o tamanho e tipo da mídia antes de prosseguir com o processamento.
 */
export declare function validateMediaSize(mediaType: MediaType, sizeBytes: number): void;
/**
 * Valida se o tipo de mídia é suportado pelo pipeline automático.
 */
export declare function validateSupportedMedia(mediaType: MediaType): void;
