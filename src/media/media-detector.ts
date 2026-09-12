import type { MediaType } from '../types/media.js';

export interface DetectedMedia {
  type: MediaType;
  mimetype?: string;
  isGif: boolean;
  caption?: string;
  text?: string;
  rawMediaMessage?: any;
  fileLength?: number;
  seconds?: number;
}

/**
 * Desembrulha mensagens aninhadas como ViewOnce, Ephemeral, etc.
 */
export function unwrapMessage(rawMessage: any): any {
  if (!rawMessage) return undefined;

  let msg = rawMessage;

  // Se for o wrapper WebMessageInfo completo
  if (msg.message) {
    msg = msg.message;
  }

  // ViewOnce v2
  if (msg.viewOnceMessageV2?.message) {
    msg = msg.viewOnceMessageV2.message;
  }
  // ViewOnce v1
  if (msg.viewOnceMessage?.message) {
    msg = msg.viewOnceMessage.message;
  }
  // ViewOnce extension
  if (msg.viewOnceMessageV2Extension?.message) {
    msg = msg.viewOnceMessageV2Extension.message;
  }
  // Mensagens efêmeras
  if (msg.ephemeralMessage?.message) {
    msg = msg.ephemeralMessage.message;
  }
  // DocumentWithCaption
  if (msg.documentWithCaptionMessage?.message) {
    msg = msg.documentWithCaptionMessage.message;
  }

  return msg;
}

/**
 * Detecta o tipo de mídia ou conteúdo de uma mensagem sem realizar download ou processamento.
 */
export function detectMedia(rawMessage: any): DetectedMedia {
  const msg = unwrapMessage(rawMessage);

  if (!msg) {
    return { type: 'UNKNOWN', isGif: false };
  }

  // Imagem
  if (msg.imageMessage) {
    const im = msg.imageMessage;
    return {
      type: 'IMAGE',
      mimetype: im.mimetype || 'image/jpeg',
      isGif: false,
      caption: im.caption || undefined,
      text: im.caption || undefined,
      rawMediaMessage: im,
      fileLength: Number(im.fileLength) || undefined,
    };
  }

  // Vídeo ou GIF
  if (msg.videoMessage) {
    const vm = msg.videoMessage;
    const isGif = Boolean(vm.gifPlayback);
    return {
      type: isGif ? 'GIF' : 'VIDEO',
      mimetype: vm.mimetype || 'video/mp4',
      isGif,
      caption: vm.caption || undefined,
      text: vm.caption || undefined,
      rawMediaMessage: vm,
      fileLength: Number(vm.fileLength) || undefined,
      seconds: Number(vm.seconds) || undefined,
    };
  }

  // Figurinha (Sticker)
  if (msg.stickerMessage) {
    return {
      type: 'STICKER',
      mimetype: msg.stickerMessage.mimetype || 'image/webp',
      isGif: Boolean(msg.stickerMessage.isAnimated),
      rawMediaMessage: msg.stickerMessage,
    };
  }

  // Áudio / Nota de voz
  if (msg.audioMessage) {
    return {
      type: 'AUDIO',
      mimetype: msg.audioMessage.mimetype || 'audio/ogg',
      isGif: false,
      rawMediaMessage: msg.audioMessage,
    };
  }

  // Documento
  if (msg.documentMessage) {
    return {
      type: 'DOCUMENT',
      mimetype: msg.documentMessage.mimetype,
      caption: msg.documentMessage.caption,
      text: msg.documentMessage.caption,
      isGif: false,
      rawMediaMessage: msg.documentMessage,
    };
  }

  // Texto comum ou com preview/citação
  if (msg.conversation) {
    return {
      type: 'TEXT',
      isGif: false,
      text: msg.conversation,
    };
  }

  if (msg.extendedTextMessage) {
    return {
      type: 'TEXT',
      isGif: false,
      text: msg.extendedTextMessage.text || '',
    };
  }

  return {
    type: 'UNKNOWN',
    isGif: false,
  };
}
