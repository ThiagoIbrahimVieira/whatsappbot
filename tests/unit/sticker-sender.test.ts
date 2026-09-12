import { describe, it, expect, vi } from 'vitest';
import { stickerSender } from '../../src/whatsapp/sticker-sender.js';
import { CONSTANTS } from '../../src/config/constants.js';
import { WhatsAppSendError } from '../../src/utils/errors.js';

describe('Sticker Sender (Baileys)', () => {
  it('deve enviar figurinha estática com width, height e isAnimated=false no protobuf', async () => {
    const mockSock: any = {
      sendMessage: vi.fn().mockResolvedValue({ key: { id: 'msg-123' } }),
    };

    const dummyBuffer = Buffer.from('fake-webp');
    const chatId = '5511999999999@s.whatsapp.net';

    await stickerSender.sendSticker(mockSock, chatId, dummyBuffer);

    expect(mockSock.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      chatId,
      {
        sticker: dummyBuffer,
        isAnimated: false,
        width: CONSTANTS.STICKER_WIDTH,
        height: CONSTANTS.STICKER_HEIGHT,
      },
      undefined
    );
  });

  it('deve enviar figurinha animada com width, height e isAnimated=true', async () => {
    const mockSock: any = {
      sendMessage: vi.fn().mockResolvedValue({ key: { id: 'msg-456' } }),
    };

    const dummyBuffer = Buffer.from('fake-animated-webp');
    const chatId = '5511999999999@s.whatsapp.net';
    const mockQuoted = { key: { id: 'quoted-1' } };

    await stickerSender.sendSticker(
      mockSock,
      chatId,
      dummyBuffer,
      mockQuoted,
      { isAnimated: true }
    );

    expect(mockSock.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      chatId,
      {
        sticker: dummyBuffer,
        isAnimated: true,
        width: CONSTANTS.STICKER_WIDTH,
        height: CONSTANTS.STICKER_HEIGHT,
      },
      { quoted: mockQuoted }
    );
  });

  it('deve lançar WhatsAppSendError quando sock.sendMessage falhar', async () => {
    const mockSock: any = {
      sendMessage: vi.fn().mockRejectedValue(new Error('Connection lost')),
    };

    const dummyBuffer = Buffer.from('fake-webp');
    const chatId = '5511999999999@s.whatsapp.net';

    await expect(
      stickerSender.sendSticker(mockSock, chatId, dummyBuffer)
    ).rejects.toThrow(WhatsAppSendError);
  });

  it('deve enviar mensagem de texto com sendText', async () => {
    const mockSock: any = {
      sendMessage: vi.fn().mockResolvedValue({ key: { id: 'msg-txt' } }),
    };

    const chatId = '5511999999999@s.whatsapp.net';
    await stickerSender.sendText(mockSock, chatId, 'Olá mundo');

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      chatId,
      { text: 'Olá mundo' },
      undefined
    );
  });
});
