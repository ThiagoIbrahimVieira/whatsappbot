export interface InteractiveButton {
    name: 'quick_reply' | 'cta_copy' | 'cta_url';
    displayText: string;
    id?: string;
    copyCode?: string;
    url?: string;
}
export interface InteractiveMessageOptions {
    title?: string;
    text: string;
    footer?: string;
    buttons: InteractiveButton[];
    fallbackText?: string;
}
export interface SemanticPollOption {
    id: string;
    title: string;
}
export interface ActivePollRecord {
    id?: string;
    chatId: string;
    type: 'vip' | 'media' | 'pack' | 'help' | 'mode' | 'general';
    title: string;
    values: string[];
    options?: SemanticPollOption[];
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    createdAt: number;
    expiresAt: number;
    metadata?: any;
    pollEncKeyBase64?: string;
}
export interface PendingStickerData {
    buffer: Buffer;
    metadata: {
        mediaType: any;
        isAnimated: boolean;
        originUser: string;
        operation?: string;
    };
    createdAt: number;
}
export declare const pendingStickersStore: Map<string, PendingStickerData>;
export declare const activePolls: Map<string, ActivePollRecord>;
export declare function persistActivePolls(map?: Map<string, ActivePollRecord>): void;
/**
 * Resolve o optionId semântico a partir do texto selecionado na enquete.
 */
export declare function resolveSemanticPollOption(pollRecord: ActivePollRecord, selectedText: string): {
    id: string;
    title: string;
};
/**
 * Envia uma enquete nativa interativa do WhatsApp.
 * Suporta tanto options semânticas ({ id, title }) quanto values simples para retrocompatibilidade.
 */
export declare function sendInteractivePoll(sock: any, chatId: string, params: {
    type: 'vip' | 'media' | 'pack' | 'help' | 'mode' | 'general';
    title: string;
    values?: string[];
    options?: SemanticPollOption[];
    metadata?: any;
    expiresInMs?: number;
}): Promise<any>;
/**
 * Envia uma mensagem com botões interativos ou texto estruturado formatado.
 */
export declare function sendInteractiveMessage(sock: any, chatId: string, options: InteractiveMessageOptions): Promise<any>;
/**
 * Envia o fluxo completo de pagamento Pix:
 * 1. Imagem PNG do QR Code com legenda explicativa (registrada no cache para evitar auto-resposta).
 * 2. Mensagem com código Pix Copia e Cola e a chave aleatória com bloco de cópia rápida.
 */
export declare function sendPixPaymentMessages(sock: any, chatId: string, options: {
    planName: string;
    amountText: string;
    qrBuffer: Buffer;
    pixPayload: string;
    pixKey: string;
}): Promise<void>;
