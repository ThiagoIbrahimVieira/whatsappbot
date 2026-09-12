import path from 'node:path';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';
import { maskPhoneNumber } from '../storage/library-manager.js';

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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATS_FILE = path.join(DATA_DIR, 'statistics.json');
const MAX_STAT_RECORDS = 5000;

export class StatisticsManager {
  private records: SuccessStatRecord[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    const diskData = safeReadJsonSync<SuccessStatRecord[]>(STATS_FILE, []);
    this.records = Array.isArray(diskData) ? diskData : [];
  }

  private saveToDisk(): void {
    try {
      atomicWriteFileSync(STATS_FILE, JSON.stringify(this.records, null, 2));
    } catch (err) {
      logger.error({ err }, 'Erro ao salvar statistics.json');
    }
  }

  /**
   * Registra estritamente operações CONCLUÍDAS COM SUCESSO.
   * Grupos, spams, falhas e mensagens ignoradas NUNCA chamam este método.
   */
  public recordSuccess(
    userPhone: string,
    userName: string,
    mediaType: 'IMAGE' | 'VIDEO' | 'GIF',
    processingTimeMs: number
  ): void {
    const record: SuccessStatRecord = {
      id: `stat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      userPhone: userPhone.replace(/\D/g, ''),
      userName: userName || 'Amigo',
      mediaType,
      processingTimeMs,
    };

    this.records.unshift(record);

    if (this.records.length > MAX_STAT_RECORDS) {
      this.records = this.records.slice(0, MAX_STAT_RECORDS);
    }

    this.saveToDisk();
  }

  private filterByPeriod(period: StatPeriod): SuccessStatRecord[] {
    const now = Date.now();
    let minTimestamp = 0;

    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      minTimestamp = today.getTime();
    } else if (period === '7days') {
      minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === '30days') {
      minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    }

    if (minTimestamp <= 0) return this.records;
    return this.records.filter((r) => r.timestamp >= minTimestamp);
  }

  public getAnalytics(period: StatPeriod = 'allTime'): AnalyticsSummary {
    const filtered = this.filterByPeriod(period);

    let images = 0;
    let videos = 0;
    let gifs = 0;
    let totalTime = 0;

    for (const rec of filtered) {
      if (rec.mediaType === 'IMAGE') images++;
      else if (rec.mediaType === 'VIDEO') videos++;
      else if (rec.mediaType === 'GIF') gifs++;
      totalTime += rec.processingTimeMs;
    }

    const total = filtered.length;
    const avgProcessingTimeMs = total > 0 ? Math.round(totalTime / total) : 0;

    return {
      period,
      total,
      images,
      videos,
      gifs,
      avgProcessingTimeMs,
    };
  }

  public getRanking(period: StatPeriod = 'allTime', limit = 10): UserRankEntry[] {
    const filtered = this.filterByPeriod(period);
    const userMap = new Map<string, { name: string; count: number }>();

    for (const rec of filtered) {
      const key = rec.userPhone || 'anon';
      const current = userMap.get(key) || { name: rec.userName || 'Amigo', count: 0 };
      current.count++;
      if (rec.userName && rec.userName !== 'Desconhecido' && (current.name === 'Amigo' || current.name === 'Desconhecido')) {
        current.name = rec.userName;
      }
      userMap.set(key, current);
    }

    const sorted = Array.from(userMap.entries())
      .map(([phone, data]) => ({
        name: data.name,
        phone,
        maskedPhone: maskPhoneNumber(phone),
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted.map((item, index) => ({
      rank: index + 1,
      name: item.name,
      phone: item.phone,
      maskedPhone: item.maskedPhone,
      count: item.count,
    }));
  }

  public clear(): void {
    this.records = [];
    this.saveToDisk();
  }
}

export const statisticsManager = new StatisticsManager();
