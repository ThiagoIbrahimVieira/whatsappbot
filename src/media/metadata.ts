import webpmux from 'node-webpmux';
import { CONSTANTS } from '../config/constants.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * Cria o chunk EXIF para figurinhas do WhatsApp contendo o nome do pacote e autor.
 */
export function createStickerExif(
  packName: string = config.STICKER_PACK_NAME || CONSTANTS.STICKER_PACK_NAME,
  author: string = config.STICKER_PACK_AUTHOR || CONSTANTS.STICKER_PACK_AUTHOR
): Buffer {
  const json = {
    'sticker-pack-id': 'com.whatsapp.auto.sticker',
    'sticker-pack-name': packName,
    'sticker-pack-publisher': author,
    emojis: ['🤖'],
  };

  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
  const exifHeader = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);

  exifHeader.writeUInt32LE(jsonBuff.length, 14);
  return Buffer.concat([exifHeader, jsonBuff]);
}

/**
 * Injeta o chunk EXIF em um buffer de imagem WebP de forma compatível com a especificação
 * oficial de contêiner RIFF/WebP (garante VP8X com flag EXIF 0x08 e posicionamento correto).
 * Compatível com WebP estático e WebP animado.
 */
export async function addExifToWebp(
  webpBuffer: Buffer,
  packName: string = config.STICKER_PACK_NAME || CONSTANTS.STICKER_PACK_NAME,
  author: string = config.STICKER_PACK_AUTHOR || CONSTANTS.STICKER_PACK_AUTHOR
): Promise<Buffer> {
  // Verifica se é um arquivo RIFF / WEBP válido
  if (
    webpBuffer.length < 12 ||
    webpBuffer.toString('ascii', 0, 4) !== 'RIFF' ||
    webpBuffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return webpBuffer;
  }

  try {
    const img = new webpmux.Image();
    await img.load(webpBuffer);
    img.exif = createStickerExif(packName, author);
    return await img.save(null);
  } catch (err) {
    logger.warn({ err }, 'Falha ao injetar metadados EXIF com node-webpmux, retornando buffer original');
    return webpBuffer;
  }
}

