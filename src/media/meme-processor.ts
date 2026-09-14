import { getSharp } from './image-processor.js';
import { logger } from '../utils/logger.js';

export interface MemeOptions {
  topText?: string;
  bottomText?: string;
  style?: 'modern' | 'classic' | 'top' | 'bottom';
  fontSize?: number;
}

export class MemeProcessor {
  /**
   * Separa o texto em partes superior e inferior.
   * Se houver pipe '|', divide em [top, bottom].
   * Por padrão no estilo moderno (card branco estilo Twitter/Instagram), texto único fica no topo.
   * No estilo clássico, texto único vai para o rodapé em maiúsculas.
   */
  public parseMemeText(
    rawText: string,
    style: 'modern' | 'classic' | 'top' | 'bottom' = 'modern'
  ): { top: string; bottom: string } {
    const trimmed = (rawText || '').trim();
    if (!trimmed) {
      return { top: '', bottom: '' };
    }

    if (trimmed.includes('|')) {
      const [first, ...rest] = trimmed.split('|');
      const top = first.trim();
      const bottom = rest.join('|').trim();
      if (style === 'classic') {
        return { top: top.toUpperCase(), bottom: bottom.toUpperCase() };
      }
      return { top, bottom };
    }

    if (style === 'classic') {
      return { top: '', bottom: trimmed.toUpperCase() };
    }

    if (style === 'bottom') {
      return { top: '', bottom: trimmed };
    }

    // Moderno (padrão): legenda principal no topo
    return { top: trimmed, bottom: '' };
  }

  /**
   * Quebra texto em múltiplas linhas para não vazar da largura do sticker.
   */
  public wrapText(text: string, maxCharsPerLine = 24): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [text];
  }

  /**
   * Escapa caracteres especiais para SVG.
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Gera texto em preto para o card branco de meme moderno (estilo Twitter / legenda).
   */
  public createModernMemeSvg(
    width: number,
    height: number,
    topLines: string[],
    bottomLines: string[],
    topY: number,
    bottomY: number
  ): Buffer {
    const fontSize = 23;
    const lineHeight = 28;

    let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .card-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-weight: 700;
      font-size: ${fontSize}px;
      fill: #111111;
      text-anchor: middle;
    }
  </style>`;

    topLines.forEach((line, index) => {
      const y = topY + index * lineHeight;
      svgContent += `\n  <text x="${width / 2}" y="${y}" class="card-text">${this.escapeXml(line)}</text>`;
    });

    bottomLines.forEach((line, index) => {
      const y = bottomY + index * lineHeight;
      svgContent += `\n  <text x="${width / 2}" y="${y}" class="card-text">${this.escapeXml(line)}</text>`;
    });

    svgContent += '\n</svg>';
    return Buffer.from(svgContent, 'utf-8');
  }

  /**
   * Gera um overlay SVG estilizado com texto branco e contorno preto grosso (estilo clássico).
   */
  public createMemeSvg(width: number, height: number, topText?: string, bottomText?: string): Buffer {
    const fontSize = Math.max(24, Math.round(width * 0.08));
    const strokeWidth = Math.max(3, Math.round(fontSize * 0.15));
    const lineHeight = Math.round(fontSize * 1.15);

    const topLines = topText ? this.wrapText(topText) : [];
    const bottomLines = bottomText ? this.wrapText(bottomText) : [];

    let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .meme-text {
      font-family: 'Impact', 'DejaVu Sans', 'Arial Black', sans-serif;
      font-weight: 900;
      font-size: ${fontSize}px;
      fill: #FFFFFF;
      stroke: #000000;
      stroke-width: ${strokeWidth}px;
      stroke-linejoin: round;
      stroke-linecap: round;
      paint-order: stroke fill;
      text-anchor: middle;
      letter-spacing: 1px;
    }
  </style>`;

    // Renderiza linhas superiores
    if (topLines.length > 0) {
      const startY = Math.round(fontSize * 1.2);
      topLines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        svgContent += `\n  <text x="${width / 2}" y="${y}" class="meme-text">${this.escapeXml(line)}</text>`;
      });
    }

    // Renderiza linhas inferiores
    if (bottomLines.length > 0) {
      const totalBottomHeight = (bottomLines.length - 1) * lineHeight;
      const startY = height - Math.round(fontSize * 0.6) - totalBottomHeight;
      bottomLines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        svgContent += `\n  <text x="${width / 2}" y="${y}" class="meme-text">${this.escapeXml(line)}</text>`;
      });
    }

    svgContent += '\n</svg>';
    return Buffer.from(svgContent, 'utf-8');
  }

  /**
   * Aplica o texto de meme sobre um buffer de imagem.
   */
  public async applyMeme(imageBuffer: Buffer, text: string, options: MemeOptions = {}): Promise<Buffer> {
    const style = options.style || 'modern';
    const { top, bottom } = options.topText || options.bottomText
      ? { top: options.topText || '', bottom: options.bottomText || '' }
      : this.parseMemeText(text, style);

    const sharp = await getSharp();
    if (!sharp) {
      logger.warn('Sharp não disponível no ambiente para overlay de meme. Retornando imagem original.');
      return imageBuffer;
    }

    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width || 512;
    const height = meta.height || 512;

    if (style === 'classic') {
      const svgOverlay = this.createMemeSvg(width, height, top.toUpperCase(), bottom.toUpperCase());
      logger.debug({ width, height, top, bottom }, 'Aplicando overlay clássico de meme na imagem');
      return await sharp(imageBuffer)
        .composite([{ input: svgOverlay, top: 0, left: 0 }])
        .toBuffer();
    }

    // Estilo Moderno: Card Branco com imagem no centro e textos acima/abaixo
    const topLines = top ? this.wrapText(top, 28) : [];
    const bottomLines = bottom ? this.wrapText(bottom, 28) : [];

    const topHeight = topLines.length > 0 ? Math.max(50, topLines.length * 32 + 18) : 16;
    const bottomHeight = bottomLines.length > 0 ? Math.max(46, bottomLines.length * 30 + 16) : 16;

    const availH = Math.max(220, 512 - topHeight - bottomHeight - 16);
    const availW = 480;

    const resizedImage = await sharp(imageBuffer)
      .resize({
        width: availW,
        height: availH,
        fit: 'inside',
      })
      .toBuffer();

    const imgMeta = await sharp(resizedImage).metadata();
    const imgW = imgMeta.width || availW;
    const imgH = imgMeta.height || availH;

    const imgX = Math.round((512 - imgW) / 2);
    const imgY = Math.round(topHeight + (512 - topHeight - bottomHeight - imgH) / 2);

    const topY = Math.max(20, Math.round((topHeight - topLines.length * 28) / 2) + 20);
    const bottomY = 512 - bottomHeight + Math.max(20, Math.round((bottomHeight - bottomLines.length * 26) / 2));

    const cardSvg = this.createModernMemeSvg(512, 512, topLines, bottomLines, topY, bottomY);

    logger.debug({ width: 512, height: 512, top, bottom }, 'Gerando card de meme moderno com fundo branco');

    return await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: resizedImage, left: imgX, top: imgY },
        { input: cardSvg, left: 0, top: 0 },
      ])
      .png()
      .toBuffer();
  }
}

export const memeProcessor = new MemeProcessor();
