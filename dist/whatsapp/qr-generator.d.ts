export interface QrOutputResult {
    pngPath: string;
    htmlPath: string;
}
/**
 * Converte a matriz de módulos do QR Code em um Buffer PNG 100% nativo e válido.
 * Não requer dependências nativas (nem sharp, nem canvas) - funciona perfeitamente no Termux / Android.
 */
export declare function matrixToPngBuffer(matrix: boolean[][], margin?: number, scale?: number): Buffer;
/**
 * Gera um Buffer PNG de alta qualidade de qualquer string (ex: Pix BR Code).
 */
export declare function generateQrPngBuffer(qrString: string, scale?: number, margin?: number): Buffer;
export declare function getQrSvg(qrString: string): string;
/**
 * Gera um QR Code em imagem PNG de alta resolução e um arquivo HTML limpo
 * para fácil escaneamento no navegador ou visualizador de imagens do Windows.
 */
export declare function generateQrArtifacts(qrString: string): Promise<QrOutputResult>;
