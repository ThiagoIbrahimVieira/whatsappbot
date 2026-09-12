import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import { messageRouter } from '../../src/whatsapp/message-router.js';
import { mediaDownloader } from '../../src/whatsapp/media-downloader.js';
import { stickerSender } from '../../src/whatsapp/sticker-sender.js';
import { jobQueue } from '../../src/queue/job-queue.js';
import { cleanAllTmp } from '../../src/utils/files.js';
import { recentMessages } from '../../src/utils/cache.js';
import { sessionManager } from '../../src/control/session-manager.js';
import { botState } from '../../src/control/bot-state.js';
import { accessControl } from '../../src/control/access-control.js';

describe('Integration Flow: End-to-End Media Processing', () => {
  let mockSock: any;

  beforeEach(async () => {
    recentMessages.clear();
    sessionManager.clear();
    botState.setProcessingMode('automatic');
    accessControl.setAccessMode('all');
    await cleanAllTmp();

    mockSock = {
      sendMessage: vi.fn().mockResolvedValue({ key: { id: 'sent-msg' } }),
      updateMediaMessage: vi.fn(),
    };
  });

  afterEach(async () => {
    await cleanAllTmp();
  });

  it('deve processar uma imagem ponta a ponta do recebimento ao envio da figurinha WebP', async () => {
    // 1. Gera uma imagem real usando o Sharp
    const realImageBuffer = await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 100, g: 200, b: 50, alpha: 1 },
      },
    })
      .jpeg()
      .toBuffer();

    // 2. Mock do download que salva o buffer real em disco no jobDir
    vi.spyOn(mediaDownloader, 'download').mockImplementation(
      async (_rawMsg, _mediaType, jobDir) => {
        const filePath = `${jobDir}/test_photo.jpg`;
        await fs.writeFile(filePath, realImageBuffer);
        return {
          filePath,
          buffer: realImageBuffer,
          sizeBytes: realImageBuffer.length,
        };
      }
    );

    const sendStickerSpy = vi
      .spyOn(stickerSender, 'sendSticker')
      .mockResolvedValue();

    // 3. Simula mensagem recebida de um amigo em conversa privada
    const incomingMessage = {
      key: {
        id: 'real-flow-msg-1',
        remoteJid: '5511988887777@s.whatsapp.net',
        fromMe: false,
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      message: {
        imageMessage: {
          mimetype: 'image/jpeg',
          fileLength: realImageBuffer.length,
        },
      },
    };

    // 4. Executa o fluxo no roteador
    await messageRouter.handleMessage(mockSock, incomingMessage);

    // Aguarda conclusão do job assíncrono na fila
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 5. Validações
    expect(sendStickerSpy).toHaveBeenCalledTimes(1);

    const [calledSock, calledChatId, stickerBuffer, _quoted, options] = sendStickerSpy.mock.calls[0];
    expect(calledSock).toBe(mockSock);
    expect(calledChatId).toBe('5511988887777@s.whatsapp.net');
    expect(options).toEqual({ isAnimated: false });

    // Valida que o buffer enviado é realmente um WebP 512x512 dentro do limite de 100 KB
    const stickerMeta = await sharp(stickerBuffer).metadata();
    expect(stickerMeta.format).toBe('webp');
    expect(stickerMeta.width).toBe(512);
    expect(stickerMeta.height).toBe(512);
    expect(stickerBuffer.length).toBeLessThanOrEqual(100 * 1024);

    const stats = jobQueue.getStats();
    expect(stats.completed).toBeGreaterThanOrEqual(1);
    expect(stats.failed).toBe(0);
  });
});
