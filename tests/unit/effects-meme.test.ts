import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { memeProcessor } from '../../src/media/meme-processor.js';
import { effectsProcessor } from '../../src/media/effects-processor.js';

describe('Meme and Image Effects Processors', () => {
  // Gera uma imagem de teste 400x400 com fundo azul
  async function createTestImage(channels = 4, alpha = 1): Promise<Buffer> {
    return await sharp({
      create: {
        width: 400,
        height: 400,
        channels: channels as any,
        background: { r: 50, g: 100, b: 200, alpha },
      },
    })
      .png()
      .toBuffer();
  }

  it('deve separar corretamente o texto do meme com pipe | (topo e rodapé)', () => {
    const parsed = memeProcessor.parseMemeText('Texto Superior | Texto Inferior', 'classic');
    expect(parsed.top).toBe('TEXTO SUPERIOR');
    expect(parsed.bottom).toBe('TEXTO INFERIOR');
  });

  it('deve colocar texto único no rodapé no estilo clássico e no topo no estilo moderno', () => {
    const classic = memeProcessor.parseMemeText('Apenas uma legenda', 'classic');
    expect(classic.top).toBe('');
    expect(classic.bottom).toBe('APENAS UMA LEGENDA');

    const modern = memeProcessor.parseMemeText('Apenas uma legenda', 'modern');
    expect(modern.top).toBe('Apenas uma legenda');
    expect(modern.bottom).toBe('');
  });

  it('deve gerar SVG de meme com texto branco e contorno preto grosso', () => {
    const svgBuffer = memeProcessor.createMemeSvg(512, 512, 'TOP MEME', 'BOTTOM MEME');
    const svgString = svgBuffer.toString('utf-8');

    expect(svgString).toContain('<svg');
    expect(svgString).toContain('TOP MEME');
    expect(svgString).toContain('BOTTOM MEME');
    expect(svgString).toContain('fill: #FFFFFF');
    expect(svgString).toContain('stroke: #000000');
  });

  it('deve aplicar meme sobre uma imagem com sucesso (moderno e clássico)', async () => {
    const baseImg = await createTestImage();
    const classicImg = await memeProcessor.applyMeme(baseImg, 'QUANDO FUNCIONA | DE PRIMEIRA', { style: 'classic' });
    const metaClassic = await sharp(classicImg).metadata();
    expect(metaClassic.width).toBe(400);
    expect(metaClassic.height).toBe(400);

    const modernCard = await memeProcessor.applyMeme(baseImg, 'QUANDO FUNCIONA | DE PRIMEIRA');
    const metaModern = await sharp(modernCard).metadata();
    expect(metaModern.width).toBe(512);
    expect(metaModern.height).toBe(512);
    expect(modernCard.length).toBeGreaterThan(0);
  });

  it('deve rotacionar imagem em 90 graus', async () => {
    const baseImg = await createTestImage();
    const rotated = await effectsProcessor.rotate(baseImg, 90);

    const meta = await sharp(rotated).metadata();
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(400);
  });

  it('deve espelhar verticalmente (flip) e horizontalmente (mirror)', async () => {
    const baseImg = await createTestImage();
    const flipped = await effectsProcessor.flip(baseImg);
    const mirrored = await effectsProcessor.mirror(baseImg);

    expect(flipped.length).toBeGreaterThan(0);
    expect(mirrored.length).toBeGreaterThan(0);
  });

  it('deve recortar em modo quadrado (square) centralizado', async () => {
    // Imagem retangular 600x300
    const rectImg = await sharp({
      create: {
        width: 600,
        height: 300,
        channels: 4,
        background: { r: 10, g: 20, b: 30, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const cropped = await effectsProcessor.crop(rectImg, 'square');
    const meta = await sharp(cropped).metadata();
    expect(meta.width).toBe(300);
    expect(meta.height).toBe(300);
  });

  it('deve aplicar contorno (outline) e preservar canal alpha', async () => {
    const baseImg = await createTestImage(4, 0.8);
    const outlined = await effectsProcessor.applyOutline(baseImg, '#FFFFFF');

    const meta = await sharp(outlined).metadata();
    expect(meta.hasAlpha).toBe(true);
    expect(outlined.length).toBeGreaterThan(0);
  });

  it('deve aplicar sombra (shadow) sem quebrar transparência', async () => {
    const baseImg = await createTestImage(4, 0.8);
    const shadowed = await effectsProcessor.applyShadow(baseImg, 'soft');

    const meta = await sharp(shadowed).metadata();
    expect(meta.hasAlpha).toBe(true);
    expect(shadowed.length).toBeGreaterThan(0);
  });

  it('deve quebrar linhas de texto longo corretamente no wrapText', () => {
    const lines = memeProcessor.wrapText('ESTE É UM TEXTO MUITO LONGO QUE DEVE SER DIVIDIDO EM LINHAS', 20);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((l) => l.length <= 25)).toBe(true);
  });
});
