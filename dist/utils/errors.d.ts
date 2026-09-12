export declare class AppError extends Error {
    readonly isOperational: boolean;
    readonly userFriendlyMessage: string;
    constructor(message: string, userFriendlyMessage?: string, isOperational?: boolean);
}
export declare class MediaValidationError extends AppError {
    constructor(message: string, userFriendlyMessage?: string);
}
export declare class UnsupportedMediaError extends AppError {
    constructor(mimetype?: string);
}
export declare class MediaTooLargeError extends AppError {
    constructor(sizeBytes: number, maxBytes: number);
}
export declare class VideoTooLongError extends AppError {
    constructor(durationSeconds: number, maxSeconds: number);
}
export declare class StickerTooLargeError extends AppError {
    constructor(bytes: number, maxBytes: number);
}
export declare class ProcessingError extends AppError {
    constructor(message: string, userFriendlyMessage?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message: string);
}
export declare class WhatsAppConnectionError extends AppError {
    constructor(message: string);
}
export declare class WhatsAppSendError extends AppError {
    constructor(message: string);
}
