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
declare class ActivityStoreManager {
    private readonly maxItems;
    private activities;
    addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'> & {
        timestamp?: string;
        id?: string;
    }): ActivityItem;
    getActivities(): ActivityItem[];
    clear(): void;
}
export declare const activityStore: ActivityStoreManager;
export {};
