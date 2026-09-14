import { describe, it, expect } from 'vitest';
import { generatePixPayload, generatePixQrBuffer } from '../../src/utils/pix.js';

describe('Pix Utility Tests', () => {
  it('deve gerar payload BR Code válido para a chave Pix', () => {
    const payload = generatePixPayload({
      key: '41496413-db85-4757-8279-c323c8f575e5',
      name: 'THIAGO IBRAHIM',
      city: 'SAO PAULO',
      amount: 5.0,
      txid: 'VIPPRO',
    });

    expect(payload).toContain('000201'); // Início padrão
    expect(payload).toContain('br.gov.bcb.pix'); // Identificador Bacen
    expect(payload).toContain('41496413-db85-4757-8279-c323c8f575e5'); // Chave
    expect(payload).toContain('54045.00'); // Valor 5.00
    expect(payload).toContain('THIAGO IBRAHIM'); // Nome
    expect(payload).toContain('SAO PAULO'); // Cidade
    expect(payload).toContain('6304'); // Campo CRC16
    expect(payload.length).toBeGreaterThan(80);
  });

  it('deve gerar buffer PNG para o QR Code Pix', async () => {
    const payload = generatePixPayload({
      key: '41496413-db85-4757-8279-c323c8f575e5',
      name: 'THIAGO IBRAHIM',
      city: 'SAO PAULO',
      amount: 15.0,
      txid: 'VIPMESTRE',
    });

    const buffer = await generatePixQrBuffer(payload);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(100);
    // Deve começar com a assinatura padrão de arquivo PNG (89 50 4E 47 0D 0A 1A 0A)
    const pngHeader = buffer.subarray(0, 8).toString('hex');
    expect(pngHeader).toBe('89504e470d0a1a0a');
  });
});
