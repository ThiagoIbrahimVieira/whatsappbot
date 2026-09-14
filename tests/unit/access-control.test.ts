import { describe, it, expect, beforeEach } from 'vitest';
import { accessControl } from '../../src/control/access-control.js';
import { botState } from '../../src/control/bot-state.js';
import { dailyLimitStore } from '../../src/control/daily-limit-store.js';

describe('Access Control Unit Tests', () => {
  beforeEach(() => {
    accessControl.setAccessMode('whitelist');
    botState.updateSettings({ freemiumEnabled: false, dailyFreeLimit: 5 });
    dailyLimitStore.clear();
  });

  it('deve sempre permitir mensagens no próprio chat (self-chat)', () => {
    const result = accessControl.isAllowed('5511999999999@s.whatsapp.net', '5511999999999@s.whatsapp.net', true);
    expect(result.allowed).toBe(true);
  });

  it('deve bloquear contatos quando o modo for "self" exceto self-chat', () => {
    accessControl.setAccessMode('self');
    const allowedSelf = accessControl.isAllowed('5511911111111@s.whatsapp.net', '5511911111111@s.whatsapp.net', true);
    expect(allowedSelf.allowed).toBe(true);

    const blockedOther = accessControl.isAllowed('5511988887777@s.whatsapp.net', '5511988887777@s.whatsapp.net', false);
    expect(blockedOther.allowed).toBe(false);
    expect(blockedOther.reason).toBe('Access set to Only Me');
  });

  it('deve permitir contatos adicionados à whitelist e bloquear os não autorizados quando Freemium desligado', () => {
    accessControl.setAccessMode('whitelist');
    botState.updateSettings({ freemiumEnabled: false });
    accessControl.addContact('Amigo Teste', '5511977776666');

    const allowed = accessControl.isAllowed('5511977776666@s.whatsapp.net', '5511977776666@s.whatsapp.net', false);
    expect(allowed.allowed).toBe(true);

    const stranger = accessControl.isAllowed('5521955554444@s.whatsapp.net', '5521955554444@s.whatsapp.net', false);
    expect(stranger.allowed).toBe(false);
    expect(stranger.reason).toBe('User not on Whitelist');
  });

  it('deve permitir contatos não cadastrados na whitelist quando Freemium estiver ativo', () => {
    accessControl.setAccessMode('whitelist');
    botState.updateSettings({ freemiumEnabled: true });

    const stranger = accessControl.isAllowed('5521955554444@s.whatsapp.net', '5521955554444@s.whatsapp.net', false);
    expect(stranger.allowed).toBe(true);
  });

  it('deve permitir qualquer pessoa quando o modo for "all"', () => {
    accessControl.setAccessMode('all');
    const stranger = accessControl.isAllowed('5521955554444@s.whatsapp.net', '5521955554444@s.whatsapp.net', false);
    expect(stranger.allowed).toBe(true);
  });

  it('deve identificar corretamente contatos VIP (self-chat e Whitelist)', () => {
    accessControl.addContact('VIP Amigo', '5511944443333');

    // Self-chat é VIP
    expect(accessControl.isVip('5511999999999@s.whatsapp.net', '5511999999999@s.whatsapp.net', true)).toBe(true);

    // Contato na whitelist é VIP
    expect(accessControl.isVip('5511944443333@s.whatsapp.net', '5511944443333@s.whatsapp.net', false)).toBe(true);

    // Desconhecido NÃO é VIP
    expect(accessControl.isVip('5511911112222@s.whatsapp.net', '5511911112222@s.whatsapp.net', false)).toBe(false);
  });

  it('deve remover contato da whitelist com sucesso', () => {
    const contact = accessControl.addContact('Temporário', '5511933332222');
    expect(accessControl.getContacts().some((c) => c.id === contact.id)).toBe(true);

    accessControl.removeContact(contact.id);
    expect(accessControl.getContacts().some((c) => c.id === contact.id)).toBe(false);
  });
});

describe('Daily Limit Store Unit Tests', () => {
  beforeEach(() => {
    dailyLimitStore.clear();
  });

  it('deve contabilizar o uso diário e limitar a 5 figurinhas', () => {
    const phone = '5511999887766';
    const limit = 5;

    expect(dailyLimitStore.canGenerate(phone, limit)).toBe(true);
    expect(dailyLimitStore.getDailyCount(phone)).toBe(0);
    expect(dailyLimitStore.getRemaining(phone, limit)).toBe(5);

    // Gera 4 figurinhas
    for (let i = 1; i <= 4; i++) {
      dailyLimitStore.increment(phone);
      expect(dailyLimitStore.getDailyCount(phone)).toBe(i);
      expect(dailyLimitStore.getRemaining(phone, limit)).toBe(limit - i);
      expect(dailyLimitStore.canGenerate(phone, limit)).toBe(true);
    }

    // 5ª figurinha (última grátis)
    dailyLimitStore.increment(phone);
    expect(dailyLimitStore.getDailyCount(phone)).toBe(5);
    expect(dailyLimitStore.getRemaining(phone, limit)).toBe(0);

    // 6ª figurinha deve ser bloqueada
    expect(dailyLimitStore.canGenerate(phone, limit)).toBe(false);
  });
});
