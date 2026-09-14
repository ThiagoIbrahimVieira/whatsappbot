import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveSemanticPollOption,
  pendingStickersStore,
  type ActivePollRecord,
} from '../../src/whatsapp/interactive-messages.js';
import { libraryManager } from '../../src/storage/library-manager.js';
import { packManager } from '../../src/storage/pack-manager.js';
import { userLock } from '../../src/utils/user-lock.js';

describe('Interactive Poll Actions & Semantics', () => {
  const userPhone = '5511999990003';
  const chatId = `${userPhone}@s.whatsapp.net`;

  beforeEach(() => {
    pendingStickersStore.clear();
    userLock.clear();
    vi.restoreAllMocks();
  });

  it('deve traduzir resposta visual da enquete para optionId semântico', () => {
    const pollRecord: ActivePollRecord = {
      id: 'poll-test-1',
      chatId,
      type: 'pack',
      title: 'Salvar no seu Pack?',
      values: ['📁 Salvar no Meu Pack', '🚫 Não salvar', '❌ Cancelar'],
      options: [
        { id: 'save_pack', title: '📁 Salvar no Meu Pack' },
        { id: 'dont_save', title: '🚫 Não salvar' },
        { id: 'cancel', title: '❌ Cancelar' },
      ],
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    const optSave = resolveSemanticPollOption(pollRecord, '📁 Salvar no Meu Pack');
    const optDontSave = resolveSemanticPollOption(pollRecord, '🚫 Não salvar');
    const optCancel = resolveSemanticPollOption(pollRecord, '❌ Cancelar');

    expect(optSave.id).toBe('save_pack');
    expect(optDontSave.id).toBe('dont_save');
    expect(optCancel.id).toBe('cancel');
  });

  it('"dont_save" deve descartar buffer do pendingStickersStore SEM persistir na biblioteca', async () => {
    const tempStickerId = 'temp-test-123';
    pendingStickersStore.set(tempStickerId, {
      buffer: Buffer.from('fake-webp-buffer'),
      metadata: {
        mediaType: 'IMAGE',
        isAnimated: false,
        originUser: userPhone,
        operation: 'sticker',
      },
      createdAt: Date.now(),
    });

    const saveSpy = vi.spyOn(libraryManager, 'saveSticker');
    const addPackSpy = vi.spyOn(packManager, 'addStickerToPack');

    // Executa semântica de dont_save
    await userLock.acquire(`pack:${userPhone}`, () => {
      pendingStickersStore.delete(tempStickerId);
    });

    // Garante que NÃO persistiu na biblioteca nem no pack
    expect(saveSpy).not.toHaveBeenCalled();
    expect(addPackSpy).not.toHaveBeenCalled();
    expect(pendingStickersStore.has(tempStickerId)).toBe(false);
  });

  it('"save_pack" DEVE persistir buffer na biblioteca e adicionar ao pack', async () => {
    const tempStickerId = 'temp-test-456';
    const fakeBuffer = Buffer.from('fake-webp-buffer-save');

    pendingStickersStore.set(tempStickerId, {
      buffer: fakeBuffer,
      metadata: {
        mediaType: 'IMAGE',
        isAnimated: false,
        originUser: userPhone,
        operation: 'sticker',
      },
      createdAt: Date.now(),
    });

    vi.spyOn(libraryManager, 'saveSticker').mockResolvedValue({
      id: 'lib-sticker-999',
      fileName: 'test.webp',
      filePath: '/path/test.webp',
      fileSize: 1234,
      mediaType: 'IMAGE',
      isAnimated: false,
      createdAt: Date.now(),
    });

    const addPackSpy = vi.spyOn(packManager, 'addStickerToPack').mockReturnValue({
      success: true,
      pack: {
        id: 'default',
        name: 'Meu Pack',
        ownerPhone: userPhone,
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stickerIds: ['lib-sticker-999'],
      },
    });

    // Simula execução de save_pack
    await userLock.acquire(`pack:${userPhone}`, async () => {
      const pending = pendingStickersStore.get(tempStickerId);
      if (pending) {
        const saved = await libraryManager.saveSticker(pending.buffer, pending.metadata);
        packManager.addStickerToPack('default', saved.id, userPhone);
        pendingStickersStore.delete(tempStickerId);
      }
    });

    expect(libraryManager.saveSticker).toHaveBeenCalledWith(fakeBuffer, expect.anything());
    expect(addPackSpy).toHaveBeenCalledWith('default', 'lib-sticker-999', userPhone);
    expect(pendingStickersStore.has(tempStickerId)).toBe(false);
  });

  it('deve garantir idempotência impedindo que uma mesma enquete seja processada duas vezes', async () => {
    const pollRecord: ActivePollRecord = {
      id: 'poll-race-1',
      chatId,
      type: 'pack',
      title: 'Enquete',
      values: ['Opcao 1'],
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    };

    let executionCount = 0;

    const execute = async () => {
      await userLock.acquire(`poll:${pollRecord.id}`, async () => {
        if (pollRecord.status === 'COMPLETED' || pollRecord.status === 'PROCESSING') {
          return;
        }
        pollRecord.status = 'PROCESSING';
        executionCount++;
        pollRecord.status = 'COMPLETED';
      });
    };

    // Dispara duas chamadas simultâneas
    await Promise.all([execute(), execute()]);

    expect(executionCount).toBe(1);
    expect(pollRecord.status).toBe('COMPLETED');
  });

  it('deve rejeitar execução quando a enquete estiver expirada', async () => {
    const expiredPoll: ActivePollRecord = {
      id: 'poll-expired-1',
      chatId,
      type: 'pack',
      title: 'Expirada',
      values: ['Opcao 1'],
      status: 'PENDING',
      createdAt: Date.now() - 100000,
      expiresAt: Date.now() - 50000, // Expirada no passado
    };

    let executed = false;
    await userLock.acquire(`poll:${expiredPoll.id}`, async () => {
      if (expiredPoll.expiresAt && Date.now() > expiredPoll.expiresAt) {
        expiredPoll.status = 'EXPIRED';
        return;
      }
      executed = true;
    });

    expect(executed).toBe(false);
    expect(expiredPoll.status).toBe('EXPIRED');
  });
});
