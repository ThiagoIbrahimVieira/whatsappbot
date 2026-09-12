import { describe, it, expect } from 'vitest';
import { envSchema } from '../../src/config/schema.js';

describe('Config Schema Validation (Zod)', () => {
  it('deve usar valores padrão quando nenhuma variável for informada', () => {
    const parsed = envSchema.parse({});

    expect(parsed.AUTO_STICKER).toBe(true);
    expect(parsed.AUTO_IMAGE).toBe(true);
    expect(parsed.AUTO_VIDEO).toBe(true);
    expect(parsed.AUTO_GIF).toBe(true);
    expect(parsed.IGNORE_GROUPS).toBe(true);
    expect(parsed.IGNORE_OWN_MESSAGES).toBe(true);
    expect(parsed.COMMANDS_ENABLED).toBe(true);
    expect(parsed.MAX_IMAGE_SIZE_MB).toBe(10);
    expect(parsed.MAX_VIDEO_SIZE_MB).toBe(20);
    expect(parsed.MAX_GIF_SIZE_MB).toBe(20);
    expect(parsed.MAX_VIDEO_DURATION_SECONDS).toBe(10);
    expect(parsed.MAX_CONCURRENT_JOBS).toBe(2);
    expect(parsed.VIDEO_TRIM_MODE).toBe('first');
    expect(parsed.LOG_LEVEL).toBe('info');
    expect(parsed.FFMPEG_PATH).toBe('');
  });

  it('deve fazer parse correto de strings booleanas ("false" -> false, "true" -> true)', () => {
    const parsed = envSchema.parse({
      AUTO_IMAGE: 'false',
      AUTO_VIDEO: '0',
      AUTO_GIF: 'no',
      AUTO_STICKER: 'true',
    });

    expect(parsed.AUTO_IMAGE).toBe(false);
    expect(parsed.AUTO_VIDEO).toBe(false);
    expect(parsed.AUTO_GIF).toBe(false);
    expect(parsed.AUTO_STICKER).toBe(true);
  });

  it('deve rejeitar IGNORE_GROUPS=false por ser uma regra estrita de negócio', () => {
    expect(() => {
      envSchema.parse({
        IGNORE_GROUPS: 'false',
      });
    }).toThrow(/IGNORE_GROUPS deve ser sempre true/);
  });

  it('deve rejeitar valores booleanos inválidos como "talvez"', () => {
    expect(() => {
      envSchema.parse({
        AUTO_STICKER: 'talvez',
      });
    }).toThrow(/Valor booleano inválido/);
  });

  it('deve validar limites numéricos positivos e coerção correta', () => {
    const parsed = envSchema.parse({
      MAX_IMAGE_SIZE_MB: '15',
      MAX_VIDEO_DURATION_SECONDS: '8',
      MAX_CONCURRENT_JOBS: '3',
    });

    expect(parsed.MAX_IMAGE_SIZE_MB).toBe(15);
    expect(parsed.MAX_VIDEO_DURATION_SECONDS).toBe(8);
    expect(parsed.MAX_CONCURRENT_JOBS).toBe(3);
  });

  it('deve rejeitar números negativos ou zerados para tamanhos máximos', () => {
    expect(() => {
      envSchema.parse({
        MAX_IMAGE_SIZE_MB: '-5',
      });
    }).toThrow();
  });

  it('deve formatar e sanitizar PAIRING_NUMBER removendo caracteres especiais', () => {
    const parsed = envSchema.parse({
      PAIRING_NUMBER: '+55 (11) 98888-7777',
    });
    expect(parsed.PAIRING_NUMBER).toBe('5511988887777');
  });

  it('deve rejeitar PAIRING_NUMBER com dígitos insuficientes', () => {
    expect(() => {
      envSchema.parse({
        PAIRING_NUMBER: '12345',
      });
    }).toThrow(/PAIRING_NUMBER deve ser um número de telefone com DDI e DDD/);
  });
});
