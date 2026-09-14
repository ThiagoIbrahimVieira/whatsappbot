import { describe, it, expect, beforeEach } from 'vitest';
import { receiptManager } from '../../src/control/receipt-manager.js';

describe('Receipt Validation & Payment Proof Rules', () => {
  const phone = '5511999990002';

  beforeEach(() => {
    // Registra pagamento pendente para o usuário
    receiptManager.registerPendingPayment(phone, 'pro', 5.0);
  });

  it('NÃO deve aceitar mensagens de TEXTO puro ("paguei", "já fiz o pix") como comprovante', () => {
    const isReceipt = receiptManager.isReceiptMessage({
      captionOrText: 'paguei o pix aqui',
      mediaType: 'TEXT',
      hasPendingPayment: true,
    });

    expect(isReceipt).toBe(false);
  });

  it('deve identificar texto de confirmação quando há pagamento pendente (isPendingReceiptText)', () => {
    const checkText = (text: string, hasPending: boolean) =>
      receiptManager.isPendingReceiptText({
        captionOrText: text,
        mediaType: 'TEXT',
        hasPendingPayment: hasPending,
      });

    expect(checkText('paguei', true)).toBe(true);
    expect(checkText('ja fiz o pix', true)).toBe(true);
    expect(checkText('ta pago amigo', true)).toBe(true);
    expect(checkText('ola tudo bem', true)).toBe(false);

    // Para usuário sem pagamento pendente, deve retornar falso
    expect(checkText('paguei', false)).toBe(false);
  });

  it('NÃO deve aceitar ÁUDIO, FIGURINHA ou VÍDEO como comprovante de pagamento', () => {
    expect(
      receiptManager.isReceiptMessage({
        mediaType: 'AUDIO',
        hasPendingPayment: true,
      })
    ).toBe(false);

    expect(
      receiptManager.isReceiptMessage({
        mediaType: 'STICKER',
        hasPendingPayment: true,
      })
    ).toBe(false);
  });

  it('DEVE aceitar IMAGEM como comprovante válido', () => {
    const isReceipt = receiptManager.isReceiptMessage({
      captionOrText: 'segue o comprovante do pix',
      mediaType: 'IMAGE',
      hasPendingPayment: true,
    });

    expect(isReceipt).toBe(true);
  });

  it('DEVE aceitar DOCUMENTO PDF ou imagem como comprovante válido', () => {
    const isReceipt = receiptManager.isReceiptMessage({
      captionOrText: 'comprovante.pdf',
      mediaType: 'DOCUMENT',
      mimetype: 'application/pdf',
      hasPendingPayment: true,
    });

    expect(isReceipt).toBe(true);
  });

  it('deve garantir idempotência no processamento de comprovantes', () => {
    const receiptKey = 'receipt-msg-12345';
    expect(receiptManager.isAlreadyProcessedReceipt(receiptKey)).toBe(false);

    receiptManager.markReceiptProcessed(receiptKey);
    expect(receiptManager.isAlreadyProcessedReceipt(receiptKey)).toBe(true);
  });
});
