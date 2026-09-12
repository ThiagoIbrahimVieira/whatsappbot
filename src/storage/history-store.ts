import path from 'node:path';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';
import { maskPhoneNumber } from './library-manager.js';

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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_HISTORY_ENTRIES = 300;

export class HistoryStore {
  private history: HistoryEntry[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    const diskData = safeReadJsonSync<HistoryEntry[]>(HISTORY_FILE, []);
    this.history = Array.isArray(diskData) ? diskData : [];
  }

  private saveToDisk(): void {
    try {
      atomicWriteFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    } catch (err) {
      logger.error({ err }, 'Erro ao salvar history.json');
    }
  }

  public record(entry: {
    user: string;
    mediaType: string;
    operation: string;
    result: 'success' | 'failed';
    processingTimeMs: number;
    sizeBytes: number;
  }): HistoryEntry {
    const newEntry: HistoryEntry = {
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

  public getHistory(limit = 50): HistoryEntry[] {
    return this.history.slice(0, limit);
  }

  public clear(): void {
    this.history = [];
    this.saveToDisk();
  }
}

export const historyStore = new HistoryStore();
