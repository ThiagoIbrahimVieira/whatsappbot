import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { MediaType } from '../types/media.js';
import { validateMediaSize } from '../media/media-validator.js';
import { MediaValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface DownloadedMedia {
  filePath: string;
  buffer: Buffer;
  sizeBytes: number;
}

export class MediaDownloader {
  /**
   * Baixa a mídia diretamente do WhatsApp via Baileys e salva com segurança no diretório do job.
   */
  public async download(
    rawMessageInfo: any,
    mediaType: MediaType,
    jobDir: string,
    reuploadRequest?: (msg: any) => Promise<any>
  ): Promise<DownloadedMedia> {
    try {
      logger.debug({ mediaType, jobDir }, 'Iniciando download da mídia...');

      // Baileys downloadMediaMessage exige que o objeto possua a propriedade .message
      const messageToDownload = rawMessageInfo?.message ? rawMessageInfo : { message: rawMessageInfo };

      // Faz o download descriptografado dos servidores do WhatsApp
      const buffer = (await downloadMediaMessage(
        messageToDownload,
        'buffer',
        {},
        {
          logger: logger as any,
          reuploadRequest: (reuploadRequest || (async (m: any) => m)) as any,
        }
      )) as Buffer;

      if (!buffer || buffer.length === 0) {
        throw new MediaValidationError('O buffer de mídia baixado está vazio.');
      }

      // Valida tamanho do buffer baixado contra as configurações máximas
      validateMediaSize(mediaType, buffer.length);

      // Determina extensão segura
      const ext =
        mediaType === 'IMAGE'
          ? 'jpg'
          : mediaType === 'VIDEO'
            ? 'mp4'
            : mediaType === 'GIF'
              ? 'gif'
              : 'bin';

      const safeFileName = `input_${Date.now()}.${ext}`;
      const filePath = path.join(jobDir, safeFileName);

      await fs.writeFile(filePath, buffer);

      logger.info(
        {
          event: 'media_downloaded',
          mediaType,
          sizeBytes: buffer.length,
          filePath,
        },
        'Download de mídia concluído com sucesso'
      );

      return {
        filePath,
        buffer,
        sizeBytes: buffer.length,
      };
    } catch (err) {
      if (err instanceof Error && err.name.includes('Media')) {
        throw err;
      }
      throw new MediaValidationError(
        `Falha ao baixar mídia: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

export const mediaDownloader = new MediaDownloader();
