import { CONSTANTS } from '../config/constants.js';

interface CacheEntry {
  addedAt: number;
}

/**
 * Cache em memória com TTL e limite máximo de itens
 * Usado para prevenir processamento duplicado de mensagens e loops de eventos.
 */
export class RecentMessagesCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxItems: number;

  constructor(
    ttlMs: number = CONSTANTS.MESSAGE_CACHE_TTL_MS,
    maxItems: number = CONSTANTS.MESSAGE_CACHE_MAX_ITEMS
  ) {
    this.ttlMs = ttlMs;
    this.maxItems = maxItems;
  }

  /**
   * Verifica se o ID já existe no cache (ainda válido)
   */
  public has(id: string): boolean {
    this.cleanupExpired();
    return this.cache.has(id);
  }

  /**
   * Adiciona um ID ao cache
   */
  public add(id: string): void {
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
  private cleanupExpired(): void {
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
  public get size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  /**
   * Limpa todo o cache
   */
  public clear(): void {
    this.cache.clear();
  }
}

// Instância singleton do cache de mensagens
export const recentMessages = new RecentMessagesCache();

/**
 * Armazena o conteúdo bruto das mensagens (para decriptação de enquetes e contextInfo)
 */
export class MessageContentStore {
  private store = new Map<string, any>();
  private readonly maxItems: number = 2000;

  public get(id: string): any {
    return this.store.get(id);
  }

  public set(id: string, message: any): void {
    if (this.store.size >= this.maxItems) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(id, message);
  }

  public clear(): void {
    this.store.clear();
  }
}

export const messageContentStore = new MessageContentStore();
