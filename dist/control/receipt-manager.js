import path from 'node:path';
import { safeReadJsonSync, atomicWriteFileSync } from '../utils/atomic-write.js';
import { logger } from '../utils/logger.js';
const PENDING_PAYMENTS_FILE = path.join(process.cwd(), 'data', 'pending-payments.json');
const PAYMENT_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas para enviar o comprovante após gerar o Pix
export class ReceiptManager {
    pendingPayments = new Map();
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        const list = safeReadJsonSync(PENDING_PAYMENTS_FILE, []);
        const now = Date.now();
        for (const item of list) {
            if (item?.chatId && now - item.createdAt < PAYMENT_TTL_MS) {
                this.pendingPayments.set(item.chatId, item);
            }
        }
    }
    persistToDisk() {
        try {
            const list = Array.from(this.pendingPayments.values());
            atomicWriteFileSync(PENDING_PAYMENTS_FILE, JSON.stringify(list, null, 2));
        }
        catch (err) {
            logger.warn({ err: err?.message }, 'Erro ao salvar pending-payments.json');
        }
    }
    /**
     * Registra que um chat gerou um código Pix e está no aguardo do envio do comprovante.
     */
    registerPendingPayment(chatId, info) {
        this.pendingPayments.set(chatId, {
            chatId,
            planName: info.planName,
            amountText: info.amountText,
            createdAt: Date.now(),
        });
        this.persistToDisk();
    }
    /**
     * Obtém a pendência de pagamento ativa do chat se ainda dentro do prazo.
     */
    getPendingPayment(chatId) {
        const payment = this.pendingPayments.get(chatId);
        if (!payment)
            return null;
        if (Date.now() - payment.createdAt > PAYMENT_TTL_MS) {
            this.pendingPayments.delete(chatId);
            this.persistToDisk();
            return null;
        }
        return payment;
    }
    /**
     * Limpa o estado de pagamento pendente após recebimento do comprovante ou aprovação.
     */
    clearPendingPayment(chatId) {
        if (this.pendingPayments.delete(chatId)) {
            this.persistToDisk();
        }
    }
    processedReceipts = new Set();
    /**
     * Verifica se o comprovante já foi processado anteriormente (idempotência).
     */
    isAlreadyProcessedReceipt(receiptKey) {
        if (!receiptKey)
            return false;
        return this.processedReceipts.has(receiptKey);
    }
    /**
     * Marca o comprovante como processado para evitar duplicações.
     */
    markReceiptProcessed(receiptKey) {
        if (!receiptKey)
            return;
        this.processedReceipts.add(receiptKey);
        if (this.processedReceipts.size > 1000) {
            const first = this.processedReceipts.values().next().value;
            if (first)
                this.processedReceipts.delete(first);
        }
    }
    /**
     * Avalia se uma mensagem deve ser tratada como envio real de comprovante.
     * REGRA ABSOLUTA: Aceita APENAS arquivos compatíveis (IMAGE ou DOCUMENT/PDF).
     * Rejeita estritamente TEXT, AUDIO, STICKER, GIF, etc.
     */
    isReceiptMessage(options) {
        const isCompatibleFile = options.mediaType === 'IMAGE' ||
            (options.mediaType === 'DOCUMENT' &&
                (!options.mimetype ||
                    options.mimetype.includes('pdf') ||
                    options.mimetype.includes('image')));
        // REGRA DE OURO: Sem arquivo compatível, NUNCA é comprovante
        if (!isCompatibleFile) {
            return false;
        }
        const text = (options.captionOrText || '').toLowerCase().trim();
        // Se o usuário digitou explicitamente um comando de figurinha (/s, /sticker), prioriza o comando
        if (text.startsWith('/s') || text.startsWith('/sticker') || text.startsWith('/meme')) {
            return false;
        }
        // 1. Palavras-chave fortes de comprovante na legenda da foto/PDF
        const receiptKeywords = [
            'comprovante',
            'comp',
            'recibo',
            'pagamento',
            'paguei',
            'pago',
            'tá pago',
            'ta pago',
            'transferencia',
            'transferência',
            'pix feito',
            'pix enviado',
            'mandei o pix',
            'mandei o valor',
            'enviei o pix',
            'mandei o comprovante',
            'segue o comprovante',
            'segue comprovante',
            'foto do pix',
        ];
        const hasKeyword = receiptKeywords.some((kw) => text.includes(kw));
        if (hasKeyword) {
            return true;
        }
        // 2. Se está citando a mensagem de Pix enviada pelo bot com anexo compatível
        const quoted = (options.quotedText || '').toLowerCase();
        if (quoted.includes('pix') ||
            quoted.includes('qr code') ||
            quoted.includes('chave pix') ||
            quoted.includes('plano:')) {
            return true;
        }
        // 3. Documento (PDF) enviado durante cobrança pendente é tratado como comprovante
        if (options.hasPendingPayment && options.mediaType === 'DOCUMENT') {
            return true;
        }
        // 4. Se o usuário enviou uma legenda de texto comum que NÃO é palavra-chave de pagamento,
        // trata como mídia normal (ex: foto com meme ou conversa) e NÃO sequestra como comprovante
        if (text.length > 0) {
            return false;
        }
        // 5. Foto sem legenda enviada durante a janela recente de pagamento pendente
        if (options.hasPendingPayment && options.mediaType === 'IMAGE') {
            if (options.isRecentPendingPayment !== undefined) {
                return options.isRecentPendingPayment;
            }
            return true;
        }
        return false;
    }
    /**
     * Verifica se o pagamento pendente foi gerado recentemente (padrão: 15 minutos).
     */
    isPendingPaymentRecent(chatId, maxAgeMs = 15 * 60 * 1000) {
        const payment = this.getPendingPayment(chatId);
        if (!payment)
            return false;
        return Date.now() - payment.createdAt <= maxAgeMs;
    }
    /**
     * Detecta se o usuário em estado de pagamento pendente enviou apenas texto
     * (ex: "paguei", "já transferi", etc.) para que possamos orientar amigavelmente
     * sem marcar o comprovante como recebido.
     */
    isPendingReceiptText(options) {
        if (!options.hasPendingPayment)
            return false;
        // Se não for texto, não se aplica
        if (options.mediaType !== 'TEXT' && options.mediaType !== 'UNKNOWN') {
            return false;
        }
        const text = (options.captionOrText || '').toLowerCase().trim();
        if (!text || text.startsWith('/')) {
            return false;
        }
        const textTriggers = [
            'paguei',
            'pago',
            'tá pago',
            'ta pago',
            'ja paguei',
            'já paguei',
            'fiz o pix',
            'mandei o pix',
            'mandei o dinheiro',
            'mandei o valor',
            'enviei o pix',
            'comprovante',
            'recibo',
            'transferi',
            'pronto',
            'ja fiz',
            'já fiz',
            'pix feito',
            'pix enviado',
            'concluido',
            'concluído',
        ];
        return textTriggers.some((kw) => text.includes(kw));
    }
}
export const receiptManager = new ReceiptManager();
//# sourceMappingURL=receipt-manager.js.map