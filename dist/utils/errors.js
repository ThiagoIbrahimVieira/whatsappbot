export class AppError extends Error {
    isOperational;
    userFriendlyMessage;
    constructor(message, userFriendlyMessage, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.userFriendlyMessage =
            userFriendlyMessage || '❌ Ocorreu um erro ao processar sua solicitação.';
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class MediaValidationError extends AppError {
    constructor(message, userFriendlyMessage) {
        super(message, userFriendlyMessage || '❌ Não foi possível validar o arquivo de mídia enviado.');
    }
}
export class UnsupportedMediaError extends AppError {
    constructor(mimetype) {
        super(`Tipo de mídia não suportado: ${mimetype || 'desconhecido'}`, '❌ Esse tipo de arquivo não é suportado para virar figurinha.');
    }
}
export class MediaTooLargeError extends AppError {
    constructor(sizeBytes, maxBytes) {
        const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
        const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
        super(`Mídia muito grande: ${sizeMb}MB (máx: ${maxMb}MB)`, `❌ Essa mídia é grande demais (${sizeMb}MB). O limite é ${maxMb}MB.`);
    }
}
export class VideoTooLongError extends AppError {
    constructor(durationSeconds, maxSeconds) {
        super(`Vídeo muito longo: ${durationSeconds.toFixed(1)}s (máx: ${maxSeconds}s)`, `❌ Esse vídeo é longo demais (${durationSeconds.toFixed(1)}s). O limite para figurinha é ${maxSeconds}s.`);
    }
}
export class StickerTooLargeError extends AppError {
    constructor(bytes, maxBytes) {
        super(`Figurinha gerada excede limite do WhatsApp: ${bytes} bytes (máx: ${maxBytes} bytes)`, '❌ Não foi possível comprimir a figurinha para o tamanho exigido pelo WhatsApp.');
    }
}
export class ProcessingError extends AppError {
    constructor(message, userFriendlyMessage) {
        super(message, userFriendlyMessage || '❌ Não consegui transformar essa mídia em figurinha.');
    }
}
export class AuthenticationError extends AppError {
    constructor(message) {
        super(message, '❌ Erro de autenticação com o WhatsApp.', false);
    }
}
export class WhatsAppConnectionError extends AppError {
    constructor(message) {
        super(message, '❌ Erro na conexão com os servidores do WhatsApp.', false);
    }
}
export class WhatsAppSendError extends AppError {
    constructor(message) {
        super(message, '❌ Falha ao enviar a figurinha para o chat.');
    }
}
//# sourceMappingURL=errors.js.map