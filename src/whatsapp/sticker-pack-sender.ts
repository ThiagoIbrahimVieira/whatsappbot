import zlib from 'node:zlib';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { WASocket } from '@whiskeysockets/baileys';
import { encryptedStream, getMediaKeys } from '@whiskeysockets/baileys/lib/Utils/messages-media.js';
import { logger } from '../utils/logger.js';
import { packManager, type StickerPack } from '../storage/pack-manager.js';
import { stickerSender } from './sticker-sender.js';
import { getSharp } from '../media/image-processor.js';
import { runFFmpeg } from '../media/ffmpeg.js';

interface ZipFileItem {
  name: string;
  buffer: Buffer;
}

/**
 * Cria um chunk PNG válido com tipo e CRC32 calculado.
 */
function createPngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}

/**
 * Gera um PNG puro em memória (sem sharp, canvas ou dependências C++)
 * Funciona de forma 100% garantida no Android Termux.
 */
function createMinimalPngBuffer(width: number, height: number, r = 17, g = 27, b = 33): Buffer {
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createPngChunk('IHDR', ihdrData);
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = createPngChunk('IDAT', idatData);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Cria um arquivo ZIP (.wastickers) em memória no padrão aceito pelo WhatsApp.
 */
function createZipBuffer(files: ZipFileItem[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const crc = zlib.crc32(file.buffer);
    const size = file.buffer.length;

    // Local file header (30 bytes + tamanho do nome)
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // assinatura do cabeçalho local
    local.writeUInt16LE(20, 4); // versão mínima (2.0)
    local.writeUInt16LE(0, 6); // flags gerais
    local.writeUInt16LE(0, 8); // método de compressão: 0 (armazenado sem compressão)
    local.writeUInt16LE(0, 10); // hora de modificação
    local.writeUInt16LE(0, 12); // data de modificação
    local.writeUInt32LE(crc, 14); // crc-32
    local.writeUInt32LE(size, 18); // tamanho comprimido
    local.writeUInt32LE(size, 22); // tamanho descomprimido
    local.writeUInt16LE(nameBuf.length, 26); // tamanho do nome
    local.writeUInt16LE(0, 28); // tamanho de campos extras
    nameBuf.copy(local, 30);

    localHeaders.push(local, file.buffer);

    // Central directory header (46 bytes + tamanho do nome)
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0); // assinatura do diretório central
    central.writeUInt16LE(20, 4); // versão criadora
    central.writeUInt16LE(20, 6); // versão mínima
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(0, 10); // método: 0
    central.writeUInt16LE(0, 12); // hora
    central.writeUInt16LE(0, 14); // data
    central.writeUInt32LE(crc, 16); // crc-32
    central.writeUInt32LE(size, 20); // tamanho comprimido
    central.writeUInt32LE(size, 24); // tamanho descomprimido
    central.writeUInt16LE(nameBuf.length, 28); // tamanho do nome
    central.writeUInt16LE(0, 30); // campos extras
    central.writeUInt16LE(0, 32); // comentário
    central.writeUInt16LE(0, 34); // número do disco
    central.writeUInt16LE(0, 36); // atributos internos
    central.writeUInt32LE(0, 38); // atributos externos
    central.writeUInt32LE(offset, 42); // offset relativo do cabeçalho local
    nameBuf.copy(central, 46);

    centralHeaders.push(central);
    offset += local.length + size;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // assinatura do EOCD
  eocd.writeUInt16LE(0, 4); // número do disco
  eocd.writeUInt16LE(0, 6); // disco com início do CD
  eocd.writeUInt16LE(files.length, 8); // entradas neste disco
  eocd.writeUInt16LE(files.length, 10); // total de entradas
  eocd.writeUInt32LE(centralDirSize, 12); // tamanho do CD
  eocd.writeUInt32LE(centralDirOffset, 16); // offset do CD
  eocd.writeUInt16LE(0, 20); // tamanho do comentário

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

/**
 * Gera thumbnail da grade 2x2 usando FFmpeg (totalmente nativo no Termux).
 */
async function generateGridThumbnailWithFFmpeg(stickers: Array<{ buffer: Buffer }>): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = Math.random().toString(36).substring(2, 9);
  const outPath = path.join(tmpDir, `grid_${id}.png`);
  const inputPaths: string[] = [];
  const count = stickers.length;

  try {
    for (let i = 0; i < 4; i++) {
      const item = stickers[i % count];
      const inPath = path.join(tmpDir, `in_${id}_${i}.webp`);
      await fs.writeFile(inPath, item.buffer);
      inputPaths.push(inPath);
    }

    const filter = [
      '[0:v]scale=120:120:force_original_aspect_ratio=decrease,pad=120:120:(ow-iw)/2:(oh-ih)/2:color=#111b21[v0]',
      '[1:v]scale=120:120:force_original_aspect_ratio=decrease,pad=120:120:(ow-iw)/2:(oh-ih)/2:color=#111b21[v1]',
      '[2:v]scale=120:120:force_original_aspect_ratio=decrease,pad=120:120:(ow-iw)/2:(oh-ih)/2:color=#111b21[v2]',
      '[3:v]scale=120:120:force_original_aspect_ratio=decrease,pad=120:120:(ow-iw)/2:(oh-ih)/2:color=#111b21[v3]',
      '[v0][v1]hstack=inputs=2[top]',
      '[v2][v3]hstack=inputs=2[bottom]',
      '[top][bottom]vstack=inputs=2,pad=256:256:(ow-iw)/2:(oh-ih)/2:color=#111b21[out]',
    ].join(';');

    const args = [
      '-y',
      '-i', inputPaths[0],
      '-i', inputPaths[1],
      '-i', inputPaths[2],
      '-i', inputPaths[3],
      '-filter_complex', filter,
      '-map', '[out]',
      '-frames:v', '1',
      outPath,
    ];

    await runFFmpeg(args);
    return await fs.readFile(outPath);
  } catch (e) {
    logger.warn({ err: e }, 'FFmpeg grid fallback falhou, tentando converter primeira figurinha');
    try {
      const singleOut = path.join(tmpDir, `single_${id}.png`);
      await runFFmpeg([
        '-y',
        '-i', inputPaths[0],
        '-vf', 'scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2:color=#111b21',
        '-frames:v', '1',
        singleOut,
      ]);
      const res = await fs.readFile(singleOut);
      fs.unlink(singleOut).catch(() => {});
      return res;
    } catch {
      return createMinimalPngBuffer(256, 256, 17, 27, 33);
    }
  } finally {
    for (const p of inputPaths) {
      fs.unlink(p).catch(() => {});
    }
    fs.unlink(outPath).catch(() => {});
  }
}

/**
 * Converte a primeira figurinha para tray.png 96x96 com FFmpeg.
 */
async function convertToTrayPngWithFFmpeg(stickerBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = Math.random().toString(36).substring(2, 9);
  const inPath = path.join(tmpDir, `tray_in_${id}.webp`);
  const outPath = path.join(tmpDir, `tray_out_${id}.png`);
  try {
    await fs.writeFile(inPath, stickerBuffer);
    await runFFmpeg([
      '-y',
      '-i', inPath,
      '-vf', 'scale=96:96:force_original_aspect_ratio=decrease,pad=96:96:(ow-iw)/2:(oh-ih)/2:color=#111b21',
      '-frames:v', '1',
      outPath,
    ]);
    return await fs.readFile(outPath);
  } finally {
    fs.unlink(inPath).catch(() => {});
    fs.unlink(outPath).catch(() => {});
  }
}

/**
 * Gera uma imagem composta 2x2 com a miniatura das 4 primeiras figurinhas do pack.
 */
async function generate2x2GridThumbnail(stickers: Array<{ buffer: Buffer }>): Promise<Buffer> {
  const count = stickers.length;
  const sharp = await getSharp();

  if (sharp) {
    try {
      const selectedBuffers: Buffer[] = [];
      for (let i = 0; i < 4; i++) {
        const item = stickers[i % count];
        selectedBuffers.push(item.buffer);
      }

      const resizedThumbs = await Promise.all(
        selectedBuffers.map(async (buf) => {
          try {
            return await sharp(buf)
              .resize(120, 120, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png()
              .toBuffer();
          } catch {
            return await sharp({
              create: { width: 120, height: 120, channels: 4, background: { r: 30, g: 40, b: 35, alpha: 1 } },
            })
              .png()
              .toBuffer();
          }
        })
      );

      return await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 17, g: 27, b: 33, alpha: 1 }, // Fundo oficial escuro do WhatsApp
        },
      })
        .composite([
          { input: resizedThumbs[0], top: 6, left: 6 },
          { input: resizedThumbs[1], top: 6, left: 130 },
          { input: resizedThumbs[2], top: 130, left: 6 },
          { input: resizedThumbs[3], top: 130, left: 130 },
        ])
        .png()
        .toBuffer();
    } catch (err) {
      logger.warn({ err }, 'Sharp falhou ao gerar grid, tentando FFmpeg fallback');
    }
  }

  // Fallback 1: FFmpeg
  try {
    return await generateGridThumbnailWithFFmpeg(stickers);
  } catch (err) {
    logger.warn({ err }, 'FFmpeg falhou ao gerar grid, usando PNG nativo');
  }

  // Fallback 2: PNG nativo puro
  return createMinimalPngBuffer(256, 256, 17, 27, 33);
}

/**
 * Encripta um buffer com uma chave AES pré-existente (para garantir que thumbnail e zip compartilhem a mesma mediaKey).
 */
async function encryptBufferWithKey(buffer: Buffer, mediaKey: Buffer | Uint8Array, mediaType: any) {
  const { cipherKey, iv, macKey } = await getMediaKeys(mediaKey, mediaType);
  if (!cipherKey || !iv || !macKey) {
    throw new Error('Falha ao derivar chaves de mídia');
  }
  const aes = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
  const hmac = crypto.createHmac('sha256', macKey).update(iv);
  const sha256Plain = crypto.createHash('sha256').update(buffer);

  const cipherBody = Buffer.concat([aes.update(buffer), aes.final()]);
  hmac.update(cipherBody);
  const mac = hmac.digest().slice(0, 10);
  const fullEnc = Buffer.concat([cipherBody, mac]);

  const sha256Enc = crypto.createHash('sha256').update(fullEnc);

  const tmpPath = path.join(os.tmpdir(), `enc_${Math.random().toString(36).slice(2)}.enc`);
  await fs.writeFile(tmpPath, fullEnc);

  return {
    filePath: tmpPath,
    fileSha256: sha256Plain.digest(),
    fileEncSha256: sha256Enc.digest(),
    fileLength: buffer.length,
  };
}

export class StickerPackSender {
  /**
   * Envia o pacote de figurinhas no formato oficial de Card do WhatsApp (com grade 2x2 e botão "Ver pacote").
   */
  public async sendStickerPackCard(
    sock: WASocket,
    chatId: string,
    pack: StickerPack,
    rawMessage?: any
  ): Promise<boolean> {
    const stickers = await packManager.getStickerBuffersForPack(pack.id);
    if (stickers.length === 0) {
      await stickerSender.sendText(
        sock,
        chatId,
        `📭 O pack *"${pack.name}"* está vazio!\nCrie figurinhas e toque em "Salvar no Meu Pack" para adicioná-las.`,
        rawMessage
      );
      return false;
    }

    try {
      logger.info({ packName: pack.name, count: stickers.length }, 'Gerando card oficial de Sticker Pack...');

      // 1. Gera o thumbnail em grade 2x2 (preview de 4 figurinhas)
      const gridThumbBuffer = await generate2x2GridThumbnail(stickers);

      // 2. Gera o ícone da bandeja (tray.png - 96x96)
      let trayBuffer: Buffer;
      const sharp = await getSharp();
      if (sharp) {
        try {
          trayBuffer = await sharp(stickers[0].buffer)
            .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        } catch {
          trayBuffer = gridThumbBuffer;
        }
      } else {
        try {
          trayBuffer = await convertToTrayPngWithFFmpeg(stickers[0].buffer);
        } catch {
          trayBuffer = gridThumbBuffer;
        }
      }

      // 3. Monta os arquivos do ZIP (.wastickers)
      const metadataJson = JSON.stringify({
        'sticker-pack-id': pack.id,
        'sticker-pack-name': pack.name,
        'sticker-pack-publisher': 'WhatsApp Auto Sticker',
        'tray-image-file': 'tray.png',
        stickers: stickers.map((_, i) => ({
          'image-file': `${i + 1}.webp`,
          emojis: ['⭐'],
        })),
      });

      const zipFiles: ZipFileItem[] = [
        { name: 'metadata.json', buffer: Buffer.from(metadataJson, 'utf8') },
        { name: 'tray.png', buffer: trayBuffer },
      ];

      for (let i = 0; i < stickers.length; i++) {
        zipFiles.push({
          name: `${i + 1}.webp`,
          buffer: stickers[i].buffer,
        });
      }

      const zipBuffer = createZipBuffer(zipFiles);

      // 4. Encripta e faz upload do ZIP para os servidores de mídia do WhatsApp
      const encZip = await encryptedStream(zipBuffer, 'document');
      const uploadZip = await sock.waUploadToServer(encZip.encFilePath, {
        mediaType: 'document',
        fileEncSha256B64: encZip.fileEncSha256.toString('base64'),
      });

      // 5. Encripta o thumbnail 2x2 usando a MESMA mediaKey do pacote
      let uploadThumb: any = null;
      let encThumb: any = null;
      try {
        encThumb = await encryptBufferWithKey(gridThumbBuffer, encZip.mediaKey, 'image');
        uploadThumb = await sock.waUploadToServer(encThumb.filePath, {
          mediaType: 'image',
          fileEncSha256B64: encThumb.fileEncSha256.toString('base64'),
        });
        fs.unlink(encThumb.filePath).catch(() => {});
      } catch (thumbErr: any) {
        logger.warn({ thumbErr: thumbErr?.message }, 'Aviso: Falha ao encriptar thumbnail do pack');
      }

      // Limpeza do arquivo temporário do zip
      fs.unlink(encZip.encFilePath).catch(() => {});

      // 6. Constrói o payload oficial do StickerPackMessage do WhatsApp
      const stickerPackMessage: any = {
        stickerPackId: pack.id,
        name: pack.name,
        publisher: 'WhatsApp Auto Sticker',
        fileLength: encZip.fileLength,
        fileSha256: encZip.fileSha256,
        fileEncSha256: encZip.fileEncSha256,
        mediaKey: encZip.mediaKey,
        directPath: uploadZip.directPath,
        caption: pack.name,
        packDescription: `${pack.name} (${stickers.length} figurinhas)`,
        mediaKeyTimestamp: Math.floor(Date.now() / 1000),
        trayIconFileName: 'tray.png',
        stickerPackSize: encZip.fileLength,
        stickerPackOrigin: 2, // USER_CREATED
        stickers: stickers.map((s, idx) => ({
          fileName: `${idx + 1}.webp`,
          isAnimated: Boolean(s.isAnimated),
          emojis: ['⭐'],
          accessibilityLabel: pack.name,
          mimetype: 'image/webp',
        })),
      };

      if (uploadThumb && encThumb) {
        stickerPackMessage.thumbnailDirectPath = uploadThumb.directPath;
        stickerPackMessage.thumbnailSha256 = encThumb.fileSha256;
        stickerPackMessage.thumbnailEncSha256 = encThumb.fileEncSha256;
        stickerPackMessage.thumbnailHeight = 256;
        stickerPackMessage.thumbnailWidth = 256;
        stickerPackMessage.imageDataHash = encThumb.fileSha256.toString('base64');
      }

      if (rawMessage?.key) {
        stickerPackMessage.contextInfo = {
          stanzaId: rawMessage.key.id,
          participant: rawMessage.key.participant || rawMessage.key.remoteJid,
          quotedMessage: rawMessage.message,
        };
      }

      // 7. Envia a mensagem nativa de Card do WhatsApp via relayMessage (preview)
      try {
        await sock.relayMessage(
          chatId,
          { stickerPackMessage },
          {}
        );
        logger.info({ chatId, packName: pack.name }, '✅ Card oficial de Sticker Pack enviado com sucesso!');
      } catch (relayErr: any) {
        logger.warn({ relayErr: relayErr?.message }, 'Aviso: relayMessage do card falhou');
      }

      // 8. Envia o arquivo .wastickers (compatível com Sticker Maker e Sticker.ly no Android)
      try {
        await sock.sendMessage(chatId, {
          document: zipBuffer,
          mimetype: 'application/octet-stream',
          fileName: `${pack.name}.wastickers`,
          caption: `📦 Arquivo *${pack.name}.wastickers*\n_(Toque para abrir com Sticker Maker ou Sticker.ly e adicionar ao WhatsApp com 1 toque)_`,
        });
      } catch (docErr: any) {
        logger.warn({ docErr: docErr?.message }, 'Aviso ao enviar arquivo .wastickers');
      }

      // 9. Entrega TODAS as figurinhas diretamente no chat para que o usuário possa usar e favoritar imediatamente
      await stickerSender.sendText(
        sock,
        chatId,
        `🚀 *Entregando as ${stickers.length} figurinhas de "${pack.name}" abaixo no chat:*`,
        rawMessage
      );

      for (const item of stickers) {
        await stickerSender.sendSticker(sock, chatId, item.buffer, rawMessage, {
          isAnimated: item.isAnimated,
        });
        await new Promise((r) => setTimeout(r, 250));
      }

      await stickerSender.sendText(
        sock,
        chatId,
        `✅ *Todas as ${stickers.length} figurinhas de "${pack.name}" foram entregues!* 🎉\n_(Basta tocar nelas para usar ou salvar nos favoritos ⭐)_`,
        rawMessage
      );

      return true;
    } catch (err: any) {
      logger.warn({ err: err?.message, packName: pack.name }, 'Erro ao enviar card nativo do sticker pack. Usando fallback sequencial...');

      await stickerSender.sendText(
        sock,
        chatId,
        `🚀 *Enviando ${stickers.length} figurinhas do pack "${pack.name}"...*`,
        rawMessage
      );

      for (const item of stickers) {
        await stickerSender.sendSticker(sock, chatId, item.buffer, rawMessage, {
          isAnimated: item.isAnimated,
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      await stickerSender.sendText(
        sock,
        chatId,
        `✅ *Todas as ${stickers.length} figurinhas de "${pack.name}" foram entregues!* 🎉`,
        rawMessage
      );
      return true;
    }
  }
}

export const stickerPackSender = new StickerPackSender();
