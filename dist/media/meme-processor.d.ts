export interface MemeOptions {
    topText?: string;
    bottomText?: string;
    style?: 'classic' | 'top' | 'bottom';
    fontSize?: number;
}
export declare class MemeProcessor {
    /**
     * Separa o texto em partes superior e inferior.
     * Se houver pipe '|', divide em [top, bottom].
     * Se for uma linha única, coloca embaixo no clássico ou em cima conforme o estilo.
     */
    parseMemeText(rawText: string, style?: 'classic' | 'top' | 'bottom'): {
        top: string;
        bottom: string;
    };
    /**
     * Quebra texto em múltiplas linhas para não vazar da largura do sticker.
     */
    private wrapText;
    /**
     * Escapa caracteres especiais para SVG.
     */
    private escapeXml;
    /**
     * Gera um overlay SVG estilizado com texto branco e contorno preto grosso.
     * Totalmente determinístico, sem depender de fontes proprietárias.
     */
    createMemeSvg(width: number, height: number, topText?: string, bottomText?: string): Buffer;
    /**
     * Aplica o texto de meme sobre um buffer de imagem.
     */
    applyMeme(imageBuffer: Buffer, text: string, options?: MemeOptions): Promise<Buffer>;
}
export declare const memeProcessor: MemeProcessor;
