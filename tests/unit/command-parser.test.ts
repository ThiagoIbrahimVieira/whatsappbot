import { describe, it, expect } from 'vitest';
import { parseCommand } from '../../src/commands/command-parser.js';

describe('Command Parser', () => {
  it('deve parsear /help corretamente', () => {
    const res = parseCommand('/help');
    expect(res.isCommand).toBe(true);
    expect(res.name).toBe('help');
    expect(res.args).toEqual([]);
  });

  it('deve parsear /sticker e alias /s', () => {
    const res1 = parseCommand('/sticker');
    expect(res1.isCommand).toBe(true);
    expect(res1.name).toBe('sticker');

    const res2 = parseCommand('/s');
    expect(res2.isCommand).toBe(true);
    expect(res2.name).toBe('s');
  });

  it('deve parsear /static, /video, /gif, /info, /status e /ping', () => {
    for (const cmd of ['static', 'video', 'gif', 'info', 'status', 'ping']) {
      const res = parseCommand(`/${cmd}`);
      expect(res.isCommand).toBe(true);
      expect(res.name).toBe(cmd);
    }
  });

  it('deve suportar prefixo com exclamação (!ping)', () => {
    const res = parseCommand('!ping');
    expect(res.isCommand).toBe(true);
    expect(res.name).toBe('ping');
  });

  it('deve ignorar espaços extras antes, depois e entre argumentos', () => {
    const res = parseCommand('   /sticker   arg1    arg2   ');
    expect(res.isCommand).toBe(true);
    expect(res.name).toBe('sticker');
    expect(res.args).toEqual(['arg1', 'arg2']);
  });

  it('deve identificar comando desconhecido', () => {
    const res = parseCommand('/desconhecido');
    expect(res.name).toBe('desconhecido');
  });

  it('não deve considerar mensagens comuns como comandos', () => {
    const res1 = parseCommand('olá tudo bem?');
    expect(res1.isCommand).toBe(false);

    const res2 = parseCommand('https://google.com');
    expect(res2.isCommand).toBe(false);

    const res3 = parseCommand('');
    expect(res3.isCommand).toBe(false);

    const res4 = parseCommand(null);
    expect(res4.isCommand).toBe(false);
  });
});
