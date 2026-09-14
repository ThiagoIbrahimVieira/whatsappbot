import { describe, it, expect, beforeEach } from 'vitest';
import { dailyLimitStore } from '../../src/control/daily-limit-store.js';
import { userLock } from '../../src/utils/user-lock.js';

describe('Daily Limit & Quota Lifecycle (RESERVE -> COMMIT / RELEASE)', () => {
  const phone = '5511999990001';

  beforeEach(() => {
    dailyLimitStore.clear();
    userLock.clear();
  });

  it('deve reservar cota com sucesso dentro do limite diário', () => {
    const limit = 3;
    const reserved1 = dailyLimitStore.reserveSlot(phone, limit);
    const reserved2 = dailyLimitStore.reserveSlot(phone, limit);
    const reserved3 = dailyLimitStore.reserveSlot(phone, limit);
    const reserved4 = dailyLimitStore.reserveSlot(phone, limit);

    expect(reserved1).toBe(true);
    expect(reserved2).toBe(true);
    expect(reserved3).toBe(true);
    expect(reserved4).toBe(false); // Estourou o limite de 3
  });

  it('deve efetivar (COMMIT) a cota reservada em caso de sucesso', () => {
    const limit = 2;
    expect(dailyLimitStore.reserveSlot(phone, limit)).toBe(true);
    expect(dailyLimitStore.getDailyCount(phone)).toBe(0); // Ainda não commitou

    dailyLimitStore.commitSlot(phone);
    expect(dailyLimitStore.getDailyCount(phone)).toBe(1); // Agora está contabilizado
  });

  it('deve liberar (RELEASE) a cota reservada em caso de erro no processamento', () => {
    const limit = 1;
    expect(dailyLimitStore.reserveSlot(phone, limit)).toBe(true);
    expect(dailyLimitStore.reserveSlot(phone, limit)).toBe(false); // Bloqueado pois cota está reservada

    // Simula falha no processamento: libera a cota
    dailyLimitStore.releaseSlot(phone);

    // Deve permitir reservar novamente
    expect(dailyLimitStore.reserveSlot(phone, limit)).toBe(true);
  });

  it('deve serializar requisições concorrentes prevenindo race condition e duplicação de cota', async () => {
    const limit = 3;
    const totalRequests = 10;
    const results: boolean[] = [];

    // Dispara 10 requisições simultâneas concorrentes com UserLock
    const tasks = Array.from({ length: totalRequests }).map(async () => {
      const reserved = await userLock.acquire(`limit:${phone}`, async () => {
        return dailyLimitStore.reserveSlot(phone, limit);
      });

      if (reserved) {
        // Simula processamento assíncrono seguro
        await new Promise((r) => setTimeout(r, 15));
        await userLock.acquire(`limit:${phone}`, () => {
          dailyLimitStore.commitSlot(phone);
        });
        results.push(true);
      } else {
        results.push(false);
      }
    });

    await Promise.all(tasks);

    const successCount = results.filter((r) => r === true).length;
    const rejectedCount = results.filter((r) => r === false).length;

    expect(successCount).toBe(3);
    expect(rejectedCount).toBe(7);
    expect(dailyLimitStore.getDailyCount(phone)).toBe(3);
  });

  it('deve evitar envio duplicado de alerta de limite através de cooldown/idempotência', () => {
    expect(dailyLimitStore.shouldNotifyLimit(phone)).toBe(true);
    dailyLimitStore.markLimitNotified(phone);

    // Imediatamente depois, não deve notificar novamente
    expect(dailyLimitStore.shouldNotifyLimit(phone)).toBe(false);
  });
});
