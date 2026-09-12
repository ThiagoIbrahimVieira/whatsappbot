import { request } from './client';
import type { ActivityItem } from '../types';

export const activityApi = {
  getRecent: async (): Promise<ActivityItem[]> => {
    const res = await request<{ activities: ActivityItem[] }>('/recent');
    return res.activities || [];
  },

  clear: async (): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/recent/clear', {
      method: 'POST',
    });
  },
};
