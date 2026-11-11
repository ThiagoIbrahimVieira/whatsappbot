/**
 * Cache em memória com TTL e limite máximo de itens
 * Usado para prevenir processamento duplicado de mensagens e loops de eventos.
 */
export declare class RecentMessagesCache {
    private cache;
    private readonly ttlMs;
    private readonly maxItems;
    constructor(ttlMs?: number, maxItems?: number);
    /**
     * Verifica se o ID já existe no cache (ainda válido)
     */
    has(id: string): boolean;
    /**
     * Adiciona um ID ao cache
     */
    add(id: string): void;
    /**
     * Remove entradas expiradas
     */
    private cleanupExpired;
    /**
     * Retorna o tamanho atual do cache
     */
    get size(): number;
    /**
     * Limpa todo o cache
     */
    clear(): void;
}
export declare const recentMessages: RecentMessagesCache;
/**
 * Armazena o conteúdo bruto das mensagens (para decriptação de enquetes e contextInfo)
 */
export declare class MessageContentStore {
    private store;
    private readonly maxItems;
    get(id: string): any;
    set(id: string, message: any): void;
    clear(): void;
}
export declare const messageContentStore: MessageContentStore;
