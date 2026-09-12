import { request } from './client';
import type { MetricsData, SystemInfo, QuickSettings, BotStatus, AccessMode } from '../types';

export interface BotStatusResponse {
  connected: boolean;
  whatsappStatus: 'Connected' | 'Reconnecting' | 'Disconnected';
  botActive: boolean;
  botStatus: BotStatus;
  accessMode: 'self' | 'whitelist' | 'all';
  uptime: string;
  uptimeSeconds: number;
  phoneNumber: string;
  metrics: MetricsData;
  systemInfo: SystemInfo;
  quickSettings: QuickSettings;
  allowedCount: number;
  qrCode?: string | null;
}

export const botApi = {
  getStatus: async (): Promise<BotStatusResponse> => {
    return request<BotStatusResponse>('/status');
  },

  toggle: async (active: boolean): Promise<{ active: boolean; message: string }> => {
    return request<{ active: boolean; message: string }>('/bot/toggle', {
      method: 'POST',
      body: JSON.stringify({ active }),
    });
  },

  updateSettings: async (settings: Partial<QuickSettings>): Promise<{ settings: QuickSettings }> => {
    return request<{ settings: QuickSettings }>('/bot/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },
};
