import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CONSTANTS } from '../config/constants.js';
import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
import { addExifToWebp } from './metadata.js';
import { ProcessingError, StickerTooLargeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class ImageProcessor {
  /**
   * Processa uma imagem estática e a converte em figurinha WebP 512x512 pronta para o WhatsApp.
   */
  public async processImage(
    input: Buffer | string,
    outputDir: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. Carrega e analisa metadados da imagem
      const image = sharp(input);
      const metadata = await image.metadata();

      if (!metadata.format) {
        throw new ProcessingError('Formato de imagem não reconhecido.');
      }

      // 2. Normaliza orientação baseada no EXIF e redimensiona para 512x512 preservando proporção
      const basePipeline = sharp(input)
        .rotate() // Aplica rotação correta do EXIF automaticamente
        .resize({
          width: CONSTANTS.STICKER_WIDTH,
          height: CONSTANTS.STICKER_HEIGHT,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Fundo transparente sem distorção
          withoutEnlargement: false,
        });

      // 3. Compressão adaptativa: tenta qualidade padrão (ou informada), reduzindo progressivamente
      // até garantir que o arquivo com EXIF caiba no limite de 100 KB do WhatsApp
      const startQuality = options.quality && options.quality < 80 ? options.quality : 80;
      const candidateQualities = [startQuality, 75, 65, 50, 40, 30, 20, 10];
      const qualities = Array.from(new Set(candidateQualities)).filter((q) => q <= startQuality);

      let bestBuffer: Buffer | null = null;

      for (const quality of qualities) {
        const webpBuffer = await basePipeline
          .clone()
          .webp({
            quality,
            lossless: false,
            effort: 6, // Máximo esforço de compressão para atingir tamanho mínimo
            smartSubsample: true,
            alphaQuality: Math.min(quality, 80),
            force: true,
          })
          .toBuffer();

        // Adiciona metadados de sticker pack (EXIF)
        const stickerWithExif = await addExifToWebp(webpBuffer);

        if (stickerWithExif.length <= CONSTANTS.STATIC_STICKER_MAX_BYTES) {
          bestBuffer = stickerWithExif;
          break;
        }

        // Se ainda for grande, guarda o menor e continua tentando qualidade menor
        bestBuffer = stickerWithExif;
      }

      if (!bestBuffer) {
        throw new ProcessingError('Falha ao gerar buffer WebP da imagem.');
      }

      if (bestBuffer.length > CONSTANTS.STATIC_STICKER_MAX_BYTES) {
        throw new StickerTooLargeError(
          bestBuffer.length,
          CONSTANTS.STATIC_STICKER_MAX_BYTES
        );
      }

      // 4. Salva o arquivo no diretório temporário do job
      const outputPath = path.join(outputDir, 'sticker.webp');
      await fs.writeFile(outputPath, bestBuffer);

      const processingTimeMs = Date.now() - startTime;

      logger.info(
        {
          event: 'sticker_generated',
          mediaType: 'image',
          processingTimeMs,
          sizeBytes: bestBuffer.length,
          dimensions: `${CONSTANTS.STICKER_WIDTH}x${CONSTANTS.STICKER_HEIGHT}`,
        },
        'Figurinha estática gerada com sucesso'
      );

      return {
        outputPath,
        outputBuffer: bestBuffer,
        mimetype: 'image/webp',
        isAnimated: false,
        width: CONSTANTS.STICKER_WIDTH,
        height: CONSTANTS.STICKER_HEIGHT,
        sizeBytes: bestBuffer.length,
        processingTimeMs,
      };
    } catch (err) {
      if (err instanceof StickerTooLargeError || err instanceof ProcessingError) {
        throw err;
      }
      throw new ProcessingError(
        `Erro ao processar imagem: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

export const imageProcessor = new ImageProcessor();
