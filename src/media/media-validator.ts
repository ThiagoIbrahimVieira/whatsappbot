import { config } from '../config/config.js';
import type { MediaType } from '../types/media.js';
import { MediaTooLargeError, UnsupportedMediaError } from '../utils/errors.js';

export function getMaxSizeBytes(mediaType: MediaType): number {
  switch (mediaType) {
    case 'IMAGE':
      return config.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    case 'VIDEO':
      return config.MAX_VIDEO_SIZE_MB * 1024 * 1024;
    case 'GIF':
      return config.MAX_GIF_SIZE_MB * 1024 * 1024;
    default:
      return 10 * 1024 * 1024;
  }
}

/**
 * Valida o tamanho e tipo da mídia antes de prosseguir com o processamento.
 */
export function validateMediaSize(mediaType: MediaType, sizeBytes: number): void {
  const maxBytes = getMaxSizeBytes(mediaType);
  if (sizeBytes > maxBytes) {
    throw new MediaTooLargeError(sizeBytes, maxBytes);
  }
}

/**
 * Valida se o tipo de mídia é suportado pelo pipeline automático.
 */
export function validateSupportedMedia(mediaType: MediaType): void {
  if (mediaType !== 'IMAGE' && mediaType !== 'VIDEO' && mediaType !== 'GIF') {
    throw new UnsupportedMediaError(mediaType);
  }
}
