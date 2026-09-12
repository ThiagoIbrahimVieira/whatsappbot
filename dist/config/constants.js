export const CONSTANTS = {
    // Dimensões padrão para figurinhas do WhatsApp
    STICKER_WIDTH: 512,
    STICKER_HEIGHT: 512,
    // Limites oficiais de tamanho do WhatsApp
    // Estático: máximo 100 KB (100 * 1024 bytes)
    STATIC_STICKER_MAX_BYTES: 100 * 1024,
    STATIC_STICKER_TARGET_BYTES: 100 * 1024,
    // Animado: limite oficial de 500 KB (500 * 1024 bytes)
    ANIMATED_STICKER_MAX_BYTES: 500 * 1024,
    // Duração máxima oficial para sticker animado (10 segundos)
    MAX_ANIMATED_DURATION_SECONDS: 10,
    DEFAULT_MAX_ANIMATED_DURATION_SECONDS: 10,
    // Taxa de quadros para WebP animado
    DEFAULT_ANIMATED_FPS: 12,
    MIN_ANIMATED_FPS: 8,
    // Concorrência padrão da fila
    DEFAULT_CONCURRENT_JOBS: 2,
    // Metadados do pacote de figurinhas (EXIF)
    STICKER_PACK_NAME: '𝔗𝔥𝔦𝔞𝔤𝔬 ℑ𝔟𝔯𝔞𝔥𝔦𝔪',
    STICKER_PACK_AUTHOR: '@𝚝𝚑𝚒𝚊𝚐𝚘_𝚙𝚕𝚊𝚢𝚎𝚛𝟾𝟿𝟶',
    // Tempo de retenção de mensagens para prevenção de duplicatas (10 minutos em ms)
    MESSAGE_CACHE_TTL_MS: 10 * 60 * 1000,
    MESSAGE_CACHE_MAX_ITEMS: 1000,
    // Tipos MIME suportados
    SUPPORTED_IMAGE_MIMES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    SUPPORTED_VIDEO_MIMES: ['video/mp4', 'video/3gpp', 'video/quicktime'],
    SUPPORTED_GIF_MIMES: ['image/gif'],
};
//# sourceMappingURL=constants.js.map