import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageRouter } from '../../src/whatsapp/message-router.js';
import { mediaDownloader } from '../../src/whatsapp/media-downloader.js';
import { stickerProcessor } from '../../src/media/sticker-processor.js';
import { stickerSender } from '../../src/whatsapp/sticker-sender.js';
import { recentMessages } from '../../src/utils/cache.js';

describe('Message Router Business Rules', () => {
  let mockSock: any;

  beforeEach(() => {
    recentMessages.clear();
    mockSock = {
      sendMessage: vi.fn(),
      updateMediaMessage: vi.fn(),
    };

    vi.spyOn(mediaDownloader, 'download').mockResolvedValue({
      filePath: '/tmp/test.jpg',
      buffer: Buffer.from('test'),
      sizeBytes: 1024,
    });

    vi.spyOn(stickerProcessor, 'process').mockResolvedValue({
      outputPath: '/tmp/sticker.webp',
      outputBuffer: Buffer.from('webp'),
      mimetype: 'image/webp',
      isAnimated: false,
      width: 512,
      height: 512,
      sizeBytes: 2048,
      processingTimeMs: 15,
    });

    vi.spyOn(stickerSender, 'sendSticker').mockResolvedValue();
    vi.spyOn(stickerSender, 'sendText').mockResolvedValue();
  });

  // =========================================================================
  // GRUPOS: DEVEM SER 100% IGNORADOS SEM NENHUM PROCESSAMENTO OU RESPOSTA
  // =========================================================================
  it('deve ignorar foto enviada em grupo sem baixar mídia nem responder', async () => {
    const rawMsg = {
      key: {
        id: 'msg-grp-photo',
        remoteJid: '123456789-987654@g.us',
        fromMe: false,
      },
      message: {
        imageMessage: { mimetype: 'image/jpeg' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).not.toHaveBeenCalled();
    expect(stickerProcessor.process).not.toHaveBeenCalled();
    expect(stickerSender.sendSticker).not.toHaveBeenCalled();
    expect(mockSock.sendMessage).not.toHaveBeenCalled();
  });

  it('deve ignorar vídeo enviado em grupo', async () => {
    const rawMsg = {
      key: {
        id: 'msg-grp-vid',
        remoteJid: '123456789-987654@g.us',
        fromMe: false,
      },
      message: {
        videoMessage: { mimetype: 'video/mp4', seconds: 4 },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).not.toHaveBeenCalled();
    expect(stickerSender.sendSticker).not.toHaveBeenCalled();
  });

  it('deve ignorar comandos enviados em grupo (ex: /ping, /help)', async () => {
    const rawMsg = {
      key: {
        id: 'msg-grp-cmd',
        remoteJid: '123456789-987654@g.us',
        fromMe: false,
      },
      message: {
        conversation: '/ping',
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(stickerSender.sendText).not.toHaveBeenCalled();
    expect(mockSock.sendMessage).not.toHaveBeenCalled();
  });

  it('deve ignorar texto e áudio em grupo', async () => {
    const rawMsg = {
      key: {
        id: 'msg-grp-txt',
        remoteJid: '123456789-987654@g.us',
        fromMe: false,
      },
      message: {
        conversation: 'olá grupo',
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);
    expect(mediaDownloader.download).not.toHaveBeenCalled();
  });

  // =========================================================================
  // MENSAGENS HISTÓRICAS / OFFLINE ANTERIORES À INICIALIZAÇÃO
  // =========================================================================
  it('deve ignorar foto com timestamp antigo (mensagem histórica ou sincronizada offline)', async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
    const rawMsg = {
      key: {
        id: 'msg-old-photo',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      messageTimestamp: oldTimestamp,
      message: {
        imageMessage: { mimetype: 'image/jpeg' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).not.toHaveBeenCalled();
    expect(stickerSender.sendSticker).not.toHaveBeenCalled();
  });

  // =========================================================================
  // MENSAGENS PRÓPRIAS: IGNORAR (PREVENÇÃO DE LOOP)
  // =========================================================================
  it('deve ignorar foto enviada pela própria conta (fromMe = true)', async () => {
    const rawMsg = {
      key: {
        id: 'msg-own-photo',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: true,
      },
      message: {
        imageMessage: { mimetype: 'image/jpeg' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).not.toHaveBeenCalled();
    expect(stickerSender.sendSticker).not.toHaveBeenCalled();
  });

  // =========================================================================
  // DEDUPLICAÇÃO E LOOP DE MESSAGE ID
  // =========================================================================
  it('deve ignorar mensagem com mesmo ID retransmitida', async () => {
    const rawMsg = {
      key: {
        id: 'msg-duplicate-test',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        imageMessage: { mimetype: 'image/jpeg' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);
    expect(mediaDownloader.download).toHaveBeenCalledTimes(1);

    // Envia o mesmo ID novamente
    await messageRouter.handleMessage(mockSock, rawMsg);
    expect(mediaDownloader.download).toHaveBeenCalledTimes(1); // Não chamou de novo
  });

  // =========================================================================
  // PRIVADO: MÍDIAS SUPORTADAS SÃO PROCESSADAS
  // =========================================================================
  it('deve processar foto recebida em chat privado', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-photo',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        imageMessage: { mimetype: 'image/jpeg' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).toHaveBeenCalled();
    expect(stickerProcessor.process).toHaveBeenCalled();
    expect(stickerSender.sendSticker).toHaveBeenCalled();
  });

  it('deve processar vídeo recebido em chat privado', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-video',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        videoMessage: { mimetype: 'video/mp4', seconds: 5 },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).toHaveBeenCalled();
    expect(stickerProcessor.process).toHaveBeenCalled();
    expect(stickerSender.sendSticker).toHaveBeenCalled();
  });

  // =========================================================================
  // PRIVADO: TIPOS NÃO SUPORTADOS SÃO IGNORADOS
  // =========================================================================
  it('deve ignorar texto recebido em chat privado (não é chatbot)', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-text',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        conversation: 'olá, tudo bem?',
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).not.toHaveBeenCalled();
    expect(stickerSender.sendSticker).not.toHaveBeenCalled();
    expect(stickerSender.sendText).not.toHaveBeenCalled();
  });

  it('deve ignorar áudio recebido em chat privado', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-audio',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        audioMessage: { mimetype: 'audio/ogg' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).not.toHaveBeenCalled();
  });

  it('deve ignorar documento recebido em chat privado', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-doc',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        documentMessage: { mimetype: 'application/pdf' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(mediaDownloader.download).not.toHaveBeenCalled();
  });

  it('deve responder comando /ping apenas no privado', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-ping',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        conversation: '/ping',
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(stickerSender.sendText).toHaveBeenCalledWith(
      mockSock,
      '5511999999999@s.whatsapp.net',
      '🏓 pong',
      rawMsg
    );
  });

  it('deve processar figurinha quando o comando /sticker for usado respondendo a uma mídia citada (quotedMessage)', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-cmd-sticker',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        extendedTextMessage: {
          text: '/sticker',
          contextInfo: {
            stanzaId: 'quoted-img-id',
            participant: '5511999999999@s.whatsapp.net',
            quotedMessage: {
              imageMessage: { mimetype: 'image/jpeg' },
            },
          },
        },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    // Deve ter chamado o download da mensagem citada
    expect(mediaDownloader.download).toHaveBeenCalled();
    expect(stickerProcessor.process).toHaveBeenCalled();
    expect(stickerSender.sendSticker).toHaveBeenCalled();
  });

  it('deve avisar o usuário amigavelmente se /sticker for usado sem nenhuma mídia citada ou anexada', async () => {
    const rawMsg = {
      key: {
        id: 'msg-pv-cmd-nomedia',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        conversation: '/sticker',
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(stickerSender.sendText).toHaveBeenCalledWith(
      mockSock,
      '5511999999999@s.whatsapp.net',
      expect.stringContaining('Envie ou responda a uma foto, vídeo ou GIF'),
      rawMsg
    );
    expect(mediaDownloader.download).not.toHaveBeenCalled();
  });
});
