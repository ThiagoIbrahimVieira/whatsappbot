export type SessionStep = 'WAITING_FOR_ACTION' | 'WAITING_FOR_EFFECT' | 'WAITING_FOR_TEXT' | 'WAITING_FOR_PARAMETER' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export interface MediaSession {
    id: string;
    chatId: string;
    senderJid: string;
    sourceMessageId: string;
    mediaType: 'image' | 'video' | 'gif';
    mimetype: string;
    filePath?: string;
    buffer?: Buffer;
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
    createSession(params: {
        chatId: string;
        senderJid: string;
        sourceMessageId: string;
        mediaType: 'image' | 'video' | 'gif';
        mimetype: string;
        filePath?: string;
        buffer?: Buffer;
    }): MediaSession;
    getSession(chatId: string): MediaSession | null;
    updateSession(sessionId: string, partial: Partial<MediaSession>): MediaSession | null;
    cancelSession(chatId: string, reason?: string): boolean;
    completeSession(sessionId: string): void;
    private destroySession;
    cleanupExpired(): number;
    getActiveCount(): number;
    clear(): void;
}
export declare const sessionManager: SessionManager;
