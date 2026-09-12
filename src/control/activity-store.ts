export interface ActivityItem {
  id: string;
  timestamp: string;
  senderName: string;
  senderPhone: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'GIF' | 'STICKER' | 'AUDIO';
  status: 'Processed' | 'Unauthorized' | 'Failed' | 'Queued';
  processingTimeMs?: number;
  sizeKb?: number;
  failureReason?: string;
  commandUsed?: string;
}

class ActivityStoreManager {
  private readonly maxItems: number = 80;
  private activities: ActivityItem[] = [];

  public addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'> & { timestamp?: string; id?: string }): ActivityItem {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const entry: ActivityItem = {
      id: item.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: item.timestamp || `${hours}:${minutes}`,
      senderName: item.senderName || 'Desconhecido',
      senderPhone: item.senderPhone,
      mediaType: item.mediaType,
      status: item.status,
      processingTimeMs: item.processingTimeMs,
      sizeKb: item.sizeKb,
      failureReason: item.failureReason,
      commandUsed: item.commandUsed,
    };

    this.activities.unshift(entry);

    if (this.activities.length > this.maxItems) {
      this.activities.length = this.maxItems;
    }

    return entry;
  }

  public getActivities(): ActivityItem[] {
    return [...this.activities];
  }

  public clear(): void {
    this.activities = [];
  }
}

export const activityStore = new ActivityStoreManager();
