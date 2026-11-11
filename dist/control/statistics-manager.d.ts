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
    handle: string;
    phone: string;
    maskedPhone: string;
    count: number;
    levelTitle: string;
    levelBadge: string;
}
export interface UserProfileStats {
    phone: string;
    name: string;
    handle: string;
    totalStickers: number;
    images: number;
    videos: number;
    gifs: number;
    rank: number;
    levelTitle: string;
    levelBadge: string;
    currentLevelMin: number;
    nextLevelStickers: number;
    progressPercent: number;
}
export declare function formatHandle(name: string): string;
export declare function computeUserLevel(count: number): {
    levelTitle: string;
    levelBadge: string;
    currentLevelMin: number;
    nextLevelStickers: number;
    progressPercent: number;
};
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
    getUserStats(userPhone: string): UserProfileStats;
    clear(): void;
}
export declare const statisticsManager: StatisticsManager;
