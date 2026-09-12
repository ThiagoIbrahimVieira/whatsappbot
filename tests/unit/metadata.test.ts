import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import webpmux from 'node-webpmux';
import { addExifToWebp, createStickerExif } from '../../src/media/metadata.js';
import { CONSTANTS } from '../../src/config/constants.js';

describe('WebP Metadata & EXIF Container (node-webpmux)', () => {
  it('deve converter WebP opaco simples (VP8 ) para formato estendido (VP8X) com a flag EXIF (0x08)', async () => {
    // Imagem opaca criada pelo Sharp gera chunk simples 'VP8 '
    const rawOpaqueWebp = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .webp({ lossless: false })
      .toBuffer();

    expect(rawOpaqueWebp.toString('ascii', 0, 4)).toBe('RIFF');
    expect(rawOpaqueWebp.toString('ascii', 8, 12)).toBe('WEBP');
    expect(rawOpaqueWebp.toString('ascii', 12, 16)).toBe('VP8 ');

    // Injeta EXIF usando addExifToWebp
    const resultBuffer = await addExifToWebp(rawOpaqueWebp, 'MeuPacote', 'MeuAutor');

    // Valida container RIFF / WEBP
    expect(resultBuffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(resultBuffer.toString('ascii', 8, 12)).toBe('WEBP');

    // Deve ter sido convertido obrigatoriamente para chunk estendido 'VP8X'
    expect(resultBuffer.toString('ascii', 12, 16)).toBe('VP8X');

    // Byte 20 contém as flags do VP8X
    const flags = resultBuffer.readUInt8(20);
    const hasExif = Boolean(flags & 0x08);
    const hasAlpha = Boolean(flags & 0x10);
    const isAnimated = Boolean(flags & 0x02);

    expect(hasExif).toBe(true);
    expect(hasAlpha).toBe(false);
    expect(isAnimated).toBe(false);

    // O arquivo agora contém um chunk EXIF válido
    const img = new webpmux.Image();
    await img.load(resultBuffer);
    expect(img.exif).toBeDefined();
    expect(img.hasAlpha).toBe(false);
    expect(img.hasAnim).toBe(false);
  });

  it('deve preservar transparência (Alpha 0x10) e adicionar EXIF (0x08) em WebP com canal alfa', async () => {
    // Imagem transparente criada pelo Sharp já gera VP8X com flag de alpha
    const rawAlphaWebp = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 0.5 },
      },
    })
      .webp({ lossless: false })
      .toBuffer();

    const resultBuffer = await addExifToWebp(rawAlphaWebp, 'MeuPacote', 'MeuAutor');

    expect(resultBuffer.toString('ascii', 12, 16)).toBe('VP8X');

    const flags = resultBuffer.readUInt8(20);
    const hasExif = Boolean(flags & 0x08);
    const hasAlpha = Boolean(flags & 0x10);

    expect(hasExif).toBe(true);
    expect(hasAlpha).toBe(true);

    const img = new webpmux.Image();
    await img.load(resultBuffer);
    expect(img.exif).toBeDefined();
    expect(img.hasAlpha).toBe(true);
  });

  it('deve formatar e recuperar o payload JSON de sticker pack do WhatsApp sem perdas', async () => {
    const rawWebp = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 50, g: 50, b: 200 },
      },
    })
      .webp()
      .toBuffer();

    const customPack = 'Pacote Exclusivo';
    const customAuthor = 'Bot Developer';
    const resultBuffer = await addExifToWebp(rawWebp, customPack, customAuthor);

    // Carrega novamente via webpmux e inspeciona o chunk EXIF
    const img = new webpmux.Image();
    await img.load(resultBuffer);
    expect(img.exif).toBeDefined();

    const exifBuffer = img.exif as Buffer;
    expect(exifBuffer.length).toBeGreaterThan(22);

    // Conforme especificação do WhatsApp Sticker EXIF:
    // Bytes 0..21 são cabeçalho TIFF / Exif (com tamanho do JSON em little-endian nos bytes 14..17)
    const jsonLength = exifBuffer.readUInt32LE(14);
    const jsonStr = exifBuffer.subarray(22, 22 + jsonLength).toString('utf-8');
    const parsed = JSON.parse(jsonStr);

    expect(parsed['sticker-pack-id']).toBe('com.whatsapp.auto.sticker');
    expect(parsed['sticker-pack-name']).toBe(customPack);
    expect(parsed['sticker-pack-publisher']).toBe(customAuthor);
    expect(parsed['emojis']).toEqual(['🤖']);
  });

  it('deve usar valores padrão das constantes quando packName e author não forem informados', async () => {
    const rawWebp = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 10, g: 10, b: 10 },
      },
    })
      .webp()
      .toBuffer();

    const resultBuffer = await addExifToWebp(rawWebp);

    const img = new webpmux.Image();
    await img.load(resultBuffer);
    const exifBuffer = img.exif as Buffer;
    const jsonLength = exifBuffer.readUInt32LE(14);
    const parsed = JSON.parse(exifBuffer.subarray(22, 22 + jsonLength).toString('utf-8'));

    expect(parsed['sticker-pack-name']).toBe(CONSTANTS.STICKER_PACK_NAME);
    expect(parsed['sticker-pack-publisher']).toBe(CONSTANTS.STICKER_PACK_AUTHOR);
  });

  it('deve retornar buffer original com segurança se o input não for um WebP válido ou se webpmux falhar', async () => {
    // Buffer curto (< 12 bytes)
    const shortBuffer = Buffer.from('RIFF123');
    const resultShort = await addExifToWebp(shortBuffer);
    expect(resultShort).toBe(shortBuffer);

    // Buffer não-WebP (ex: PNG ou texto)
    const invalidBuffer = Buffer.from('NOT A VALID WEBP FILE HEADER');
    const resultInvalid = await addExifToWebp(invalidBuffer);
    expect(resultInvalid).toBe(invalidBuffer);

    // Simulação de erro interno do webpmux ao carregar dados corrompidos
    const validHeaderCorruptBody = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 ...');
    const loadSpy = vi
      .spyOn(webpmux.Image.prototype, 'load')
      .mockRejectedValueOnce(new Error('Corrupt WebP chunk structure'));

    try {
      const fallbackResult = await addExifToWebp(validHeaderCorruptBody);
      expect(fallbackResult).toBe(validHeaderCorruptBody);
    } finally {
      loadSpy.mockRestore();
    }
  });
});
