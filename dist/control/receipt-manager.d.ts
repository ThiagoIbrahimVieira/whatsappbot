export interface PendingPayment {
    chatId: string;
    planName: string;
    amountText: string;
    createdAt: number;
}
export declare class ReceiptManager {
    private pendingPayments;
    constructor();
    private loadFromDisk;
    private persistToDisk;
    /**
     * Registra que um chat gerou um código Pix e está no aguardo do envio do comprovante.
     */
    registerPendingPayment(chatId: string, info: {
        planName: string;
        amountText: string;
    }): void;
    /**
     * Obtém a pendência de pagamento ativa do chat se ainda dentro do prazo.
     */
    getPendingPayment(chatId: string): PendingPayment | null;
    /**
     * Limpa o estado de pagamento pendente após recebimento do comprovante ou aprovação.
     */
    clearPendingPayment(chatId: string): void;
    private processedReceipts;
    /**
     * Verifica se o comprovante já foi processado anteriormente (idempotência).
     */
    isAlreadyProcessedReceipt(receiptKey: string): boolean;
    /**
     * Marca o comprovante como processado para evitar duplicações.
     */
    markReceiptProcessed(receiptKey: string): void;
    /**
     * Avalia se uma mensagem deve ser tratada como envio real de comprovante.
     * REGRA ABSOLUTA: Aceita APENAS arquivos compatíveis (IMAGE ou DOCUMENT/PDF).
     * Rejeita estritamente TEXT, AUDIO, STICKER, GIF, etc.
     */
    isReceiptMessage(options: {
        captionOrText?: string;
        mediaType: string;
        hasPendingPayment: boolean;
        isRecentPendingPayment?: boolean;
        quotedText?: string;
        mimetype?: string;
    }): boolean;
    /**
     * Verifica se o pagamento pendente foi gerado recentemente (padrão: 15 minutos).
     */
    isPendingPaymentRecent(chatId: string, maxAgeMs?: number): boolean;
    /**
     * Detecta se o usuário em estado de pagamento pendente enviou apenas texto
     * (ex: "paguei", "já transferi", etc.) para que possamos orientar amigavelmente
     * sem marcar o comprovante como recebido.
     */
    isPendingReceiptText(options: {
        captionOrText?: string;
        mediaType: string;
        hasPendingPayment: boolean;
    }): boolean;
}
export declare const receiptManager: ReceiptManager;
