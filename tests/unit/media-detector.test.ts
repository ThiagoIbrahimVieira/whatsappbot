import { describe, it, expect } from 'vitest';
import { detectMedia, unwrapMessage } from '../../src/media/media-detector.js';

describe('Media Detector', () => {
  it('deve detectar IMAGE corretamente', () => {
    const raw = {
      imageMessage: {
        mimetype: 'image/jpeg',
        caption: 'Legenda da foto',
        fileLength: 10240,
      },
    };

    const res = detectMedia(raw);
    expect(res.type).toBe('IMAGE');
    expect(res.mimetype).toBe('image/jpeg');
    expect(res.isGif).toBe(false);
    expect(res.caption).toBe('Legenda da foto');
  });

  it('deve detectar VIDEO comum', () => {
    const raw = {
      videoMessage: {
        mimetype: 'video/mp4',
        gifPlayback: false,
        seconds: 5,
      },
    };

    const res = detectMedia(raw);
    expect(res.type).toBe('VIDEO');
    expect(res.isGif).toBe(false);
    expect(res.seconds).toBe(5);
  });

  it('deve detectar GIF a partir de videoMessage com gifPlayback: true', () => {
    const raw = {
      videoMessage: {
        mimetype: 'video/mp4',
        gifPlayback: true,
        seconds: 3,
      },
    };

    const res = detectMedia(raw);
    expect(res.type).toBe('GIF');
    expect(res.isGif).toBe(true);
  });

  it('deve desempacotar e detectar mídia encapsulada em ViewOnce', () => {
    const raw = {
      viewOnceMessageV2: {
        message: {
          imageMessage: {
            mimetype: 'image/png',
          },
        },
      },
    };

    const res = detectMedia(raw);
    expect(res.type).toBe('IMAGE');
    expect(res.mimetype).toBe('image/png');
  });

  it('deve detectar TEXT, AUDIO, DOCUMENT e STICKER', () => {
    expect(detectMedia({ conversation: 'olá' }).type).toBe('TEXT');
    expect(detectMedia({ audioMessage: { mimetype: 'audio/ogg' } }).type).toBe('AUDIO');
    expect(detectMedia({ documentMessage: { mimetype: 'application/pdf' } }).type).toBe('DOCUMENT');
    expect(detectMedia({ stickerMessage: { mimetype: 'image/webp' } }).type).toBe('STICKER');
  });

  it('deve retornar UNKNOWN para mensagens vazias ou não mapeadas', () => {
    expect(detectMedia({}).type).toBe('UNKNOWN');
    expect(detectMedia(null).type).toBe('UNKNOWN');
  });
});
