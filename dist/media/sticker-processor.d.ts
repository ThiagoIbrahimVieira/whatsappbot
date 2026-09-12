import type { MediaType, ProcessingResult, ProcessingOptions } from '../types/media.js';
export declare class StickerProcessor {
    /**
     * Ponto único de entrada para processamento de mídias em figurinhas.
     */
    process(mediaType: MediaType, inputPath: string, outputDir: string, options?: ProcessingOptions): Promise<ProcessingResult>;
}
export declare const stickerProcessor: StickerProcessor;
