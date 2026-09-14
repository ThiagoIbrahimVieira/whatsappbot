import { getSharp } from './image-processor.js';

export class EffectsProcessor {
  private async getSharpInstance(): Promise<any> {
    const s = await getSharp();
    if (!s) {
      throw new Error('Sharp não está disponível neste ambiente.');
    }
    return s;
  }

  /**
   * Rotação da imagem em 90, 180 ou 270 graus.
   */
  public async rotate(imageBuffer: Buffer, degrees: number): Promise<Buffer> {
    const sharp = await this.getSharpInstance();
    const validDegrees = [90, 180, 270];
    const targetDeg = validDegrees.includes(degrees) ? degrees : 90;

    return await sharp(imageBuffer)
      .rotate(targetDeg)
      .toBuffer();
  }

  /**
   * Espelhamento vertical (flip).
   */
  public async flip(imageBuffer: Buffer): Promise<Buffer> {
    const sharp = await this.getSharpInstance();
    return await sharp(imageBuffer)
      .flip()
      .toBuffer();
  }

  /**
   * Espelhamento horizontal (mirror / flop).
   */
  public async mirror(imageBuffer: Buffer): Promise<Buffer> {
    const sharp = await this.getSharpInstance();
    return await sharp(imageBuffer)
      .flop()
      .toBuffer();
  }

  /**
   * Corte determinístico de proporção (quadrado, retrato ou auto-crop de bordas vazias).
   */
  public async crop(
    imageBuffer: Buffer,
    mode: 'square' | 'portrait' | 'auto' = 'square'
  ): Promise<Buffer> {
    const sharp = await this.getSharpInstance();
    const meta = await sharp(imageBuffer).metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    if (mode === 'auto') {
      // Auto-crop: apara bordas transparentes ou com cor uniforme usando sharp.trim()
      try {
        return await sharp(imageBuffer)
          .trim({ threshold: 15 })
          .toBuffer();
      } catch {
        return imageBuffer;
      }
    }

    if (mode === 'portrait') {
      // Proporção 3:4 (retrato)
      let targetW = w;
      let targetH = Math.round((w * 4) / 3);
      if (targetH > h) {
        targetH = h;
        targetW = Math.round((h * 3) / 4);
      }
      const left = Math.max(0, Math.floor((w - targetW) / 2));
      const top = Math.max(0, Math.floor((h - targetH) / 2));

      return await sharp(imageBuffer)
        .extract({ left, top, width: targetW, height: targetH })
        .toBuffer();
    }

    // Default: Square central
    const side = Math.min(w, h);
    const left = Math.max(0, Math.floor((w - side) / 2));
    const top = Math.max(0, Math.floor((h - side) / 2));

    return await sharp(imageBuffer)
      .extract({ left, top, width: side, height: side })
      .toBuffer();
  }

  /**
   * Cria contorno (outline) de sticker preservando o canal alpha (transparência).
   * Suporta cores (padrão branca '#FFFFFF' ou '#000000').
   */
  public async applyOutline(
    imageBuffer: Buffer,
    color = '#FFFFFF',
    thickness = 6
  ): Promise<Buffer> {
    const sharp = await this.getSharpInstance();
    const padding = thickness + 4;

    const imgWithPadding = sharp(imageBuffer)
      .ensureAlpha()
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });

    const meta = await imgWithPadding.metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    // Extrai o canal alpha como máscara
    const alphaChannel = await imgWithPadding.clone().extractChannel('alpha').toBuffer();

    // Dilata a máscara desfocando e aplicando threshold alto
    const dilatedMask = await sharp(alphaChannel)
      .blur(thickness)
      .threshold(30)
      .toBuffer();

    // Cria fundo colorido usando a máscara dilatada
    const hexColor = color.startsWith('#') ? color : '#FFFFFF';
    const r = parseInt(hexColor.slice(1, 3), 16) || 255;
    const g = parseInt(hexColor.slice(3, 5), 16) || 255;
    const b = parseInt(hexColor.slice(5, 7), 16) || 255;

    const outlineBackground = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r, g, b, alpha: 1 },
      },
    })
      .joinChannel(dilatedMask)
      .png()
      .toBuffer();

    // Compõe a imagem original em cima do fundo com contorno
    return await sharp(outlineBackground)
      .composite([{ input: await imgWithPadding.png().toBuffer(), top: 0, left: 0 }])
      .toBuffer();
  }

  /**
   * Adiciona sombra projetada (drop shadow) compatível com stickers sem destruir transparência.
   */
  public async applyShadow(
    imageBuffer: Buffer,
    type: 'soft' | 'hard' = 'soft'
  ): Promise<Buffer> {
    const sharp = await this.getSharpInstance();
    const img = sharp(imageBuffer).ensureAlpha();
    const meta = await img.metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    const blurSigma = type === 'soft' ? 7 : 3;
    const offset = type === 'soft' ? 8 : 4;
    const shadowOpacity = type === 'soft' ? 0.45 : 0.7;

    const alphaChannel = await img.clone().extractChannel('alpha').toBuffer();

    // Cria a camada de sombra preta com desfoque
    const blurredAlpha = await sharp(alphaChannel)
      .blur(blurSigma)
      .toBuffer();

    const shadowLayer = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: shadowOpacity },
      },
    })
      .joinChannel(blurredAlpha)
      .png()
      .toBuffer();

    // Cria um canvas transparente maior para conter a sombra com deslocamento
    const canvas = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: shadowLayer, top: offset, left: offset },
        { input: await img.png().toBuffer(), top: 0, left: 0 },
      ])
      .png()
      .toBuffer();

    return canvas;
  }
}

export const effectsProcessor = new EffectsProcessor();
