export type NavView = 'dashboard' | 'activity' | 'access' | 'settings';

export type BotStatus = 'active' | 'paused' | 'disconnected';

export type AccessMode = 'only_me' | 'whitelist' | 'everyone';

export type MediaType = 'IMAGE' | 'VIDEO' | 'GIF' | 'STICKER' | 'AUDIO';

export type ActivityStatus = 'Processed' | 'Unauthorized' | 'Failed' | 'Queued';

export interface ActivityItem {
  id: string;
  timestamp: string;
  senderName: string;
  senderPhone: string;
  mediaType: MediaType;
  status: ActivityStatus;
  processingTimeMs?: number;
  sizeKb?: number;
  failureReason?: string;
  commandUsed?: string;
}

export interface WhitelistContact {
  id: string;
  name: string;
  phone: string;
  addedDate: string;
  avatarColor?: string;
  totalConverted?: number;
}

export interface QuickSettings {
  images: boolean;
  videos: boolean;
  gifs: boolean;
  commands: boolean;
  autoCropSquare: boolean;
  keepQuality: boolean;
  replyWithAuthor: boolean;
  packName: string;
  authorName: string;
}

export interface SystemInfo {
  whatsappStatus: 'Connected' | 'Reconnecting' | 'Disconnected';
  phoneNumber: string;
  uptime: string;
  runtime: string;
  engine: string;
  imageLibrary: string;
  videoLibrary: string;
  version: string;
  memoryUsage: string;
  avgLatency: string;
  lastPing: string;
}

export interface MetricsData {
  stickersToday: number;
  successful: number;
  queued: number;
  failed: number;
}
