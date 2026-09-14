import { request } from './client';
import type { UserRankEntry } from '../types';

export type RankingPeriod = 'today' | '7days' | '30days' | 'allTime';

export const rankingApi = {
  getRanking: async (period: RankingPeriod = 'allTime', limit = 20): Promise<UserRankEntry[]> => {
    const res = await request<{ ranking: UserRankEntry[] }>(`/ranking?period=${period}&limit=${limit}`);
    return res.ranking || [];
  },
};
