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

  private pendingBatches = new Map<
    string,
    {
      timer: NodeJS.Timeout | null;
      mediaList: any[];
      rawMessages: any[];
      params: any;
      onReady: (session: MediaSession, count: number) => Promise<void>;
    }
  >();

  public async addMediaToBatch(
    params: {
      chatId: string;
      senderJid: string;
      sourceMessageId: string;
      mediaType: 'image' | 'video' | 'gif';
      mimetype: string;
      originalMedia: any;
      rawMessage: any;
    },
    onReady: (session: MediaSession, count: number) => Promise<void>,
    debounceMs = 1500
  ): Promise<void> {
    const existing = this.pendingBatches.get(params.chatId);
    if (existing) {
      if (existing.timer) clearTimeout(existing.timer);
      existing.mediaList.push(params.originalMedia);
      existing.rawMessages.push(params.rawMessage);
      if (debounceMs <= 0) {
        await this.flushBatch(params.chatId);
      } else {
        existing.timer = setTimeout(() => {
          this.flushBatch(params.chatId);
        }, debounceMs);
      }
      return;
    }

    if (debounceMs <= 0) {
      this.pendingBatches.set(params.chatId, {
        timer: null,
        mediaList: [params.originalMedia],
        rawMessages: [params.rawMessage],
        params,
        onReady,
      });
      await this.flushBatch(params.chatId);
      return;
    }

    const timer = setTimeout(() => {
      this.flushBatch(params.chatId);
    }, debounceMs);

    this.pendingBatches.set(params.chatId, {
      timer,
      mediaList: [params.originalMedia],
      rawMessages: [params.rawMessage],
      params,
      onReady,
    });
  }

  public async flushBatch(chatId: string): Promise<void> {
    const pending = this.pendingBatches.get(chatId);
    if (!pending) return;
    if (pending.timer) clearTimeout(pending.timer);
    this.pendingBatches.delete(chatId);

    const session = this.createSession({
      ...pending.params,
      originalMedia: pending.mediaList[0],
      mediaList: pending.mediaList,
      rawMessage: pending.rawMessages[pending.rawMessages.length - 1],
    });

    try {
      await pending.onReady(session, pending.mediaList.length);
    } catch (err) {
      logger.error({ err, chatId }, 'Erro ao disparar menu interativo para lote de mídias');
    }
  }

  private normalize(jid?: string | null): string {
    if (!jid) return '';
    return jid.replace(/:.*@/, '@').trim().toLowerCase();
  }

  public createSession(params: {
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
  }): MediaSession {
    const normChat = this.normalize(params.chatId);
    const normSender = this.normalize(params.senderJid);

    // Se já havia uma sessão ativa para este chat ou sender, cancela e limpa a anterior
    const existingId =
      this.chatToSessionId.get(normChat) ||
      this.chatToSessionId.get(normSender) ||
      this.chatToSessionId.get(params.chatId);

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
      originalMedia: params.originalMedia,
      mediaList: params.mediaList || (params.originalMedia ? [params.originalMedia] : []),
      rawMessage: params.rawMessage,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
      currentStep: 'WAITING_FOR_ACTION',
    };

    this.sessions.set(id, session);
    this.chatToSessionId.set(params.chatId, id);
    if (normChat) this.chatToSessionId.set(normChat, id);
    if (normSender) this.chatToSessionId.set(normSender, id);

    logger.info(
      { sessionId: id, chat: params.chatId, mediaType: params.mediaType, count: session.mediaList?.length || 1 },
      'Nova sessão de mídia interativa criada'
    );

    return session;
  }

  public getSession(chatId: string, senderJid?: string): MediaSession | null {
    const normChat = this.normalize(chatId);
    const normSender = this.normalize(senderJid);

    const sessionId =
      (normChat && this.chatToSessionId.get(normChat)) ||
      (normSender && this.chatToSessionId.get(normSender)) ||
      this.chatToSessionId.get(chatId) ||
      (senderJid ? this.chatToSessionId.get(senderJid) : undefined);

    if (!sessionId) return null;

    const session = this.sessions.get(sessionId);
    if (!session) {
      if (normChat) this.chatToSessionId.delete(normChat);
      if (normSender) this.chatToSessionId.delete(normSender);
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

  public getSessionById(sessionId: string): MediaSession | null {
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;
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
    const pending = this.pendingBatches.get(chatId);
    if (pending) {
      if (pending.timer) clearTimeout(pending.timer);
      this.pendingBatches.delete(chatId);
    }

    const session = this.getSession(chatId);
    if (!session) return Boolean(pending);

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
    for (const [, pending] of this.pendingBatches.entries()) {
      if (pending.timer) clearTimeout(pending.timer);
    }
    this.pendingBatches.clear();
    this.sessions.clear();
    this.chatToSessionId.clear();
  }
}

export const sessionManager = new SessionManager();
