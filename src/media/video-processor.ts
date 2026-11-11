import fs from 'node:fs/promises';
import path from 'node:path';
import { CONSTANTS } from '../config/constants.js';
import { config } from '../config/config.js';
import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
import { runFFmpeg, probeMediaWithFFmpeg } from './ffmpeg.js';
import { addExifToWebp } from './metadata.js';
import { ProcessingError, StickerTooLargeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class VideoProcessor {
  /**
   * Converte um arquivo de vídeo em figurinha animada WebP 512x512 sem áudio.
   */
  public async processVideo(
    inputPath: string,
    outputDir: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. Extrai metadados do vídeo
      const probe = await probeMediaWithFFmpeg(inputPath);
      const configuredMax =
        options.maxDurationSeconds || config.MAX_VIDEO_DURATION_SECONDS;

      // 2. Determina a duração do corte (VIDEO_TRIM_MODE=first) garantindo <= 10 segundos
      let maxDuration = Math.min(
        configuredMax,
        CONSTANTS.MAX_ANIMATED_DURATION_SECONDS
      );

      if (options.trimSeconds && options.trimSeconds > 0) {
        maxDuration = Math.min(options.trimSeconds, CONSTANTS.MAX_ANIMATED_DURATION_SECONDS);
      }

      const durationToUse = Math.min(
        probe.durationSeconds > 0 ? probe.durationSeconds : maxDuration,
        maxDuration
      );

      // 3. Configurações de compressão e FPS adaptativos para garantir <= 500 KB rapidamente
      const requestedFps = options.fps && options.fps >= 1 && options.fps <= 30
        ? Math.round(options.fps)
        : undefined;

      const requestedQuality =
        options.videoQuality ||
        (options.quality && options.quality <= 60 ? options.quality : undefined);

      // Estratégia de passos calibrados pela duração (elimina loop cego de 12 combinações)
      const attempts: Array<{ fps: number; quality: number }> = [];

      if (requestedFps || requestedQuality) {
        attempts.push({
          fps: requestedFps || (durationToUse > 6 ? 8 : durationToUse > 3 ? 10 : CONSTANTS.DEFAULT_ANIMATED_FPS),
          quality: requestedQuality || (durationToUse > 6 ? 35 : 45),
        });
      }

      if (durationToUse > 6) {
        // Vídeos longos (7s a 10s): grande volume de quadros
        attempts.push(
          { fps: 8, quality: 35 },
          { fps: 8, quality: 20 },
          { fps: 6, quality: 12 }
        );
      } else if (durationToUse > 3) {
        // Vídeos médios (4s a 6s)
        attempts.push(
          { fps: 10, quality: 45 },
          { fps: 8, quality: 30 },
          { fps: 8, quality: 15 }
        );
      } else {
        // Vídeos curtos (1s a 3s): cabe com folga em alta fidelidade
        attempts.push(
          { fps: 12, quality: 50 },
          { fps: 10, quality: 35 },
          { fps: 8, quality: 20 }
        );
      }

      // Deduplica tentativas mantendo a ordem de prioridade
      const uniqueAttempts: Array<{ fps: number; quality: number }> = [];
      const seenAttempts = new Set<string>();
      for (const att of attempts) {
        const key = `${att.fps}_${att.quality}`;
        if (!seenAttempts.has(key)) {
          seenAttempts.add(key);
          uniqueAttempts.push(att);
        }
      }

      // Velocidade do vídeo (speed / slow): setpts=PTS/speed
      let speedFactor = 1.0;
      if (options.speed && options.speed >= 0.25 && options.speed <= 4.0) {
        speedFactor = options.speed;
      }

      let bestBuffer: Buffer | null = null;

      for (const attempt of uniqueAttempts) {
        const { fps, quality } = attempt;
        const tempOutPath = path.join(outputDir, `anim_${fps}_${quality}.webp`);

        // Filtro FFmpeg: converte para format=rgba ANTES do pad para que color=black@0
        // gere pixels verdadeiramente transparentes (alfa = 0) no WebP final
        const filterList = [
          `fps=${fps}`,
        ];

        if (speedFactor !== 1.0) {
          filterList.push(`setpts=PTS/${speedFactor}`);
        }

        filterList.push(
          `scale=512:512:force_original_aspect_ratio=decrease`,
          `format=rgba`,
          `pad=512:512:(512-iw)/2:(512-ih)/2:color=black@0`
        );

        const filterComplex = filterList.join(',');

        const args = [
          '-y',
          '-t',
          String(durationToUse),
          '-i',
          inputPath,
          '-vf',
          filterComplex,
          '-an', // Remove completamente qualquer faixa de áudio
          '-c:v',
          'libwebp',
          '-lossless',
          '0',
          '-compression_level',
          '2', // Codificação 3x a 5x mais rápida em CPU
          '-q:v',
          String(quality),
          '-preset',
          'default',
          '-loop',
          '0', // Loop infinito
          tempOutPath,
        ];

        await runFFmpeg(args);

        const generatedBuffer = await fs.readFile(tempOutPath);
        const bufferWithExif = await addExifToWebp(generatedBuffer);

        // Se estiver dentro do limite oficial do WhatsApp (500 KB)
        if (bufferWithExif.length <= CONSTANTS.ANIMATED_STICKER_MAX_BYTES) {
          bestBuffer = bufferWithExif;
          break;
        }

        bestBuffer = bufferWithExif;
      }

      if (!bestBuffer) {
        throw new ProcessingError('Falha ao gerar o WebP animado do vídeo.');
      }

      if (bestBuffer.length > CONSTANTS.ANIMATED_STICKER_MAX_BYTES) {
        throw new StickerTooLargeError(
          bestBuffer.length,
          CONSTANTS.ANIMATED_STICKER_MAX_BYTES
        );
      }

      // Salva a versão final com os metadados EXIF
      const targetStickerPath = path.join(outputDir, 'sticker.webp');
      await fs.writeFile(targetStickerPath, bestBuffer);

      const processingTimeMs = Date.now() - startTime;

      logger.info(
        {
          event: 'sticker_generated',
          mediaType: 'video',
          processingTimeMs,
          sizeBytes: bestBuffer.length,
          durationTrimmed: durationToUse,
        },
        'Figurinha animada de vídeo gerada com sucesso'
      );

      return {
        outputPath: targetStickerPath,
        outputBuffer: bestBuffer,
        mimetype: 'image/webp',
        isAnimated: true,
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
        `Erro ao processar vídeo: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Extrai um frame do vídeo como imagem estática (usado pelo comando /static).
   * Suporta:
   * - sem parâmetro: frame inicial (0.1s)
   * - timestamp numérico: frame no segundo informado (ex: 4)
   * - 'middle': frame central da duração total do vídeo
   */
  public async extractStaticFrame(
    inputPath: string,
    outputDir: string,
    timestamp?: number | 'middle'
  ): Promise<string> {
    let seekTime = '00:00:00.100';

    if (timestamp !== undefined) {
      try {
        const probe = await probeMediaWithFFmpeg(inputPath);
        const duration = probe.durationSeconds || 1.0;

        if (timestamp === 'middle') {
          const middleSec = Math.max(0.1, duration / 2);
          seekTime = middleSec.toFixed(3);
        } else if (typeof timestamp === 'number' && !isNaN(timestamp)) {
          const clamped = Math.max(0, Math.min(timestamp, Math.max(0.1, duration - 0.1)));
          seekTime = clamped.toFixed(3);
        }
      } catch {
        // Fallback seguro para 0.1s caso o probe falhe
      }
    }

    const framePath = path.join(outputDir, 'extracted_frame.png');
    const args = [
      '-y',
      '-ss',
      seekTime,
      '-i',
      inputPath,
      '-vframes',
      '1',
      framePath,
    ];

    await runFFmpeg(args);
    return framePath;
  }
}

export const videoProcessor = new VideoProcessor();
