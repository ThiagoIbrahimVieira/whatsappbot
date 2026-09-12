import fs from 'node:fs/promises';
import path from 'node:path';
import { CONSTANTS } from '../config/constants.js';
import { config } from '../config/config.js';
import { runFFmpeg, probeMediaWithFFmpeg } from './ffmpeg.js';
import { addExifToWebp } from './metadata.js';
import { ProcessingError, StickerTooLargeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
export class VideoProcessor {
    /**
     * Converte um arquivo de vídeo em figurinha animada WebP 512x512 sem áudio.
     */
    async processVideo(inputPath, outputDir, options = {}) {
        const startTime = Date.now();
        try {
            // 1. Extrai metadados do vídeo
            const probe = await probeMediaWithFFmpeg(inputPath);
            const configuredMax = options.maxDurationSeconds || config.MAX_VIDEO_DURATION_SECONDS;
            const maxDuration = Math.min(configuredMax, CONSTANTS.MAX_ANIMATED_DURATION_SECONDS);
            // 2. Determina a duração do corte (VIDEO_TRIM_MODE=first) garantindo <= 10 segundos
            const durationToUse = Math.min(probe.durationSeconds > 0 ? probe.durationSeconds : maxDuration, maxDuration);
            // 3. Configurações de compressão e FPS adaptativos para garantir <= 500 KB
            const defaultFps = options.fps || CONSTANTS.DEFAULT_ANIMATED_FPS;
            const candidateFps = [defaultFps, 10, 8];
            const fpsOptions = Array.from(new Set(candidateFps)).filter((f) => f <= defaultFps);
            const defaultQuality = options.quality || 50;
            const candidateQualities = [defaultQuality, 35, 20, 10];
            const compressionQualities = Array.from(new Set(candidateQualities)).filter((q) => q <= defaultQuality);
            let bestBuffer = null;
            for (const fps of fpsOptions) {
                for (const quality of compressionQualities) {
                    const tempOutPath = path.join(outputDir, `anim_${fps}_${quality}.webp`);
                    // Filtro FFmpeg: converte para format=rgba ANTES do pad para que color=black@0
                    // gere pixels verdadeiramente transparentes (alfa = 0) no WebP final
                    const filterComplex = [
                        `fps=${fps}`,
                        `scale=512:512:force_original_aspect_ratio=decrease`,
                        `format=rgba`,
                        `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0`,
                    ].join(',');
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
                        '-q:v',
                        String(quality),
                        '-preset',
                        'default',
                        '-loop',
                        '0', // Loop infinito
                        '-vsync',
                        '0',
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
                if (bestBuffer && bestBuffer.length <= CONSTANTS.ANIMATED_STICKER_MAX_BYTES) {
                    break;
                }
            }
            if (!bestBuffer) {
                throw new ProcessingError('Falha ao gerar o WebP animado do vídeo.');
            }
            if (bestBuffer.length > CONSTANTS.ANIMATED_STICKER_MAX_BYTES) {
                throw new StickerTooLargeError(bestBuffer.length, CONSTANTS.ANIMATED_STICKER_MAX_BYTES);
            }
            // Salva a versão final com os metadados EXIF
            const targetStickerPath = path.join(outputDir, 'sticker.webp');
            await fs.writeFile(targetStickerPath, bestBuffer);
            const processingTimeMs = Date.now() - startTime;
            logger.info({
                event: 'sticker_generated',
                mediaType: 'video',
                processingTimeMs,
                sizeBytes: bestBuffer.length,
                durationTrimmed: durationToUse,
            }, 'Figurinha animada de vídeo gerada com sucesso');
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
        }
        catch (err) {
            if (err instanceof StickerTooLargeError || err instanceof ProcessingError) {
                throw err;
            }
            throw new ProcessingError(`Erro ao processar vídeo: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    /**
     * Extrai o primeiro frame do vídeo como imagem estática (usado pelo comando /static).
     */
    async extractStaticFrame(inputPath, outputDir) {
        const framePath = path.join(outputDir, 'extracted_frame.png');
        const args = [
            '-y',
            '-ss',
            '00:00:00.100',
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
//# sourceMappingURL=video-processor.js.map