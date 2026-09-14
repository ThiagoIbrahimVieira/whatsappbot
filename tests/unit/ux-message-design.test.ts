import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleHelp } from '../../src/commands/handlers/help.js';
import { handlePack } from '../../src/commands/handlers/pack.js';
import { handleVip } from '../../src/commands/handlers/vip.js';
import { handleMode } from '../../src/commands/handlers/mode.js';
import * as interactiveMessages from '../../src/whatsapp/interactive-messages.js';
import { whatsappClient } from '../../src/whatsapp/client.js';

describe('UX Message Design & Separation Rules (Text Context vs Poll Interaction)', () => {
  const chatId = '5511999990001@s.whatsapp.net';
  const mockSock = {
    sendMessage: vi.fn().mockResolvedValue({ key: { id: 'msg-poll-1' } }),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(whatsappClient, 'getSocket').mockReturnValue(mockSock as any);
  });

  it('/help: texto deve ser documentação estruturada e enquete de navegação sem duplicação', async () => {
    let replyText = '';
    const pollSpy = vi.spyOn(interactiveMessages, 'sendInteractivePoll').mockResolvedValue({ key: { id: 'poll-help-1' } } as any);

    const ctx = {
      command: { name: 'help', args: [], rawText: '/help', isCommand: true },
      message: { id: 'msg-1', chatId, senderJid: chatId, fromMe: false, timestamp: Date.now() },
      reply: vi.fn().mockImplementation(async (text: string) => {
        replyText = text;
      }),
      senderPhone: '5511999990001',
      isSelfChat: false,
    } as any;

    await handleHelp(ctx);

    // 1. O texto do /help deve ser documentação organizada em categorias
    expect(replyText).toContain('🤖 *TT Sticker Bot — Guia Rápido*');
    expect(replyText).toContain('📸 *CRIE:*');
    expect(replyText).toContain('📦 *PACKS:*');
    expect(replyText).toContain('🏆 *CONQUISTAS:*');
    expect(replyText).toContain('💎 *VIP:*');
    expect(replyText).toContain('⚙️ *SISTEMA:*');

    // 2. Não deve ter "Atalhos Rápidos" repetindo em texto o que a enquete oferece
    expect(replyText).not.toContain('⚡ Atalhos Rápidos');
    expect(replyText).not.toContain('Escolha uma opção');

    // 3. A enquete no final deve ser contextual de navegação
    expect(pollSpy).toHaveBeenCalledWith(
      mockSock,
      chatId,
      expect.objectContaining({
        type: 'help',
        title: '✨ Quer acessar alguma área agora?',
        options: expect.arrayContaining([
          expect.objectContaining({ id: 'help_vip' }),
          expect.objectContaining({ id: 'help_pack' }),
        ]),
      })
    );
  });

  it('/pack: mensagem antes da enquete deve ter no máximo 3 linhas e não listar opções de escolha', async () => {
    let replyText = '';
    const pollSpy = vi.spyOn(interactiveMessages, 'sendInteractivePoll').mockResolvedValue({ key: { id: 'poll-pack-1' } } as any);

    const ctx = {
      command: { name: 'pack', args: [], rawText: '/pack', isCommand: true },
      message: { id: 'msg-2', chatId, senderJid: chatId, fromMe: false, timestamp: Date.now() },
      reply: vi.fn().mockImplementation(async (text: string) => {
        replyText = text;
      }),
      senderPhone: '5511999990001',
      isSelfChat: false,
    } as any;

    await handlePack(ctx);

    const lines = replyText.trim().split('\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBeLessThanOrEqual(3);

    // Não deve listar comandos repetindo a enquete em texto
    expect(replyText).not.toContain('• */pack enviar*');
    expect(replyText).not.toContain('• */pack criar*');
    expect(replyText).not.toContain('👇 *Ou escolha diretamente');

    // A enquete deve conter as opções
    expect(pollSpy).toHaveBeenCalledWith(
      mockSock,
      chatId,
      expect.objectContaining({
        type: 'pack',
        title: '📦 O que você quer fazer com seus packs?',
        options: expect.arrayContaining([
          expect.objectContaining({ id: 'send_pack' }),
          expect.objectContaining({ id: 'new_pack' }),
        ]),
      })
    );
  });

  it('/vip planos: mensagem antes da enquete deve ter no máximo 3 linhas e deixar planos na enquete', async () => {
    let replyText = '';
    const pollSpy = vi.spyOn(interactiveMessages, 'sendInteractivePoll').mockResolvedValue({ key: { id: 'poll-vip-1' } } as any);

    const ctx = {
      command: { name: 'vip', args: ['planos'], rawText: '/vip planos', isCommand: true },
      message: { id: 'msg-3', chatId, senderJid: chatId, fromMe: false, timestamp: Date.now() },
      reply: vi.fn().mockImplementation(async (text: string) => {
        replyText = text;
      }),
      senderPhone: '5511999990001',
      isSelfChat: false,
    } as any;

    await handleVip(ctx);

    const lines = replyText.trim().split('\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBeLessThanOrEqual(3);

    // Não deve repetir os preços e opções em texto antes da enquete
    expect(replyText).not.toContain('🌸 VIP Pro (30 dias) — R$ 5,00');
    expect(replyText).not.toContain('👑 VIP Mestre (Permanente) — R$ 10,00');

    // A enquete deve conter as opções de planos
    expect(pollSpy).toHaveBeenCalledWith(
      mockSock,
      chatId,
      expect.objectContaining({
        type: 'vip',
        title: '💎 Escolha o plano desejado:',
        options: expect.arrayContaining([
          expect.objectContaining({ id: 'vip_pro' }),
          expect.objectContaining({ id: 'vip_mestre' }),
        ]),
      })
    );
  });

  it('/modo: mensagem antes da enquete deve ter no máximo 3 linhas sem listar comandos de alternar', async () => {
    let replyText = '';
    const pollSpy = vi.spyOn(interactiveMessages, 'sendInteractivePoll').mockResolvedValue({ key: { id: 'poll-mode-1' } } as any);

    const ctx = {
      command: { name: 'modo', args: [], rawText: '/modo', isCommand: true },
      message: { id: 'msg-4', chatId, senderJid: chatId, fromMe: false, timestamp: Date.now() },
      reply: vi.fn().mockImplementation(async (text: string) => {
        replyText = text;
      }),
      senderPhone: '5511999990001',
      isSelfChat: false,
    } as any;

    await handleMode(ctx);

    const lines = replyText.trim().split('\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBeLessThanOrEqual(3);

    // Não deve ter lista repetida em texto
    expect(replyText).not.toContain('• */modo auto*');
    expect(replyText).not.toContain('• */modo menu*');

    // A enquete deve conter os modos
    expect(pollSpy).toHaveBeenCalledWith(
      mockSock,
      chatId,
      expect.objectContaining({
        type: 'mode',
        title: '⚙️ Escolha o modo desejado:',
        options: expect.arrayContaining([
          expect.objectContaining({ id: 'mode_auto' }),
          expect.objectContaining({ id: 'mode_interactive' }),
        ]),
      })
    );
  });
});
