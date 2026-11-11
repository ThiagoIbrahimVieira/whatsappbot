import path from 'node:path';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';
import { maskPhoneNumber } from './library-manager.js';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_HISTORY_ENTRIES = 300;
export class HistoryStore {
    history = [];
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        const diskData = safeReadJsonSync(HISTORY_FILE, []);
        this.history = Array.isArray(diskData) ? diskData : [];
    }
    saveToDisk() {
        try {
            atomicWriteFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
        }
        catch (err) {
            logger.error({ err }, 'Erro ao salvar history.json');
        }
    }
    record(entry) {
        const newEntry = {
            id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            user: maskPhoneNumber(entry.user),
            mediaType: entry.mediaType,
            operation: entry.operation,
            result: entry.result,
            processingTimeMs: entry.processingTimeMs,
            sizeBytes: entry.sizeBytes,
        };
        this.history.unshift(newEntry);
        if (this.history.length > MAX_HISTORY_ENTRIES) {
            this.history = this.history.slice(0, MAX_HISTORY_ENTRIES);
        }
        this.saveToDisk();
        return newEntry;
    }
    getHistory(limit = 50) {
        return this.history.slice(0, limit);
    }
    clear() {
        this.history = [];
        this.saveToDisk();
    }
}
export const historyStore = new HistoryStore();
//# sourceMappingURL=history-store.js.map