import path from 'node:path';
import { safeReadJsonSync, atomicWriteFileSync } from '../utils/atomic-write.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DAILY_LIMITS_FILE = path.join(DATA_DIR, 'daily-limits.json');
export class DailyLimitStore {
    usageMap = new Map();
    reservedMap = new Map();
    constructor() {
        this.loadFromDisk();
    }
    getTodayString() {
        try {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Sao_Paulo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date());
        }
        catch {
            return new Date().toISOString().slice(0, 10);
        }
    }
    cleanPhone(phone) {
        return (phone || '').replace(/\D/g, '');
    }
    loadFromDisk() {
        if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test')
            return;
        const diskData = safeReadJsonSync(DAILY_LIMITS_FILE, {});
        if (diskData && typeof diskData === 'object') {
            for (const [key, val] of Object.entries(diskData)) {
                if (val && typeof val.date === 'string' && typeof val.count === 'number') {
                    this.usageMap.set(key, val);
                }
            }
        }
    }
    saveToDisk() {
        if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test')
            return;
        try {
            const obj = {};
            for (const [key, val] of this.usageMap.entries()) {
                obj[key] = val;
            }
            atomicWriteFileSync(DAILY_LIMITS_FILE, JSON.stringify(obj, null, 2));
        }
        catch (err) {
            logger.error({ err }, 'Erro ao salvar daily-limits.json');
        }
    }
    getDailyCount(phone) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return 0;
        const record = this.usageMap.get(clean);
        if (!record)
            return 0;
        const today = this.getTodayString();
        if (record.date !== today) {
            return 0;
        }
        return record.count;
    }
    increment(phone) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return 0;
        const today = this.getTodayString();
        const current = this.getDailyCount(clean);
        const existing = this.usageMap.get(clean);
        const updated = {
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
    reserveSlot(phone, limit) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return false;
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
    commitSlot(phone) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return 0;
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
    releaseSlot(phone) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return;
        const currentlyReserved = this.reservedMap.get(clean) || 0;
        if (currentlyReserved > 0) {
            this.reservedMap.set(clean, currentlyReserved - 1);
        }
    }
    getReservedCount(phone) {
        const clean = this.cleanPhone(phone);
        return this.reservedMap.get(clean) || 0;
    }
    /**
     * Reserva e consome atomicamente 1 uso se a cota estiver disponível.
     * Evita condições de corrida entre requisições simultâneas.
     */
    consumeIfAvailable(phone, limit) {
        return this.reserveSlot(phone, limit) && Boolean(this.commitSlot(phone));
    }
    /**
     * Reverte 1 cota em caso de erro irrecuperável de processamento.
     */
    rollback(phone) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return;
        const current = this.getDailyCount(clean);
        if (current <= 0)
            return;
        const existing = this.usageMap.get(clean);
        if (existing) {
            existing.count = Math.max(0, current - 1);
            this.saveToDisk();
        }
    }
    canGenerate(phone, limit) {
        const clean = this.cleanPhone(phone);
        const currentUsed = this.getDailyCount(clean);
        const currentlyReserved = this.reservedMap.get(clean) || 0;
        return currentUsed + currentlyReserved < limit;
    }
    getRemaining(phone, limit) {
        const used = this.getDailyCount(phone);
        const reserved = this.getReservedCount(phone);
        return Math.max(0, limit - (used + reserved));
    }
    /**
     * Verifica se devemos enviar a notificação de limite para o usuário.
     * Garante idempotência: retorna true apenas se ainda não notificou dentro da janela de cooldown.
     */
    shouldNotifyLimit(phone, cooldownMs = 3 * 60 * 1000) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return false;
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
    markLimitNotified(phone) {
        const clean = this.cleanPhone(phone);
        if (!clean)
            return;
        const today = this.getTodayString();
        const existing = this.usageMap.get(clean);
        if (existing && existing.date === today) {
            existing.lastNotifiedAt = Date.now();
        }
        else {
            this.usageMap.set(clean, {
                date: today,
                count: existing?.date === today ? existing.count : 0,
                lastNotifiedAt: Date.now(),
            });
        }
        this.saveToDisk();
    }
    clear() {
        this.usageMap.clear();
        this.reservedMap.clear();
        this.saveToDisk();
    }
}
export const dailyLimitStore = new DailyLimitStore();
//# sourceMappingURL=daily-limit-store.js.map