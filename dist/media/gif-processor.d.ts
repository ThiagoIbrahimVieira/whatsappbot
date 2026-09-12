import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
export declare class GifProcessor {
    /**
     * Processa arquivo GIF.
     * Se for GIF animado, converte em WebP animado via FFmpeg.
     * Se for estático (1 frame), converte para WebP estático via Sharp.
     */
    processGif(inputPath: string, outputDir: string, options?: ProcessingOptions): Promise<ProcessingResult>;
}
export declare const gifProcessor: GifProcessor;
