import fs from 'node:fs/promises';
import path from 'node:path';
import { CONSTANTS } from '../config/constants.js';
import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
import { addExifToWebp } from './metadata.js';
import { runFFmpeg } from './ffmpeg.js';
import { ProcessingError, StickerTooLargeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

let sharpModule: any = undefined;

async function getSharp(): Promise<any> {
  if (sharpModule !== undefined) return sharpModule;
  try {
    const s = await import('sharp');
    sharpModule = s.default || s;
  } catch (err) {
    logger.info('Sharp não disponível no ambiente (usando pipeline FFmpeg para processamento de imagens).');
    sharpModule = null;
  }
  return sharpModule;
}

export class ImageProcessor {
  /**
   * Processa uma imagem estática e a converte em figurinha WebP 512x512 pronta para o WhatsApp.
   * Suporta Sharp nativo com fallback automático para FFmpeg em ambientes móveis (Termux/Android).
   */
  public async processImage(
    input: Buffer | string,
    outputDir: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const sharp = await getSharp();
    if (sharp) {
      try {
        return await this.processWithSharp(sharp, input, outputDir, options);
      } catch (err) {
        if (err instanceof StickerTooLargeError) {
          throw err;
        }
        // Se sharp falhar em tempo de execução (falha de lib/codec), tenta o fallback FFmpeg
        logger.warn({ err }, 'Falha no processamento com Sharp, acionando fallback FFmpeg...');
        return await this.processWithFFmpeg(input, outputDir, options);
      }
    }

    return await this.processWithFFmpeg(input, outputDir, options);
  }

  /**
   * Processamento de imagem via Sharp (ambiente desktop/servidor)
   */
  private async processWithSharp(
    sharp: any,
    input: Buffer | string,
    outputDir: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    const image = sharp(input);
    const metadata = await image.metadata();

    if (!metadata.format) {
      throw new ProcessingError('Formato de imagem não reconhecido.');
    }

    const basePipeline = sharp(input)
      .rotate()
      .resize({
        width: CONSTANTS.STICKER_WIDTH,
        height: CONSTANTS.STICKER_HEIGHT,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        withoutEnlargement: false,
      });

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
          effort: 6,
          smartSubsample: true,
          alphaQuality: Math.min(quality, 80),
          force: true,
        })
        .toBuffer();

      const stickerWithExif = await addExifToWebp(webpBuffer);

      if (stickerWithExif.length <= CONSTANTS.STATIC_STICKER_MAX_BYTES) {
        bestBuffer = stickerWithExif;
        break;
      }

      bestBuffer = stickerWithExif;
    }

    if (!bestBuffer) {
      throw new ProcessingError('Falha ao gerar buffer WebP da imagem.');
    }

    if (bestBuffer.length > CONSTANTS.STATIC_STICKER_MAX_BYTES) {
      throw new StickerTooLargeError(bestBuffer.length, CONSTANTS.STATIC_STICKER_MAX_BYTES);
    }

    const outputPath = path.join(outputDir, 'sticker.webp');
    await fs.writeFile(outputPath, bestBuffer);

    const processingTimeMs = Date.now() - startTime;
    logger.info(
      {
        event: 'sticker_generated',
        mediaType: 'image',
        engine: 'sharp',
        processingTimeMs,
        sizeBytes: bestBuffer.length,
        dimensions: `${CONSTANTS.STICKER_WIDTH}x${CONSTANTS.STICKER_HEIGHT}`,
      },
      'Figurinha estática gerada com sucesso (Sharp)'
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
  }

  /**
   * Processamento de imagem via FFmpeg (fallback nativo para Android Termux)
   */
  private async processWithFFmpeg(
    input: Buffer | string,
    outputDir: string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    let inputPath: string;
    if (Buffer.isBuffer(input)) {
      inputPath = path.join(outputDir, 'raw_input.img');
      await fs.writeFile(inputPath, input);
    } else {
      inputPath = input;
    }

    const startQuality = options.quality && options.quality < 80 ? options.quality : 80;
    const candidateQualities = [startQuality, 75, 65, 50, 40, 30, 20, 10];
    const qualities = Array.from(new Set(candidateQualities)).filter((q) => q <= startQuality);

    let bestBuffer: Buffer | null = null;
    const filterComplex =
      'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0';

    for (const quality of qualities) {
      const tempOut = path.join(outputDir, `ffmpeg_out_${quality}.webp`);
      const args = [
        '-y',
        '-i',
        inputPath,
        '-vf',
        filterComplex,
        '-c:v',
        'libwebp',
        '-lossless',
        '0',
        '-q:v',
        String(quality),
        '-vframes',
        '1',
        tempOut,
      ];

      await runFFmpeg(args);
      const generatedBuffer = await fs.readFile(tempOut);
      const stickerWithExif = await addExifToWebp(generatedBuffer);

      if (stickerWithExif.length <= CONSTANTS.STATIC_STICKER_MAX_BYTES) {
        bestBuffer = stickerWithExif;
        break;
      }
      bestBuffer = stickerWithExif;
    }

    if (!bestBuffer) {
      throw new ProcessingError('Falha ao gerar buffer WebP da imagem via FFmpeg.');
    }

    if (bestBuffer.length > CONSTANTS.STATIC_STICKER_MAX_BYTES) {
      throw new StickerTooLargeError(bestBuffer.length, CONSTANTS.STATIC_STICKER_MAX_BYTES);
    }

    const outputPath = path.join(outputDir, 'sticker.webp');
    await fs.writeFile(outputPath, bestBuffer);

    const processingTimeMs = Date.now() - startTime;
    logger.info(
      {
        event: 'sticker_generated',
        mediaType: 'image',
        engine: 'ffmpeg',
        processingTimeMs,
        sizeBytes: bestBuffer.length,
        dimensions: `${CONSTANTS.STICKER_WIDTH}x${CONSTANTS.STICKER_HEIGHT}`,
      },
      'Figurinha estática gerada com sucesso (FFmpeg)'
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
  }
}

export const imageProcessor = new ImageProcessor();
