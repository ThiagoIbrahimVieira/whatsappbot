import sharp from 'sharp';
import { logger } from '../utils/logger.js';

export interface MemeOptions {
  topText?: string;
  bottomText?: string;
  style?: 'classic' | 'top' | 'bottom';
  fontSize?: number;
}

export class MemeProcessor {
  /**
   * Separa o texto em partes superior e inferior.
   * Se houver pipe '|', divide em [top, bottom].
   * Se for uma linha única, coloca embaixo no clássico ou em cima conforme o estilo.
   */
  public parseMemeText(rawText: string, style: 'classic' | 'top' | 'bottom' = 'classic'): { top: string; bottom: string } {
    const trimmed = (rawText || '').trim();
    if (!trimmed) {
      return { top: '', bottom: '' };
    }

    if (trimmed.includes('|')) {
      const [first, ...rest] = trimmed.split('|');
      return {
        top: first.trim().toUpperCase(),
        bottom: rest.join('|').trim().toUpperCase(),
      };
    }

    if (style === 'top') {
      return { top: trimmed.toUpperCase(), bottom: '' };
    }

    // Estilo clássico com texto único geralmente fica na parte inferior
    return { top: '', bottom: trimmed.toUpperCase() };
  }

  /**
   * Quebra texto em múltiplas linhas para não vazar da largura do sticker.
   */
  private wrapText(text: string, maxCharsPerLine = 22): string[] {
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
   * Gera um overlay SVG estilizado com texto branco e contorno preto grosso.
   * Totalmente determinístico, sem depender de fontes proprietárias.
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
    const { top, bottom } = options.topText || options.bottomText
      ? { top: (options.topText || '').toUpperCase(), bottom: (options.bottomText || '').toUpperCase() }
      : this.parseMemeText(text, options.style || 'classic');

    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width || 512;
    const height = meta.height || 512;

    const svgOverlay = this.createMemeSvg(width, height, top, bottom);

    logger.debug({ width, height, top, bottom }, 'Aplicando overlay de meme na imagem');

    return await sharp(imageBuffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .toBuffer();
  }
}

export const memeProcessor = new MemeProcessor();
