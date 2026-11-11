export interface PixPayloadOptions {
    key: string;
    name: string;
    city: string;
    amount?: number;
    txid?: string;
    description?: string;
}
/**
 * Gera o payload oficial do Pix (BR Code / Pix Copia e Cola) de acordo com as especificações do Banco Central do Brasil.
 */
export declare function generatePixPayload(options: PixPayloadOptions): string;
/**
 * Renderiza o QR Code do Pix em um Buffer PNG de alta qualidade pronto para envio no WhatsApp.
 * Sempre retorna um Buffer PNG válido (nunca SVG XML), funcionando no Android/Termux e Windows.
 */
export declare function generatePixQrBuffer(pixPayload: string): Promise<Buffer>;
