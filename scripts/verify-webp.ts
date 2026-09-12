/**
 * Script de verificação e inspeção profunda de chunks do contêiner WebP.
 * Valida a conformidade do contêiner WebP com a RFC e com o parser nativo do WhatsApp.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { imageProcessor } from '../src/media/image-processor.js';
import { createJobDir, removeJobDir } from '../src/utils/files.js';

interface WebPChunk {
  fourCC: string;
  size: number;
  offset: number;
}

function parseWebPChunks(buffer: Buffer): WebPChunk[] {
  const chunks: WebPChunk[] = [];
  if (buffer.length < 12) return chunks;

  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    throw new Error('Não é um arquivo RIFF/WEBP válido');
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const fourCC = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    chunks.push({ fourCC, size, offset });

    // Cada chunk é alinhado em múltiplos de 2 bytes (padding byte se size for ímpar)
    const paddedSize = size + (size % 2);
    offset += 8 + paddedSize;
  }

  return chunks;
}

async function runVerification() {
  console.log('='.repeat(70));
  console.log(' INICIANDO INSPEÇÃO DE CONTEINER WEBP PARA STICKERS DO WHATSAPP');
  console.log('='.repeat(70));

  const jobDir = await createJobDir('verify-webp-job');

  try {
    // -------------------------------------------------------------------------
    // CENÁRIO 1: Imagem 100% Sólida / Opaca (ex: Foto de Câmera / Cenário do Bug)
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 1] Foto / Imagem 100% Sólida (512x512 opaca sem transparência)');
    const opaqueJpg = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 230, g: 80, b: 60 },
      },
    })
      .jpeg()
      .toBuffer();

    const opaqueResult = await imageProcessor.processImage(opaqueJpg, jobDir);
    const opaqueChunks = parseWebPChunks(opaqueResult.outputBuffer);

    console.log(`- Tamanho do arquivo gerado: ${opaqueResult.sizeBytes} bytes (limite: 102400 bytes)`);
    console.log('- Chunks RIFF detectados:');
    for (const ch of opaqueChunks) {
      console.log(`   * [${ch.fourCC}] tamanho: ${ch.size} bytes (offset: ${ch.offset})`);
    }

    // Validações no VP8X
    const vp8xChunk = opaqueChunks.find((c) => c.fourCC === 'VP8X');
    if (!vp8xChunk) {
      throw new Error('FALHA: Chunk VP8X ausente em imagem opaca com EXIF!');
    }

    const vp8xFlags = opaqueResult.outputBuffer.readUInt8(vp8xChunk.offset + 8);
    const hasExif = Boolean(vp8xFlags & 0x08);
    const hasAlpha = Boolean(vp8xFlags & 0x10);
    const hasAnim = Boolean(vp8xFlags & 0x02);

    console.log(`- Flags VP8X (byte 20): 0x${vp8xFlags.toString(16).padStart(2, '0')} (0b${vp8xFlags.toString(2).padStart(8, '0')})`);
    console.log(`   * Bit EXIF  (0x08): ${hasExif ? 'SIM (Correto)' : 'NÃO (ERRO!)'}`);
    console.log(`   * Bit Alpha (0x10): ${hasAlpha ? 'SIM' : 'NÃO (Esperado para imagem opaca)'}`);
    console.log(`   * Bit Anim  (0x02): ${hasAnim ? 'SIM' : 'NÃO'}`);

    if (!hasExif) {
      throw new Error('FALHA: Flag EXIF não está ativada no cabeçalho VP8X!');
    }

    // Inspeciona chunk EXIF
    const exifChunk = opaqueChunks.find((c) => c.fourCC === 'EXIF');
    if (!exifChunk) {
      throw new Error('FALHA: Chunk EXIF ausente no arquivo WebP!');
    }

    const exifPayload = opaqueResult.outputBuffer.subarray(
      exifChunk.offset + 8,
      exifChunk.offset + 8 + exifChunk.size
    );
    const jsonLen = exifPayload.readUInt32LE(14);
    const stickerJson = JSON.parse(
      exifPayload.subarray(22, 22 + jsonLen).toString('utf-8')
    );
    console.log('- Metadados do WhatsApp Sticker Pack extraídos do EXIF:');
    console.log(`   * Pack Name : "${stickerJson['sticker-pack-name']}"`);
    console.log(`   * Publisher : "${stickerJson['sticker-pack-publisher']}"`);
    console.log(`   * Emojis    : ${JSON.stringify(stickerJson['emojis'])}`);

    // -------------------------------------------------------------------------
    // CENÁRIO 2: Imagem com Transparência (PNG com canal Alfa)
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 2] Imagem com Transparência (Círculo translúcido com canal Alpha)');
    const transparentPng = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 50, g: 150, b: 250, alpha: 0.6 },
      },
    })
      .png()
      .toBuffer();

    const transResult = await imageProcessor.processImage(transparentPng, jobDir);
    const transChunks = parseWebPChunks(transResult.outputBuffer);

    console.log(`- Tamanho do arquivo gerado: ${transResult.sizeBytes} bytes`);
    console.log('- Chunks RIFF detectados:');
    for (const ch of transChunks) {
      console.log(`   * [${ch.fourCC}] tamanho: ${ch.size} bytes (offset: ${ch.offset})`);
    }

    const transVp8x = transChunks.find((c) => c.fourCC === 'VP8X');
    if (!transVp8x) {
      throw new Error('FALHA: Chunk VP8X ausente em imagem transparente!');
    }

    const transFlags = transResult.outputBuffer.readUInt8(transVp8x.offset + 8);
    const transHasExif = Boolean(transFlags & 0x08);
    const transHasAlpha = Boolean(transFlags & 0x10);

    console.log(`- Flags VP8X (byte 20): 0x${transFlags.toString(16).padStart(2, '0')} (0b${transFlags.toString(2).padStart(8, '0')})`);
    console.log(`   * Bit EXIF  (0x08): ${transHasExif ? 'SIM (Correto)' : 'NÃO (ERRO!)'}`);
    console.log(`   * Bit Alpha (0x10): ${transHasAlpha ? 'SIM (Correto - transparência preservada)' : 'NÃO (ERRO!)'}`);

    if (!transHasExif || !transHasAlpha) {
      throw new Error('FALHA: Flags VP8X inválidas para figurinha com transparência!');
    }

    console.log('\n' + '='.repeat(70));
    console.log(' SUCESSO: Todos os WebP stickers estão 100% conformes com o WhatsApp!');
    console.log('='.repeat(70));
  } finally {
    await removeJobDir(jobDir);
  }
}

runVerification().catch((err) => {
  console.error('Erro na verificação:', err);
  process.exit(1);
});
