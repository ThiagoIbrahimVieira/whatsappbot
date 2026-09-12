import { describe, it, expect, beforeEach } from 'vitest';
import { botState } from '../../src/control/bot-state.js';

describe('Bot State Manager Unit Tests', () => {
  beforeEach(() => {
    botState.setBotActive(true);
  });

  it('deve alternar o estado do bot entre ativo e pausado', () => {
    expect(botState.isBotActive()).toBe(true);

    botState.setBotActive(false);
    expect(botState.isBotActive()).toBe(false);

    const toggled = botState.toggleBotActive();
    expect(toggled).toBe(true);
    expect(botState.isBotActive()).toBe(true);
  });

  it('deve atualizar e recuperar configurações parciais do bot', () => {
    botState.updateSettings({
      autoVideo: false,
      packName: 'Novo Pacote Teste',
    });

    const settings = botState.getSettings();
    expect(settings.autoVideo).toBe(false);
    expect(settings.packName).toBe('Novo Pacote Teste');

    // Restaura
    botState.updateSettings({
      autoVideo: true,
    });
  });
});
