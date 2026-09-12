import { describe, it, expect, beforeEach } from 'vitest';
import { accessControl } from '../../src/control/access-control.js';

describe('Access Control Unit Tests', () => {
  beforeEach(() => {
    accessControl.setAccessMode('whitelist');
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

  it('deve permitir contatos adicionados à whitelist e bloquear os não autorizados', () => {
    accessControl.setAccessMode('whitelist');
    accessControl.addContact('Amigo Teste', '5511977776666');

    const allowed = accessControl.isAllowed('5511977776666@s.whatsapp.net', '5511977776666@s.whatsapp.net', false);
    expect(allowed.allowed).toBe(true);

    const stranger = accessControl.isAllowed('5521955554444@s.whatsapp.net', '5521955554444@s.whatsapp.net', false);
    expect(stranger.allowed).toBe(false);
    expect(stranger.reason).toBe('User not on Whitelist');
  });

  it('deve permitir qualquer pessoa quando o modo for "all"', () => {
    accessControl.setAccessMode('all');
    const stranger = accessControl.isAllowed('5521955554444@s.whatsapp.net', '5521955554444@s.whatsapp.net', false);
    expect(stranger.allowed).toBe(true);
  });

  it('deve remover contato da whitelist com sucesso', () => {
    const contact = accessControl.addContact('Temporário', '5511933332222');
    expect(accessControl.getContacts().some((c) => c.id === contact.id)).toBe(true);

    accessControl.removeContact(contact.id);
    expect(accessControl.getContacts().some((c) => c.id === contact.id)).toBe(false);
  });
});
