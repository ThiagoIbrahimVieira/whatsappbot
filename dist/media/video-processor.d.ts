import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
export declare class VideoProcessor {
    /**
     * Converte um arquivo de vídeo em figurinha animada WebP 512x512 sem áudio.
     */
    processVideo(inputPath: string, outputDir: string, options?: ProcessingOptions): Promise<ProcessingResult>;
    /**
     * Extrai o primeiro frame do vídeo como imagem estática (usado pelo comando /static).
     */
    extractStaticFrame(inputPath: string, outputDir: string): Promise<string>;
}
export declare const videoProcessor: VideoProcessor;
