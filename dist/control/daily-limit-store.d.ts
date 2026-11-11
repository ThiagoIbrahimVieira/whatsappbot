export declare class DailyLimitStore {
    private usageMap;
    private reservedMap;
    constructor();
    getTodayString(): string;
    private cleanPhone;
    private loadFromDisk;
    private saveToDisk;
    getDailyCount(phone: string): number;
    increment(phone: string): number;
    /**
     * Reserva 1 slot de cota se houver disponibilidade.
     * Semântica explícita: RESERVE -> PROCESS -> COMMIT (sucesso) ou RELEASE (falha).
     */
    reserveSlot(phone: string, limit: number): boolean;
    /**
     * Conclui a reserva com sucesso, incrementando efetivamente o uso do dia.
     */
    commitSlot(phone: string): number;
    /**
     * Libera o slot reservado em caso de erro, cancelamento ou falha.
     * Não incrementa a contagem de uso diário do usuário.
     */
    releaseSlot(phone: string): void;
    getReservedCount(phone: string): number;
    /**
     * Reserva e consome atomicamente 1 uso se a cota estiver disponível.
     * Evita condições de corrida entre requisições simultâneas.
     */
    consumeIfAvailable(phone: string, limit: number): boolean;
    /**
     * Reverte 1 cota em caso de erro irrecuperável de processamento.
     */
    rollback(phone: string): void;
    canGenerate(phone: string, limit: number): boolean;
    getRemaining(phone: string, limit: number): number;
    /**
     * Verifica se devemos enviar a notificação de limite para o usuário.
     * Garante idempotência: retorna true apenas se ainda não notificou dentro da janela de cooldown.
     */
    shouldNotifyLimit(phone: string, cooldownMs?: number): boolean;
    /**
     * Marca que a notificação de limite foi enviada para o usuário.
     */
    markLimitNotified(phone: string): void;
    clear(): void;
}
export declare const dailyLimitStore: DailyLimitStore;
