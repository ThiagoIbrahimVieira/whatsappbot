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

export function formatHandle(name: string): string {
  if (!name || name === 'Amigo' || name === 'Desconhecido') {
    return '@amigo';
  }
  const clean = name.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').toLowerCase();
  return `@${clean || 'criador'}`;
}

export function computeUserLevel(count: number): {
  levelTitle: string;
  levelBadge: string;
  currentLevelMin: number;
  nextLevelStickers: number;
  progressPercent: number;
} {
  if (count >= 501) {
    return {
      levelTitle: 'Lenda do WhatsApp',
      levelBadge: '👑',
      currentLevelMin: 501,
      nextLevelStickers: 501,
      progressPercent: 100,
    };
  }
  if (count >= 251) {
    const range = 501 - 251;
    const progress = Math.min(100, Math.round(((count - 251) / range) * 100));
    return {
      levelTitle: 'Mestre dos Stickers',
      levelBadge: '⚡',
      currentLevelMin: 251,
      nextLevelStickers: 501,
      progressPercent: progress,
    };
  }
  if (count >= 121) {
    const range = 251 - 121;
    const progress = Math.min(100, Math.round(((count - 121) / range) * 100));
    return {
      levelTitle: 'Fábrica de Memes',
      levelBadge: '🏭',
      currentLevelMin: 121,
      nextLevelStickers: 251,
      progressPercent: progress,
    };
  }
  if (count >= 51) {
    const range = 121 - 51;
    const progress = Math.min(100, Math.round(((count - 51) / range) * 100));
    return {
      levelTitle: 'Viciado em Sticker',
      levelBadge: '🎨',
      currentLevelMin: 51,
      nextLevelStickers: 121,
      progressPercent: progress,
    };
  }
  if (count >= 16) {
    const range = 51 - 16;
    const progress = Math.min(100, Math.round(((count - 16) / range) * 100));
    return {
      levelTitle: 'Colecionador',
      levelBadge: '📦',
      currentLevelMin: 16,
      nextLevelStickers: 51,
      progressPercent: progress,
    };
  }
  const range = 16 - 1;
  const progress = Math.min(100, Math.round(((count - 1) / range) * 100));
  return {
    levelTitle: 'Iniciante',
    levelBadge: '🌱',
    currentLevelMin: 1,
    nextLevelStickers: 16,
    progressPercent: Math.max(5, progress),
  };
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
      .map(([phone, data]) => {
        const level = computeUserLevel(data.count);
        return {
          name: data.name,
          handle: formatHandle(data.name),
          phone,
          maskedPhone: maskPhoneNumber(phone),
          count: data.count,
          levelTitle: level.levelTitle,
          levelBadge: level.levelBadge,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted.map((item, index) => ({
      rank: index + 1,
      name: item.name,
      handle: item.handle,
      phone: item.phone,
      maskedPhone: item.maskedPhone,
      count: item.count,
      levelTitle: item.levelTitle,
      levelBadge: item.levelBadge,
    }));
  }

  public getUserStats(userPhone: string): UserProfileStats {
    const cleanPhone = userPhone.replace(/\D/g, '');
    const userRecords = this.records.filter((r) => r.userPhone === cleanPhone);

    let images = 0;
    let videos = 0;
    let gifs = 0;
    let userName = 'Amigo';

    for (const rec of userRecords) {
      if (rec.mediaType === 'IMAGE') images++;
      else if (rec.mediaType === 'VIDEO') videos++;
      else if (rec.mediaType === 'GIF') gifs++;
      if (rec.userName && rec.userName !== 'Desconhecido' && userName === 'Amigo') {
        userName = rec.userName;
      }
    }

    const total = userRecords.length;
    const allRanking = this.getRanking('allTime', 9999);
    const userRankItem = allRanking.find((r) => r.phone === cleanPhone);
    const rank = userRankItem ? userRankItem.rank : (total > 0 ? allRanking.length + 1 : 0);
    const level = computeUserLevel(total);

    return {
      phone: cleanPhone,
      name: userName,
      handle: formatHandle(userName),
      totalStickers: total,
      images,
      videos,
      gifs,
      rank,
      ...level,
    };
  }

  public clear(): void {
    this.records = [];
    this.saveToDisk();
  }
}

export const statisticsManager = new StatisticsManager();
