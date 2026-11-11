export type SessionStep = 'WAITING_FOR_ACTION' | 'WAITING_FOR_EFFECT' | 'WAITING_FOR_TEXT' | 'WAITING_FOR_PARAMETER' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export interface MediaSession {
    id: string;
    chatId: string;
    senderJid: string;
    sourceMessageId: string;
    pollMessageId?: string;
    flow?: 'media_interactive' | 'pack_management' | 'vip_checkout';
    status?: 'active' | 'completed' | 'cancelled' | 'expired';
    mediaType: 'image' | 'video' | 'gif';
    mimetype: string;
    filePath?: string;
    buffer?: Buffer;
    originalMedia?: any;
    mediaList?: any[];
    rawMessage?: any;
    createdAt: number;
    expiresAt: number;
    currentStep: SessionStep;
    selectedAction?: string;
    selectedEffect?: string;
    customText?: string;
    customParam?: any;
}
export declare class SessionManager {
    private sessions;
    private chatToSessionId;
    private cleanupInterval;
    constructor();
    private startCleanupInterval;
    private pendingBatches;
    addMediaToBatch(params: {
        chatId: string;
        senderJid: string;
        sourceMessageId: string;
        mediaType: 'image' | 'video' | 'gif';
        mimetype: string;
        originalMedia: any;
        rawMessage: any;
    }, onReady: (session: MediaSession, count: number) => Promise<void>, debounceMs?: number): Promise<void>;
    flushBatch(chatId: string): Promise<void>;
    private normalize;
    createSession(params: {
        chatId: string;
        senderJid: string;
        sourceMessageId: string;
        mediaType: 'image' | 'video' | 'gif';
        mimetype: string;
        filePath?: string;
        buffer?: Buffer;
        originalMedia?: any;
        mediaList?: any[];
        rawMessage?: any;
    }): MediaSession;
    getSession(chatId: string, senderJid?: string): MediaSession | null;
    getSessionById(sessionId: string): MediaSession | null;
    updateSession(sessionId: string, partial: Partial<MediaSession>): MediaSession | null;
    cancelSession(chatId: string, reason?: string): boolean;
    completeSession(sessionId: string): void;
    private destroySession;
    cleanupExpired(): number;
    getActiveCount(): number;
    clear(): void;
}
export declare const sessionManager: SessionManager;
