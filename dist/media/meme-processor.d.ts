export interface MemeOptions {
    topText?: string;
    bottomText?: string;
    style?: 'modern' | 'classic' | 'top' | 'bottom';
    fontSize?: number;
}
export declare class MemeProcessor {
    /**
     * Separa o texto em partes superior e inferior.
     * Se houver pipe '|', divide em [top, bottom].
     * Por padrão no estilo moderno (card branco estilo Twitter/Instagram), texto único fica no topo.
     * No estilo clássico, texto único vai para o rodapé em maiúsculas.
     */
    parseMemeText(rawText: string, style?: 'modern' | 'classic' | 'top' | 'bottom'): {
        top: string;
        bottom: string;
    };
    /**
     * Quebra texto em múltiplas linhas para não vazar da largura do sticker.
     */
    wrapText(text: string, maxCharsPerLine?: number): string[];
    /**
     * Escapa caracteres especiais para SVG.
     */
    private escapeXml;
    /**
     * Gera texto em preto para o card branco de meme moderno (estilo Twitter / legenda).
     */
    createModernMemeSvg(width: number, height: number, topLines: string[], bottomLines: string[], topY: number, bottomY: number): Buffer;
    /**
     * Gera um overlay SVG estilizado com texto branco e contorno preto grosso (estilo clássico).
     */
    createMemeSvg(width: number, height: number, topText?: string, bottomText?: string): Buffer;
    /**
     * Aplica o texto de meme sobre um buffer de imagem.
     */
    applyMeme(imageBuffer: Buffer, text: string, options?: MemeOptions): Promise<Buffer>;
}
export declare const memeProcessor: MemeProcessor;
