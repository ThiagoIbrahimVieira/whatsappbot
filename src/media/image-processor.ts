import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { CONSTANTS } from '../config/constants.js';
import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
import { addExifToWebp } from './metadata.js';
import { runFFmpeg } from './ffmpeg.js';
import { ProcessingError, StickerTooLargeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { effectsProcessor } from './effects-processor.js';
import { memeProcessor } from './meme-processor.js';

let sharpModule: any = undefined;

function findSystemFont(): string | null {
  const candidates = [
    '/system/fonts/Roboto-Bold.ttf',
    '/system/fonts/Roboto-Black.ttf',
    '/system/fonts/Roboto-Medium.ttf',
    '/system/fonts/Roboto-Regular.ttf',
    '/system/fonts/DroidSans-Bold.ttf',
    '/system/fonts/DroidSans.ttf',
    '/system/fonts/NotoSans-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    'C:/Windows/Fonts/impact.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/arial.ttf',
  ];
  for (const candidate of candidates) {
    try {
      if (fsSync.existsSync(candidate)) return candidate;
    } catch {}
  }
  return null;
}

export async function getSharp(): Promise<any> {
  if (sharpModule !== undefined) return sharpModule;
  try {
    const pkg = 'sharp';
    // @ts-ignore
    const s = await import(pkg);
    const mod = s.default || s;
    if (typeof mod === 'function') {
      sharpModule = mod;
    } else {
      sharpModule = null;
    }
  } catch {
    logger.info('Sharp não disponível no ambiente (usando pipeline nativo FFmpeg).');
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

    let inputBuffer: Buffer;
    if (typeof input === 'string') {
      inputBuffer = await fs.readFile(input);
    } else {
      inputBuffer = input;
    }

    const metadata = await sharp(inputBuffer).metadata();
    if (!metadata.format) {
      throw new ProcessingError('Formato de imagem não reconhecido.');
    }

    // Fases D, E, B: Transformações e Efeitos aplicados determinística e sequencialmente
    if (options.rotate) {
      inputBuffer = await effectsProcessor.rotate(inputBuffer, options.rotate);
    }
    if (options.flip) {
      inputBuffer = await effectsProcessor.flip(inputBuffer);
    }
    if (options.mirror) {
      inputBuffer = await effectsProcessor.mirror(inputBuffer);
    }
    if (options.crop) {
      inputBuffer = await effectsProcessor.crop(inputBuffer, options.crop);
    }
    if (options.outline) {
      inputBuffer = await effectsProcessor.applyOutline(
        inputBuffer,
        typeof options.outline === 'string' ? options.outline : '#FFFFFF'
      );
    }
    if (options.shadow) {
      inputBuffer = await effectsProcessor.applyShadow(
        inputBuffer,
        options.shadow === 'hard' ? 'hard' : 'soft'
      );
    }
    if (options.memeText) {
      inputBuffer = await memeProcessor.applyMeme(inputBuffer, options.memeText, {
        topText: options.topText,
        bottomText: options.bottomText,
      });
    }

    const basePipeline = sharp(inputBuffer)
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
    const filters: string[] = [];

    // 1. Transformações geométricas
    if (options.rotate) {
      if (options.rotate === 90) filters.push('transpose=1');
      else if (options.rotate === 180) filters.push('hflip,vflip');
      else if (options.rotate === 270) filters.push('transpose=2');
    }
    if (options.flip) {
      filters.push('vflip');
    }
    if (options.mirror) {
      filters.push('hflip');
    }
    if (options.crop === 'square') {
      filters.push('crop=min(iw\\,ih):min(iw\\,ih)');
    }

    // 2. Formato de cores RGBA
    filters.push('format=rgba');

    // 3. Efeitos: Meme Moderno (Card Branco com Foto no Meio e Textos em Preto), Outline Fino ou Padrão
    let hasMemeText = false;
    if (options.memeText) {
      hasMemeText = true;
      const parsed = memeProcessor.parseMemeText(options.memeText, options.memeStyle || 'modern');
      const topRaw = (options.topText !== undefined ? options.topText : parsed.top || '').trim();
      const bottomRaw = (options.bottomText !== undefined ? options.bottomText : parsed.bottom || '').trim();

      const topLines = topRaw ? memeProcessor.wrapText(topRaw, 26) : [];
      const bottomLines = bottomRaw ? memeProcessor.wrapText(bottomRaw, 26) : [];

      const topHeight = topLines.length > 0 ? Math.max(48, topLines.length * 30 + 16) : 14;
      const bottomHeight = bottomLines.length > 0 ? Math.max(44, bottomLines.length * 28 + 14) : 14;

      const availH = Math.max(220, 512 - topHeight - bottomHeight - 14);
      const availW = 480;

      // 1. Escala a foto mantendo proporção para o espaço central
      filters.push(`scale=${availW}:${availH}:force_original_aspect_ratio=decrease`);
      // 2. Traço fino sutil (1px) ao redor da foto para destacá-la no card branco
      filters.push('pad=iw+2:ih+2:1:1:color=0xDDDDDD');
      // 3. Centraliza a foto verticalmente entre o topo e o rodapé sobre o canvas branco 512x512
      const yOffset = topHeight - bottomHeight;
      const yExpr = yOffset >= 0 ? `(512+${yOffset}-ih)/2` : `(512-${Math.abs(yOffset)}-ih)/2`;
      filters.push(`pad=512:512:(ow-iw)/2:${yExpr}:color=white`);

      const fontFile = findSystemFont();
      const fontArg = fontFile ? `fontfile='${fontFile.replace(/\\/g, '/').replace(/:/g, '\\:')}':` : '';

      // 4. Desenha o texto superior em preto limpo (estilo Twitter / meme card)
      if (topLines.length > 0) {
        const topFilePath = path.join(outputDir, 'meme_top.txt');
        await fs.writeFile(topFilePath, topLines.join('\n'), 'utf-8');
        const safeTopPath = topFilePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
        const topY = Math.max(14, Math.round((topHeight - topLines.length * 26) / 2));
        filters.push(
          `drawtext=${fontArg}textfile='${safeTopPath}':fontcolor=black:fontsize=23:x=(w-text_w)/2:y=${topY}:line_spacing=5`
        );
      }

      // 5. Desenha o texto inferior em preto limpo
      if (bottomLines.length > 0) {
        const bottomFilePath = path.join(outputDir, 'meme_bottom.txt');
        await fs.writeFile(bottomFilePath, bottomLines.join('\n'), 'utf-8');
        const safeBottomPath = bottomFilePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
        const bottomY = 512 - bottomHeight + Math.max(4, Math.round((bottomHeight - bottomLines.length * 24) / 2));
        filters.push(
          `drawtext=${fontArg}textfile='${safeBottomPath}':fontcolor=black:fontsize=22:x=(w-text_w)/2:y=${bottomY}:line_spacing=5`
        );
      }
    } else if (options.outline) {
      // BORDA BRANCA ELEGANTE (Opção 3: contorno fino e bem delineado, ~6px em vez de 16px)
      // 1. Escala a foto mantendo tamanho amplo
      filters.push('scale=484:484:force_original_aspect_ratio=decrease');
      // 2. Traço fino de contraste
      filters.push('pad=iw+2:ih+2:1:1:color=black@0.3');
      // 3. Borda branca fina e bem delineada (6px em cada lado)
      filters.push('pad=iw+12:ih+12:6:6:color=white');
      // 4. Centraliza no canvas final de 512x512 transparente
      filters.push('pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0');
    } else if (options.shadow) {
      // SOMBRA PROJETADA
      filters.push('scale=480:480:force_original_aspect_ratio=decrease');
      filters.push('pad=iw+8:ih+8:4:4:color=white');
      filters.push('pad=iw+8:ih+8:2:2:color=black@0.35');
      filters.push('pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0');
    } else {
      // PADRÃO
      filters.push('scale=512:512:force_original_aspect_ratio=decrease');
      filters.push('pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0');
    }

    const filterComplex = filters.join(',');

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

      try {
        await runFFmpeg(args);
      } catch (err: any) {
        // Se falhar e tinha drawtext (ex: freetype ausente), tenta fallback sem drawtext
        if (hasMemeText) {
          logger.warn({ err }, 'FFmpeg falhou com drawtext, tentando fallback sem texto...');
          const fallbackFilters = filters.filter((f) => !f.startsWith('drawtext='));
          const fallbackArgs = [...args];
          const vfIdx = fallbackArgs.indexOf('-vf');
          if (vfIdx !== -1) {
            fallbackArgs[vfIdx + 1] = fallbackFilters.join(',');
          }
          await runFFmpeg(fallbackArgs);
        } else {
          throw err;
        }
      }

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
