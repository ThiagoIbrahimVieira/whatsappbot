export interface QrOutputResult {
    pngPath: string;
    htmlPath: string;
}
export declare function getQrSvg(qrString: string): string;
/**
 * Gera um QR Code em imagem PNG de alta resolução e um arquivo HTML limpo
 * para fácil escaneamento no navegador ou visualizador de imagens do Windows.
 */
export declare function generateQrArtifacts(qrString: string): Promise<QrOutputResult>;
