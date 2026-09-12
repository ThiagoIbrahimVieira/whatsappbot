export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly userFriendlyMessage: string;

  constructor(message: string, userFriendlyMessage?: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.userFriendlyMessage =
      userFriendlyMessage || '❌ Ocorreu um erro ao processar sua solicitação.';
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class MediaValidationError extends AppError {
  constructor(message: string, userFriendlyMessage?: string) {
    super(
      message,
      userFriendlyMessage || '❌ Não foi possível validar o arquivo de mídia enviado.'
    );
  }
}

export class UnsupportedMediaError extends AppError {
  constructor(mimetype?: string) {
    super(
      `Tipo de mídia não suportado: ${mimetype || 'desconhecido'}`,
      '❌ Esse tipo de arquivo não é suportado para virar figurinha.'
    );
  }
}

export class MediaTooLargeError extends AppError {
  constructor(sizeBytes: number, maxBytes: number) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    super(
      `Mídia muito grande: ${sizeMb}MB (máx: ${maxMb}MB)`,
      `❌ Essa mídia é grande demais (${sizeMb}MB). O limite é ${maxMb}MB.`
    );
  }
}

export class VideoTooLongError extends AppError {
  constructor(durationSeconds: number, maxSeconds: number) {
    super(
      `Vídeo muito longo: ${durationSeconds.toFixed(1)}s (máx: ${maxSeconds}s)`,
      `❌ Esse vídeo é longo demais (${durationSeconds.toFixed(1)}s). O limite para figurinha é ${maxSeconds}s.`
    );
  }
}

export class StickerTooLargeError extends AppError {
  constructor(bytes: number, maxBytes: number) {
    super(
      `Figurinha gerada excede limite do WhatsApp: ${bytes} bytes (máx: ${maxBytes} bytes)`,
      '❌ Não foi possível comprimir a figurinha para o tamanho exigido pelo WhatsApp.'
    );
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, userFriendlyMessage?: string) {
    super(
      message,
      userFriendlyMessage || '❌ Não consegui transformar essa mídia em figurinha.'
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, '❌ Erro de autenticação com o WhatsApp.', false);
  }
}

export class WhatsAppConnectionError extends AppError {
  constructor(message: string) {
    super(message, '❌ Erro na conexão com os servidores do WhatsApp.', false);
  }
}

export class WhatsAppSendError extends AppError {
  constructor(message: string) {
    super(message, '❌ Falha ao enviar a figurinha para o chat.');
  }
}
