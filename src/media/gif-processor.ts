import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
import { videoProcessor } from './video-processor.js';
import { probeMediaWithFFmpeg } from './ffmpeg.js';
import { imageProcessor } from './image-processor.js';
import fs from 'node:fs/promises';

export class GifProcessor {
  /**
   * Processa arquivo GIF.
   * Se for GIF animado, converte em WebP animado via FFmpeg.
   * Se for estático (1 frame), converte para WebP estático via Sharp.
   */
  public async processGif(
    inputPath: string,
    outputDir: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const probe = await probeMediaWithFFmpeg(inputPath);

    // Se duração for 0 ou indefinida (GIF estático) e não forçado animado
    if (probe.durationSeconds <= 0.05 && !options.forceAnimated) {
      const buffer = await fs.readFile(inputPath);
      return await imageProcessor.processImage(buffer, outputDir, options);
    }

    // GIF animado: processa pelo pipeline de animação do FFmpeg
    return await videoProcessor.processVideo(inputPath, outputDir, {
      ...options,
      fps: options.fps || 12,
    });
  }
}

export const gifProcessor = new GifProcessor();
