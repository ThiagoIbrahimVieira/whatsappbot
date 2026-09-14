import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { safeReadJsonSync, atomicWriteFileSync } from '../../src/utils/atomic-write.js';
import { libraryManager, maskPhoneNumber } from '../../src/storage/library-manager.js';
import { packManager } from '../../src/storage/pack-manager.js';
import { historyStore } from '../../src/storage/history-store.js';
import { statisticsManager, formatHandle, computeUserLevel } from '../../src/control/statistics-manager.js';

describe('Storage, Library, Packs & Statistics', () => {
  const testTmpFile = path.resolve(process.cwd(), 'tmp', 'test-atomic.json');

  beforeEach(() => {
    try {
      if (fs.existsSync(testTmpFile)) fs.unlinkSync(testTmpFile);
    } catch {}
  });

  it('deve mascarar número de telefone protegendo privacidade do usuário', () => {
    const masked1 = maskPhoneNumber('5511988887777');
    expect(masked1).toBe('+55 11 9****-7777');

    const masked2 = maskPhoneNumber('+55 (21) 97777-6666');
    expect(masked2).toBe('+55 21 9****-6666');
  });

  it('deve gravar e ler JSON de forma atômica e lidar com JSON corrompido sem crashar', () => {
    atomicWriteFileSync(testTmpFile, JSON.stringify({ ok: true, version: 2 }));
    const read = safeReadJsonSync(testTmpFile, { fallback: true });
    expect(read).toEqual({ ok: true, version: 2 });

    // Corrompe o arquivo propositalmente
    fs.writeFileSync(testTmpFile, '{ JSON_INVALIDO!!!');
    const fallback = safeReadJsonSync(testTmpFile, { fallback: 'safe' });
    expect(fallback).toEqual({ fallback: 'safe' });
  });

  it('deve salvar figurinha na biblioteca com deduplicação por hash SHA256', async () => {
    const fakeWebp = Buffer.from('FAKE_WEBP_CONTENT_TEST_HASH');

    const item1 = await libraryManager.saveSticker(fakeWebp, {
      mediaType: 'IMAGE',
      isAnimated: false,
      originUser: '5511999990000',
      operation: 'sticker',
    });

    const item2 = await libraryManager.saveSticker(fakeWebp, {
      mediaType: 'IMAGE',
      isAnimated: false,
      originUser: '5511999990000',
      operation: 'sticker',
    });

    // Mesma hash SHA256 -> mesmo ID, sem duplicar
    expect(item1.id).toBe(item2.id);
  });

  it('deve alternar favorito (toggleFavorite) na biblioteca', async () => {
    const fakeWebp = Buffer.from('FAVORITE_TEST_BUFFER_' + Date.now());
    const item = await libraryManager.saveSticker(fakeWebp, {
      mediaType: 'IMAGE',
      isAnimated: false,
      originUser: '5511988881234',
    });

    const isFavNow = libraryManager.toggleFavorite(item.id);
    expect(isFavNow).toBe(true);

    const isFavAgain = libraryManager.toggleFavorite(item.id);
    expect(isFavAgain).toBe(false);
  });

  it('deve criar pacotes e adicionar figurinhas ao pacote', () => {
    const pack = packManager.createPack('Memes Engraçados', 'Coleção de memes');
    expect(pack.id).toBeDefined();
    expect(pack.name).toBe('Memes Engraçados');

    packManager.addStickerToPack(pack.id, 'sticker_id_abc');
    const updated = packManager.getPack(pack.id);
    expect(updated?.stickerIds).toContain('sticker_id_abc');
  });

  it('deve registrar histórico metadata-only sem salvar buffers nem mensagens', () => {
    const entry = historyStore.record({
      user: '5511999998888',
      mediaType: 'IMAGE',
      operation: 'meme',
      result: 'success',
      processingTimeMs: 120,
      sizeBytes: 40960,
    });

    expect(entry.id).toBeDefined();
    expect(entry.user).toContain('****');
    expect(entry.result).toBe('success');

    const history = historyStore.getHistory(5);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].id).toBe(entry.id);
  });

  it('deve registrar sucesso e agregar ranking e estatísticas por período', () => {
    statisticsManager.clear();
    statisticsManager.recordSuccess('5511987654321', 'Lucas Dev', 'IMAGE', 50);
    statisticsManager.recordSuccess('5511987654321', 'Lucas Dev', 'IMAGE', 60);
    statisticsManager.recordSuccess('5511911112222', 'Pedro', 'VIDEO', 120);

    const ranking = statisticsManager.getRanking('allTime', 5);
    expect(ranking.length).toBeGreaterThanOrEqual(2);
    const lucas = ranking.find((r) => r.phone === '5511987654321');
    expect(lucas).toBeDefined();
    expect(lucas!.name).toBe('Lucas Dev');
    expect(lucas!.count).toBe(2);
    expect(lucas!.maskedPhone).toContain('****');

    const analytics = statisticsManager.getAnalytics('allTime');
    expect(analytics.total).toBeGreaterThanOrEqual(3);
    expect(analytics.images).toBeGreaterThanOrEqual(2);
    expect(analytics.videos).toBeGreaterThanOrEqual(1);
    expect(analytics.avgProcessingTimeMs).toBeGreaterThan(0);
  });

  it('deve formatar handles corretamente e calcular patentes de gamificação', () => {
    expect(formatHandle('Thiago Ibrahim')).toBe('@thiago_ibrahim');
    expect(formatHandle('Lucas Dev!')).toBe('@lucas_dev');
    expect(formatHandle('Amigo')).toBe('@amigo');
    expect(formatHandle('Desconhecido')).toBe('@amigo');

    // Tiers
    expect(computeUserLevel(5).levelTitle).toBe('Iniciante');
    expect(computeUserLevel(5).levelBadge).toBe('🌱');

    expect(computeUserLevel(25).levelTitle).toBe('Colecionador');
    expect(computeUserLevel(25).levelBadge).toBe('📦');

    expect(computeUserLevel(75).levelTitle).toBe('Viciado em Sticker');
    expect(computeUserLevel(75).levelBadge).toBe('🎨');

    expect(computeUserLevel(150).levelTitle).toBe('Fábrica de Memes');
    expect(computeUserLevel(150).levelBadge).toBe('🏭');

    expect(computeUserLevel(300).levelTitle).toBe('Mestre dos Stickers');
    expect(computeUserLevel(300).levelBadge).toBe('⚡');

    expect(computeUserLevel(600).levelTitle).toBe('Lenda do WhatsApp');
    expect(computeUserLevel(600).levelBadge).toBe('👑');
  });

  it('deve retornar perfil completo do usuário com getUserStats', () => {
    statisticsManager.clear();
    for (let i = 0; i < 20; i++) {
      statisticsManager.recordSuccess('5511999991111', 'Lucas Gamer', 'IMAGE', 40);
    }
    const profile = statisticsManager.getUserStats('5511999991111');
    expect(profile.handle).toBe('@lucas_gamer');
    expect(profile.totalStickers).toBe(20);
    expect(profile.levelTitle).toBe('Colecionador');
    expect(profile.rank).toBe(1);
    expect(profile.nextLevelStickers).toBe(51);
  });
});
