import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { runFFmpeg, probeMediaWithFFmpeg } from '../../src/media/ffmpeg.js';
import { videoProcessor } from '../../src/media/video-processor.js';
import { createJobDir, removeJobDir } from '../../src/utils/files.js';
import { generateJobId } from '../../src/utils/ids.js';
import { CONSTANTS } from '../../src/config/constants.js';
import { StickerTooLargeError } from '../../src/utils/errors.js';

describe('Video Processor (FFmpeg)', () => {
  let jobDir: string;
  let sampleVideoPath: string;

  beforeEach(async () => {
    jobDir = await createJobDir(`vid-test-${generateJobId()}`);
    sampleVideoPath = path.join(jobDir, 'synthetic_video.mp4');

    // Gera um vídeo sintético retangular (320x240) de 2 segundos com gerador do FFmpeg
    await runFFmpeg([
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=duration=2:size=320x240:rate=10',
      '-pix_fmt',
      'yuv420p',
      sampleVideoPath,
    ]);
  });

  afterEach(async () => {
    await removeJobDir(jobDir);
  });

  it('deve converter vídeo em figurinha animada WebP 512x512 dentro do limite de 500 KB', async () => {
    const result = await videoProcessor.processVideo(sampleVideoPath, jobDir, {
      fps: 10,
    });

    expect(result.mimetype).toBe('image/webp');
    expect(result.isAnimated).toBe(true);
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
    expect(result.sizeBytes).toBeLessThanOrEqual(CONSTANTS.ANIMATED_STICKER_MAX_BYTES);

    const meta = await sharp(result.outputBuffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);

    const exists = await fs
      .access(result.outputPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('pipeline de vídeo deve preservar transparência real no padding do WebP final (canto transparente)', async () => {
    // sampleVideoPath é 320x240 (4:3), gerando barras transparentes acima/abaixo para preencher 512x512
    const result = await videoProcessor.processVideo(sampleVideoPath, jobDir, {
      fps: 8,
    });

    const meta = await sharp(result.outputBuffer).metadata();
    expect(meta.hasAlpha).toBe(true);
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);

    // Lê os dados brutos de pixels (RGBA) do primeiro frame
    const rawPixels = await sharp(result.outputBuffer).raw().toBuffer();

    // Pixel no canto superior esquerdo (0,0) é área de padding
    // Formato RGBA: índice 0=R, 1=G, 2=B, 3=Alpha
    const cornerAlpha = rawPixels[3];
    expect(cornerAlpha).toBe(0); // 0 indica 100% transparente
  });

  it('duração máxima de corte da animação deve ser rigorosamente <= 10 segundos', async () => {
    // Cria vídeo longo de 14 segundos (acima do limite do WhatsApp de 10s)
    const longVideoPath = path.join(jobDir, 'long_video.mp4');
    await runFFmpeg([
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=duration=14:size=160x120:rate=10',
      '-pix_fmt',
      'yuv420p',
      longVideoPath,
    ]);

    const result = await videoProcessor.processVideo(longVideoPath, jobDir, {
      fps: 8,
    });

    expect(result.sizeBytes).toBeLessThanOrEqual(CONSTANTS.ANIMATED_STICKER_MAX_BYTES);

    // Analisa a duração do sticker WebP animado gerado
    const probe = await probeMediaWithFFmpeg(result.outputPath);
    expect(probe.durationSeconds).toBeLessThanOrEqual(CONSTANTS.MAX_ANIMATED_DURATION_SECONDS + 0.5);
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
  });

  it('animação que não conseguir ficar <= 500 KB falha de forma controlada lançando StickerTooLargeError', async () => {
    // Cria buffer artificialmente grande simulando impossibilidade de compressão em 500 KB
    const fakeHugeBuffer = Buffer.alloc(600 * 1024, 0xbb);

    // Mock do readFile para retornar arquivo gigante
    const readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValue(fakeHugeBuffer as any);

    try {
      await expect(
        videoProcessor.processVideo(sampleVideoPath, jobDir, { fps: 8 })
      ).rejects.toThrow(StickerTooLargeError);
    } finally {
      readFileSpy.mockRestore();
    }
  });

  it('deve extrair um frame estático de um vídeo', async () => {
    const framePath = await videoProcessor.extractStaticFrame(sampleVideoPath, jobDir);

    const exists = await fs
      .access(framePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
    expect(framePath.endsWith('.png')).toBe(true);
  });
});
