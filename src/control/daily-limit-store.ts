import path from 'node:path';
import { safeReadJsonSync, atomicWriteFileSync } from '../utils/atomic-write.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

interface DailyUsageRecord {
  date: string;
  count: number;
  lastNotifiedAt?: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DAILY_LIMITS_FILE = path.join(DATA_DIR, 'daily-limits.json');

export class DailyLimitStore {
  private usageMap: Map<string, DailyUsageRecord> = new Map();
  private reservedMap: Map<string, number> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  public getTodayString(): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  private cleanPhone(phone: string): string {
    return (phone || '').replace(/\D/g, '');
  }

  private loadFromDisk(): void {
    if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') return;
    const diskData = safeReadJsonSync<Record<string, DailyUsageRecord>>(DAILY_LIMITS_FILE, {});
    if (diskData && typeof diskData === 'object') {
      for (const [key, val] of Object.entries(diskData)) {
        if (val && typeof val.date === 'string' && typeof val.count === 'number') {
          this.usageMap.set(key, val);
        }
      }
    }
  }

  private saveToDisk(): void {
    if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') return;
    try {
      const obj: Record<string, DailyUsageRecord> = {};
      for (const [key, val] of this.usageMap.entries()) {
        obj[key] = val;
      }
      atomicWriteFileSync(DAILY_LIMITS_FILE, JSON.stringify(obj, null, 2));
    } catch (err) {
      logger.error({ err }, 'Erro ao salvar daily-limits.json');
    }
  }

  public getDailyCount(phone: string): number {
    const clean = this.cleanPhone(phone);
    if (!clean) return 0;
    const record = this.usageMap.get(clean);
    if (!record) return 0;

    const today = this.getTodayString();
    if (record.date !== today) {
      return 0;
    }
    return record.count;
  }

  public increment(phone: string): number {
    const clean = this.cleanPhone(phone);
    if (!clean) return 0;

    const today = this.getTodayString();
    const current = this.getDailyCount(clean);
    const existing = this.usageMap.get(clean);
    const updated: DailyUsageRecord = {
      date: today,
      count: current + 1,
      lastNotifiedAt: existing?.date === today ? existing.lastNotifiedAt : undefined,
    };

    this.usageMap.set(clean, updated);
    this.saveToDisk();
    return updated.count;
  }

  /**
   * Reserva 1 slot de cota se houver disponibilidade.
   * Semântica explícita: RESERVE -> PROCESS -> COMMIT (sucesso) ou RELEASE (falha).
   */
  public reserveSlot(phone: string, limit: number): boolean {
    const clean = this.cleanPhone(phone);
    if (!clean) return false;

    const currentUsed = this.getDailyCount(clean);
    const currentlyReserved = this.reservedMap.get(clean) || 0;

    if (currentUsed + currentlyReserved >= limit) {
      return false;
    }

    this.reservedMap.set(clean, currentlyReserved + 1);
    return true;
  }

  /**
   * Conclui a reserva com sucesso, incrementando efetivamente o uso do dia.
   */
  public commitSlot(phone: string): number {
    const clean = this.cleanPhone(phone);
    if (!clean) return 0;

    const currentlyReserved = this.reservedMap.get(clean) || 0;
    if (currentlyReserved > 0) {
      this.reservedMap.set(clean, currentlyReserved - 1);
    }

    return this.increment(clean);
  }

  /**
   * Libera o slot reservado em caso de erro, cancelamento ou falha.
   * Não incrementa a contagem de uso diário do usuário.
   */
  public releaseSlot(phone: string): void {
    const clean = this.cleanPhone(phone);
    if (!clean) return;

    const currentlyReserved = this.reservedMap.get(clean) || 0;
    if (currentlyReserved > 0) {
      this.reservedMap.set(clean, currentlyReserved - 1);
    }
  }

  public getReservedCount(phone: string): number {
    const clean = this.cleanPhone(phone);
    return this.reservedMap.get(clean) || 0;
  }

  /**
   * Reserva e consome atomicamente 1 uso se a cota estiver disponível.
   * Evita condições de corrida entre requisições simultâneas.
   */
  public consumeIfAvailable(phone: string, limit: number): boolean {
    return this.reserveSlot(phone, limit) && Boolean(this.commitSlot(phone));
  }

  /**
   * Reverte 1 cota em caso de erro irrecuperável de processamento.
   */
  public rollback(phone: string): void {
    const clean = this.cleanPhone(phone);
    if (!clean) return;

    const current = this.getDailyCount(clean);
    if (current <= 0) return;

    const existing = this.usageMap.get(clean);
    if (existing) {
      existing.count = Math.max(0, current - 1);
      this.saveToDisk();
    }
  }

  public canGenerate(phone: string, limit: number): boolean {
    const clean = this.cleanPhone(phone);
    const currentUsed = this.getDailyCount(clean);
    const currentlyReserved = this.reservedMap.get(clean) || 0;
    return currentUsed + currentlyReserved < limit;
  }

  public getRemaining(phone: string, limit: number): number {
    const used = this.getDailyCount(phone);
    const reserved = this.getReservedCount(phone);
    return Math.max(0, limit - (used + reserved));
  }

  /**
   * Verifica se devemos enviar a notificação de limite para o usuário.
   * Garante idempotência: retorna true apenas se ainda não notificou dentro da janela de cooldown.
   */
  public shouldNotifyLimit(phone: string, cooldownMs = 3 * 60 * 1000): boolean {
    const clean = this.cleanPhone(phone);
    if (!clean) return false;

    const record = this.usageMap.get(clean);
    const today = this.getTodayString();

    if (!record || record.date !== today || !record.lastNotifiedAt) {
      return true;
    }

    const elapsed = Date.now() - record.lastNotifiedAt;
    return elapsed >= cooldownMs;
  }

  /**
   * Marca que a notificação de limite foi enviada para o usuário.
   */
  public markLimitNotified(phone: string): void {
    const clean = this.cleanPhone(phone);
    if (!clean) return;

    const today = this.getTodayString();
    const existing = this.usageMap.get(clean);
    if (existing && existing.date === today) {
      existing.lastNotifiedAt = Date.now();
    } else {
      this.usageMap.set(clean, {
        date: today,
        count: existing?.date === today ? existing.count : 0,
        lastNotifiedAt: Date.now(),
      });
    }
    this.saveToDisk();
  }

  public clear(): void {
    this.usageMap.clear();
    this.reservedMap.clear();
    this.saveToDisk();
  }
}

export const dailyLimitStore = new DailyLimitStore();
