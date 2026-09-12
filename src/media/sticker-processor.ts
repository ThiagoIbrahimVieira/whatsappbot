import type { MediaType, ProcessingResult, ProcessingOptions } from '../types/media.js';
import { imageProcessor } from './image-processor.js';
import { videoProcessor } from './video-processor.js';
import { gifProcessor } from './gif-processor.js';
import { UnsupportedMediaError } from '../utils/errors.js';
import fs from 'node:fs/promises';

export class StickerProcessor {
  /**
   * Ponto único de entrada para processamento de mídias em figurinhas.
   */
  public async process(
    mediaType: MediaType,
    inputPath: string,
    outputDir: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    // Caso o usuário solicite forçar figurinha estática (/static) em um vídeo ou GIF
    if (options.forceStatic) {
      if (mediaType === 'IMAGE') {
        const buffer = await fs.readFile(inputPath);
        return await imageProcessor.processImage(buffer, outputDir, options);
      }

      // Extrai um frame do vídeo/GIF e passa para o processador de imagem estática
      const framePath = await videoProcessor.extractStaticFrame(inputPath, outputDir, options.staticTimestamp);
      const frameBuffer = await fs.readFile(framePath);
      return await imageProcessor.processImage(frameBuffer, outputDir, options);
    }

    switch (mediaType) {
      case 'IMAGE': {
        const buffer = await fs.readFile(inputPath);
        return await imageProcessor.processImage(buffer, outputDir, options);
      }
      case 'VIDEO': {
        return await videoProcessor.processVideo(inputPath, outputDir, options);
      }
      case 'GIF': {
        return await gifProcessor.processGif(inputPath, outputDir, options);
      }
      default:
        throw new UnsupportedMediaError(mediaType);
    }
  }
}

export const stickerProcessor = new StickerProcessor();
