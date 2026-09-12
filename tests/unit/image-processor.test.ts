import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sharp from 'sharp';
import webpmux from 'node-webpmux';
import fs from 'node:fs/promises';
import { imageProcessor } from '../../src/media/image-processor.js';
import { createJobDir, removeJobDir, cleanAllTmp } from '../../src/utils/files.js';

describe('Image Processor (Sharp)', () => {
  let jobDir: string;

  beforeEach(async () => {
    await cleanAllTmp();
    jobDir = await createJobDir('img-test');
  });

  afterEach(async () => {
    await removeJobDir(jobDir);
  });

  it('deve converter uma imagem retangular para WebP 512x512 mantendo proporção', async () => {
    // Cria uma imagem retangular de teste (800x400) com fundo azul
    const inputBuffer = await sharp({
      create: {
        width: 800,
        height: 400,
        channels: 4,
        background: { r: 0, g: 100, b: 255, alpha: 1 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await imageProcessor.processImage(inputBuffer, jobDir);

    expect(result.mimetype).toBe('image/webp');
    expect(result.isAnimated).toBe(false);
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
    expect(result.sizeBytes).toBeLessThanOrEqual(100 * 1024);

    // Valida os metadados do WebP gerado
    const meta = await sharp(result.outputBuffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);

    // Valida container WebP estendido exigido pelo WhatsApp
    expect(result.outputBuffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(result.outputBuffer.toString('ascii', 8, 12)).toBe('WEBP');
    expect(result.outputBuffer.toString('ascii', 12, 16)).toBe('VP8X');
    const flags = result.outputBuffer.readUInt8(20);
    expect(Boolean(flags & 0x08)).toBe(true); // Flag EXIF obrigatória

    // O arquivo em disco deve existir
    const fileExists = await fs
      .access(result.outputPath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('imagem com ruído/complexidade que excederia 100 KB em alta qualidade é recomprimida até <= 100 KB', async () => {
    // Cria imagem de alta resolução com ruído visual que gera arquivo pesado
    const noiseImageBuffer = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        noise: {
          type: 'gaussian',
          mean: 128,
          sigma: 30,
        },
      },
    })
      .png()
      .toBuffer();

    expect(noiseImageBuffer.length).toBeGreaterThan(100 * 1024);

    const result = await imageProcessor.processImage(noiseImageBuffer, jobDir);

    expect(result.mimetype).toBe('image/webp');
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
    expect(result.sizeBytes).toBeLessThanOrEqual(100 * 1024);

    const meta = await sharp(result.outputBuffer).metadata();
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  it('imagem que não consegue ficar <= 100 KB falha de forma controlada lançando StickerTooLargeError', async () => {
    // Simula cenário extremo onde mesmo na qualidade mínima o buffer excede 100 KB
    const inputBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .jpeg()
      .toBuffer();

    // Cria um buffer artificialmente enorme simulando impossibilidade de compressão
    const fakeHugeBuffer = Buffer.alloc(150 * 1024, 0xaa);
    const fakeHugeWebp = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.alloc(4),
      Buffer.from('WEBPVP8 '),
      fakeHugeBuffer,
    ]);

    const { addExifToWebp } = await import('../../src/media/metadata.js');
    const { StickerTooLargeError } = await import('../../src/utils/errors.js');

    // Spy no sharp para retornar o buffer gigante em qualquer qualidade tentada
    const cloneSpy = vi.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue(fakeHugeWebp as any);

    try {
      await expect(
        imageProcessor.processImage(inputBuffer, jobDir)
      ).rejects.toThrow(StickerTooLargeError);
    } finally {
      cloneSpy.mockRestore();
    }
  });

  it('deve preservar transparência de PNG e garantir dimensões 512x512 com flags EXIF e Alpha', async () => {
    // Cria um círculo transparente
    const inputBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const result = await imageProcessor.processImage(inputBuffer, jobDir);
    const meta = await sharp(result.outputBuffer).metadata();

    expect(meta.hasAlpha).toBe(true);
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
    expect(result.sizeBytes).toBeLessThanOrEqual(100 * 1024);

    // Deve ser container VP8X com flags de Alpha (0x10) e EXIF (0x08)
    expect(result.outputBuffer.toString('ascii', 12, 16)).toBe('VP8X');
    const flags = result.outputBuffer.readUInt8(20);
    expect(Boolean(flags & 0x08)).toBe(true); // EXIF
    expect(Boolean(flags & 0x10)).toBe(true); // Alpha
  });

  it('deve converter imagem 100% opaca (sem transparência nem padding) gerando VP8X com EXIF e sem Alpha', async () => {
    // Imagem quadrada 512x512 opaca não recebe padding transparente do Sharp
    const opaqueInput = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 120, g: 30, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await imageProcessor.processImage(opaqueInput, jobDir);

    expect(result.sizeBytes).toBeLessThanOrEqual(100 * 1024);
    expect(result.outputBuffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(result.outputBuffer.toString('ascii', 8, 12)).toBe('WEBP');
    // Obrigatoriamente VP8X para conter EXIF (e não simples VP8 )
    expect(result.outputBuffer.toString('ascii', 12, 16)).toBe('VP8X');

    const flags = result.outputBuffer.readUInt8(20);
    expect(Boolean(flags & 0x08)).toBe(true); // EXIF habilitado
    expect(Boolean(flags & 0x10)).toBe(false); // Alpha desabilitado

    // Valida que o EXIF injetado pode ser lido perfeitamente
    const img = new webpmux.Image();
    await img.load(result.outputBuffer);
    expect(img.exif).toBeDefined();

    const exif = img.exif as Buffer;
    const jsonLen = exif.readUInt32LE(14);
    const json = JSON.parse(exif.subarray(22, 22 + jsonLen).toString('utf-8'));
    expect(json['sticker-pack-id']).toBe('com.whatsapp.auto.sticker');
  });
});
