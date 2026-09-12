import { CONSTANTS } from '../config/constants.js';
/**
 * Cache em memória com TTL e limite máximo de itens
 * Usado para prevenir processamento duplicado de mensagens e loops de eventos.
 */
export class RecentMessagesCache {
    cache = new Map();
    ttlMs;
    maxItems;
    constructor(ttlMs = CONSTANTS.MESSAGE_CACHE_TTL_MS, maxItems = CONSTANTS.MESSAGE_CACHE_MAX_ITEMS) {
        this.ttlMs = ttlMs;
        this.maxItems = maxItems;
    }
    /**
     * Verifica se o ID já existe no cache (ainda válido)
     */
    has(id) {
        this.cleanupExpired();
        return this.cache.has(id);
    }
    /**
     * Adiciona um ID ao cache
     */
    add(id) {
        this.cleanupExpired();
        // Se atingiu a capacidade máxima, descarta o item mais antigo
        if (this.cache.size >= this.maxItems) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(id, { addedAt: Date.now() });
    }
    /**
     * Remove entradas expiradas
     */
    cleanupExpired() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.addedAt > this.ttlMs) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Retorna o tamanho atual do cache
     */
    get size() {
        this.cleanupExpired();
        return this.cache.size;
    }
    /**
     * Limpa todo o cache
     */
    clear() {
        this.cache.clear();
    }
}
// Instância singleton do cache de mensagens
export const recentMessages = new RecentMessagesCache();
//# sourceMappingURL=cache.js.map