export interface HistoryEntry {
    id: string;
    timestamp: number;
    user: string;
    mediaType: string;
    operation: string;
    result: 'success' | 'failed';
    processingTimeMs: number;
    sizeBytes: number;
}
export declare class HistoryStore {
    private history;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    record(entry: {
        user: string;
        mediaType: string;
        operation: string;
        result: 'success' | 'failed';
        processingTimeMs: number;
        sizeBytes: number;
    }): HistoryEntry;
    getHistory(limit?: number): HistoryEntry[];
    clear(): void;
}
export declare const historyStore: HistoryStore;
