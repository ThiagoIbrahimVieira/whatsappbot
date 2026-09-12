import fs from 'node:fs/promises';
import { logger } from '../utils/logger.js';
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutos de TTL
export class SessionManager {
    sessions = new Map();
    chatToSessionId = new Map();
    cleanupInterval = null;
    constructor() {
        this.startCleanupInterval();
    }
    startCleanupInterval() {
        if (this.cleanupInterval)
            return;
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 30_000);
        // Unref para não prender o event loop ao desligar
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }
    createSession(params) {
        // Se já havia uma sessão ativa para este chat, cancela e limpa a anterior
        const existingId = this.chatToSessionId.get(params.chatId);
        if (existingId) {
            this.cancelSession(params.chatId, 'Substituída por nova mídia');
        }
        const now = Date.now();
        const id = `sess_${now}_${Math.random().toString(36).substring(2, 8)}`;
        const session = {
            id,
            chatId: params.chatId,
            senderJid: params.senderJid,
            sourceMessageId: params.sourceMessageId,
            mediaType: params.mediaType,
            mimetype: params.mimetype,
            filePath: params.filePath,
            buffer: params.buffer,
            createdAt: now,
            expiresAt: now + SESSION_TTL_MS,
            currentStep: 'WAITING_FOR_ACTION',
        };
        this.sessions.set(id, session);
        this.chatToSessionId.set(params.chatId, id);
        logger.info({ sessionId: id, chat: params.chatId, mediaType: params.mediaType }, 'Nova sessão de mídia interativa criada');
        return session;
    }
    getSession(chatId) {
        const sessionId = this.chatToSessionId.get(chatId);
        if (!sessionId)
            return null;
        const session = this.sessions.get(sessionId);
        if (!session) {
            this.chatToSessionId.delete(chatId);
            return null;
        }
        if (Date.now() > session.expiresAt) {
            session.currentStep = 'EXPIRED';
            this.destroySession(session);
            return null;
        }
        return session;
    }
    updateSession(sessionId, partial) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        Object.assign(session, partial);
        return session;
    }
    cancelSession(chatId, reason = 'Cancelado pelo usuário') {
        const session = this.getSession(chatId);
        if (!session)
            return false;
        session.currentStep = 'CANCELLED';
        logger.info({ sessionId: session.id, chat: chatId, reason }, 'Sessão cancelada');
        this.destroySession(session);
        return true;
    }
    completeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.currentStep = 'COMPLETED';
        this.destroySession(session);
    }
    async destroySession(session) {
        this.sessions.delete(session.id);
        if (this.chatToSessionId.get(session.chatId) === session.id) {
            this.chatToSessionId.delete(session.chatId);
        }
        // Se houver arquivo temporário associado à sessão que não pertença a um job ativo, limpa
        if (session.filePath) {
            try {
                await fs.unlink(session.filePath);
            }
            catch { }
        }
    }
    cleanupExpired() {
        const now = Date.now();
        let cleaned = 0;
        for (const [, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                session.currentStep = 'EXPIRED';
                this.destroySession(session);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.info({ cleaned }, 'Sessões interativas expiradas foram limpas');
        }
        return cleaned;
    }
    getActiveCount() {
        return this.sessions.size;
    }
    clear() {
        this.sessions.clear();
        this.chatToSessionId.clear();
    }
}
export const sessionManager = new SessionManager();
//# sourceMappingURL=session-manager.js.map