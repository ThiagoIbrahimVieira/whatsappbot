export interface SuccessStatRecord {
    id: string;
    timestamp: number;
    userPhone: string;
    userName: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
    processingTimeMs: number;
}
export type StatPeriod = 'today' | '7days' | '30days' | 'allTime';
export interface AnalyticsSummary {
    period: StatPeriod;
    total: number;
    images: number;
    videos: number;
    gifs: number;
    avgProcessingTimeMs: number;
}
export interface UserRankEntry {
    rank: number;
    name: string;
    phone: string;
    maskedPhone: string;
    count: number;
}
export declare class StatisticsManager {
    private records;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    /**
     * Registra estritamente operações CONCLUÍDAS COM SUCESSO.
     * Grupos, spams, falhas e mensagens ignoradas NUNCA chamam este método.
     */
    recordSuccess(userPhone: string, userName: string, mediaType: 'IMAGE' | 'VIDEO' | 'GIF', processingTimeMs: number): void;
    private filterByPeriod;
    getAnalytics(period?: StatPeriod): AnalyticsSummary;
    getRanking(period?: StatPeriod, limit?: number): UserRankEntry[];
    clear(): void;
}
export declare const statisticsManager: StatisticsManager;
