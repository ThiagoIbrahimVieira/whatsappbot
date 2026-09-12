import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
export declare class VideoProcessor {
    /**
     * Converte um arquivo de vídeo em figurinha animada WebP 512x512 sem áudio.
     */
    processVideo(inputPath: string, outputDir: string, options?: ProcessingOptions): Promise<ProcessingResult>;
    /**
     * Extrai um frame do vídeo como imagem estática (usado pelo comando /static).
     * Suporta:
     * - sem parâmetro: frame inicial (0.1s)
     * - timestamp numérico: frame no segundo informado (ex: 4)
     * - 'middle': frame central da duração total do vídeo
     */
    extractStaticFrame(inputPath: string, outputDir: string, timestamp?: number | 'middle'): Promise<string>;
}
export declare const videoProcessor: VideoProcessor;
