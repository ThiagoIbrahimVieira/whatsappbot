import type { MediaType } from './media.js';

export interface ChatIdentity {
  remoteJid: string;
  isGroup: boolean;
  isBroadcast: boolean;
  isNewsletter: boolean;
  senderJid: string;
  fromMe: boolean;
}

export interface ExtractedMessage {
  id: string;
  chatId: string;
  senderJid: string;
  fromMe: boolean;
  isGroup: boolean;
  mediaType: MediaType;
  caption?: string;
  text?: string;
  timestamp: number;
  quotedMessage?: ExtractedMessage;
  rawMediaMessage?: unknown;
  rawMessage: unknown;
}
