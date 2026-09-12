import fs from 'node:fs/promises';
import { logger } from '../utils/logger.js';

export type SessionStep =
  | 'WAITING_FOR_ACTION'
  | 'WAITING_FOR_EFFECT'
  | 'WAITING_FOR_TEXT'
  | 'WAITING_FOR_PARAMETER'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

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

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutos de TTL

export class SessionManager {
  private sessions = new Map<string, MediaSession>();
  private chatToSessionId = new Map<string, string>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 30_000);
    // Unref para não prender o event loop ao desligar
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public createSession(params: {
    chatId: string;
    senderJid: string;
    sourceMessageId: string;
    mediaType: 'image' | 'video' | 'gif';
    mimetype: string;
    filePath?: string;
    buffer?: Buffer;
  }): MediaSession {
    // Se já havia uma sessão ativa para este chat, cancela e limpa a anterior
    const existingId = this.chatToSessionId.get(params.chatId);
    if (existingId) {
      this.cancelSession(params.chatId, 'Substituída por nova mídia');
    }

    const now = Date.now();
    const id = `sess_${now}_${Math.random().toString(36).substring(2, 8)}`;

    const session: MediaSession = {
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

    logger.info(
      { sessionId: id, chat: params.chatId, mediaType: params.mediaType },
      'Nova sessão de mídia interativa criada'
    );

    return session;
  }

  public getSession(chatId: string): MediaSession | null {
    const sessionId = this.chatToSessionId.get(chatId);
    if (!sessionId) return null;

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

  public updateSession(sessionId: string, partial: Partial<MediaSession>): MediaSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    Object.assign(session, partial);
    return session;
  }

  public cancelSession(chatId: string, reason = 'Cancelado pelo usuário'): boolean {
    const session = this.getSession(chatId);
    if (!session) return false;

    session.currentStep = 'CANCELLED';
    logger.info({ sessionId: session.id, chat: chatId, reason }, 'Sessão cancelada');
    this.destroySession(session);
    return true;
  }

  public completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.currentStep = 'COMPLETED';
    this.destroySession(session);
  }

  private async destroySession(session: MediaSession): Promise<void> {
    this.sessions.delete(session.id);
    if (this.chatToSessionId.get(session.chatId) === session.id) {
      this.chatToSessionId.delete(session.chatId);
    }

    // Se houver arquivo temporário associado à sessão que não pertença a um job ativo, limpa
    if (session.filePath) {
      try {
        await fs.unlink(session.filePath);
      } catch {}
    }
  }

  public cleanupExpired(): number {
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

  public getActiveCount(): number {
    return this.sessions.size;
  }

  public clear(): void {
    this.sessions.clear();
    this.chatToSessionId.clear();
  }
}

export const sessionManager = new SessionManager();
