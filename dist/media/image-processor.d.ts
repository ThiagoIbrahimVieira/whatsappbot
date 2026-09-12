import type { ProcessingResult, ProcessingOptions } from '../types/media.js';
export declare class ImageProcessor {
    /**
     * Processa uma imagem estática e a converte em figurinha WebP 512x512 pronta para o WhatsApp.
     * Suporta Sharp nativo com fallback automático para FFmpeg em ambientes móveis (Termux/Android).
     */
    processImage(input: Buffer | string, outputDir: string, options?: ProcessingOptions): Promise<ProcessingResult>;
    /**
     * Processamento de imagem via Sharp (ambiente desktop/servidor)
     */
    private processWithSharp;
    /**
     * Processamento de imagem via FFmpeg (fallback nativo para Android Termux)
     */
    private processWithFFmpeg;
}
export declare const imageProcessor: ImageProcessor;
