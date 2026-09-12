export declare class EffectsProcessor {
    /**
     * Rotação da imagem em 90, 180 ou 270 graus.
     */
    rotate(imageBuffer: Buffer, degrees: number): Promise<Buffer>;
    /**
     * Espelhamento vertical (flip).
     */
    flip(imageBuffer: Buffer): Promise<Buffer>;
    /**
     * Espelhamento horizontal (mirror / flop).
     */
    mirror(imageBuffer: Buffer): Promise<Buffer>;
    /**
     * Corte determinístico de proporção (quadrado, retrato ou auto-crop de bordas vazias).
     */
    crop(imageBuffer: Buffer, mode?: 'square' | 'portrait' | 'auto'): Promise<Buffer>;
    /**
     * Cria contorno (outline) de sticker preservando o canal alpha (transparência).
     * Suporta cores (padrão branca '#FFFFFF' ou '#000000').
     */
    applyOutline(imageBuffer: Buffer, color?: string, thickness?: number): Promise<Buffer>;
    /**
     * Adiciona sombra projetada (drop shadow) compatível com stickers sem destruir transparência.
     */
    applyShadow(imageBuffer: Buffer, type?: 'soft' | 'hard'): Promise<Buffer>;
}
export declare const effectsProcessor: EffectsProcessor;
