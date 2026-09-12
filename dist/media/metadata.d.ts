/**
 * Cria o chunk EXIF para figurinhas do WhatsApp contendo o nome do pacote e autor.
 */
export declare function createStickerExif(packName?: string, author?: string): Buffer;
/**
 * Injeta o chunk EXIF em um buffer de imagem WebP de forma compatível com a especificação
 * oficial de contêiner RIFF/WebP (garante VP8X com flag EXIF 0x08 e posicionamento correto).
 * Compatível com WebP estático e WebP animado.
 */
export declare function addExifToWebp(webpBuffer: Buffer, packName?: string, author?: string): Promise<Buffer>;
