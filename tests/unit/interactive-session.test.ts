import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManager } from '../../src/control/session-manager.js';
import { messageRouter } from '../../src/whatsapp/message-router.js';
import { stickerSender } from '../../src/whatsapp/sticker-sender.js';
import { botState } from '../../src/control/bot-state.js';
import { recentMessages } from '../../src/utils/cache.js';

describe('Interactive Media Flow & Session Manager', () => {
  let sessionMgr: SessionManager;
  let mockSock: any;

  beforeEach(() => {
    sessionMgr = new SessionManager();
    recentMessages.clear();
    mockSock = {
      sendMessage: vi.fn(),
      updateMediaMessage: vi.fn(),
    };
    vi.spyOn(stickerSender, 'sendText').mockResolvedValue();
    vi.spyOn(stickerSender, 'sendSticker').mockResolvedValue();
  });

  it('deve criar uma sessão interativa com TTL de 5 minutos', () => {
    const now = Date.now();
    const session = sessionMgr.createSession({
      chatId: '5511999991111@s.whatsapp.net',
      senderJid: '5511999991111@s.whatsapp.net',
      sourceMessageId: 'msg_test_1',
      mediaType: 'image',
      mimetype: 'image/jpeg',
    });

    expect(session).toBeDefined();
    expect(session.currentStep).toBe('WAITING_FOR_ACTION');
    expect(session.expiresAt).toBeGreaterThanOrEqual(now + 4 * 60 * 1000);
    expect(session.expiresAt).toBeLessThanOrEqual(now + 5 * 60 * 1000 + 1000);

    const retrieved = sessionMgr.getSession('5511999991111@s.whatsapp.net');
    expect(retrieved?.id).toBe(session.id);
  });

  it('deve transicionar de estado na máquina de estados (WAITING_FOR_ACTION -> WAITING_FOR_TEXT -> COMPLETED)', () => {
    const session = sessionMgr.createSession({
      chatId: '5511999992222@s.whatsapp.net',
      senderJid: '5511999992222@s.whatsapp.net',
      sourceMessageId: 'msg_test_2',
      mediaType: 'image',
      mimetype: 'image/jpeg',
    });

    // 1. Transição para WAITING_FOR_TEXT
    sessionMgr.updateSession(session.id, {
      currentStep: 'WAITING_FOR_TEXT',
      selectedAction: 'meme',
    });
    let current = sessionMgr.getSession('5511999992222@s.whatsapp.net');
    expect(current?.currentStep).toBe('WAITING_FOR_TEXT');
    expect(current?.selectedAction).toBe('meme');

    // 2. Transição para COMPLETED
    sessionMgr.completeSession(session.id);
    current = sessionMgr.getSession('5511999992222@s.whatsapp.net');
    expect(current).toBeNull();
  });

  it('deve cancelar a sessão imediatamente se o usuário enviar "cancelar" ou "0"', () => {
    sessionMgr.createSession({
      chatId: '5511999993333@s.whatsapp.net',
      senderJid: '5511999993333@s.whatsapp.net',
      sourceMessageId: 'msg_test_3',
      mediaType: 'video',
      mimetype: 'video/mp4',
    });

    const cancelled = sessionMgr.cancelSession('5511999993333@s.whatsapp.net', 'Cancelado pelo usuário');
    expect(cancelled).toBe(true);

    const session = sessionMgr.getSession('5511999993333@s.whatsapp.net');
    expect(session).toBeNull();
  });

  it('deve substituir sessão anterior caso o mesmo chat envie uma nova mídia', () => {
    const sess1 = sessionMgr.createSession({
      chatId: '5511999994444@s.whatsapp.net',
      senderJid: '5511999994444@s.whatsapp.net',
      sourceMessageId: 'msg_test_4a',
      mediaType: 'image',
      mimetype: 'image/jpeg',
    });

    const sess2 = sessionMgr.createSession({
      chatId: '5511999994444@s.whatsapp.net',
      senderJid: '5511999994444@s.whatsapp.net',
      sourceMessageId: 'msg_test_4b',
      mediaType: 'gif',
      mimetype: 'image/gif',
    });

    expect(sess2.id).not.toBe(sess1.id);
    const active = sessionMgr.getSession('5511999994444@s.whatsapp.net');
    expect(active?.id).toBe(sess2.id);
    expect(active?.mediaType).toBe('gif');
  });

  it('deve descartar sessões com expiresAt no passado ao invocar cleanupExpired', () => {
    const session = sessionMgr.createSession({
      chatId: '5511999995555@s.whatsapp.net',
      senderJid: '5511999995555@s.whatsapp.net',
      sourceMessageId: 'msg_test_5',
      mediaType: 'image',
      mimetype: 'image/jpeg',
    });

    // Simula expiração alterando timestamp
    session.expiresAt = Date.now() - 1000;

    const cleanedCount = sessionMgr.cleanupExpired();
    expect(cleanedCount).toBe(1);

    const active = sessionMgr.getSession('5511999995555@s.whatsapp.net');
    expect(active).toBeNull();
  });

  it('deve enviar menu interativo quando processingMode for interactive ao receber imagem', async () => {
    botState.setProcessingMode('interactive');

    const rawMsg = {
      key: {
        id: 'msg-interactive-photo',
        remoteJid: '5511988887777@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        imageMessage: { mimetype: 'image/jpeg' },
      },
    };

    await messageRouter.handleMessage(mockSock, rawMsg);

    expect(stickerSender.sendText).toHaveBeenCalledTimes(1);
    const [calledSock, calledChat, textPrompt] = (stickerSender.sendText as any).mock.calls[0];
    expect(calledChat).toBe('5511988887777@s.whatsapp.net');
    expect(textPrompt).toContain('Recebi sua mídia 👀');
    expect(textPrompt).toContain('1. 🖼️ *Figurinha*');
    expect(textPrompt).toContain('2. 🎭 *Meme*');
  });
});
