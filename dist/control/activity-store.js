class ActivityStoreManager {
    maxItems = 80;
    activities = [];
    addActivity(item) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const entry = {
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
    getActivities() {
        return [...this.activities];
    }
    clear() {
        this.activities = [];
    }
}
export const activityStore = new ActivityStoreManager();
//# sourceMappingURL=activity-store.js.map