import { z } from 'zod';
const booleanString = (defaultValue) => z
    .union([z.boolean(), z.string()])
    .default(defaultValue)
    .transform((val, ctx) => {
    if (typeof val === 'boolean')
        return val;
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes')
        return true;
    if (lower === 'false' || lower === '0' || lower === 'no')
        return false;
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Valor booleano inválido: "${val}". Esperado 'true' ou 'false'`,
    });
    return z.NEVER;
});
export const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    // Automação geral e específica
    AUTO_STICKER: booleanString(true),
    AUTO_IMAGE: booleanString(true),
    AUTO_VIDEO: booleanString(true),
    AUTO_GIF: booleanString(true),
    // Regras de filtragem
    IGNORE_GROUPS: booleanString(true).refine((val) => val === true, {
        message: 'IGNORE_GROUPS deve ser sempre true na V1 por razões de segurança e arquitetura',
    }),
    IGNORE_OWN_MESSAGES: booleanString(true),
    // Comandos manuais
    COMMANDS_ENABLED: booleanString(true),
    // Limites de tamanho de entrada (MB)
    MAX_IMAGE_SIZE_MB: z.coerce
        .number()
        .positive('MAX_IMAGE_SIZE_MB deve ser um número positivo')
        .default(10),
    MAX_VIDEO_SIZE_MB: z.coerce
        .number()
        .positive('MAX_VIDEO_SIZE_MB deve ser um número positivo')
        .default(20),
    MAX_GIF_SIZE_MB: z.coerce
        .number()
        .positive('MAX_GIF_SIZE_MB deve ser um número positivo')
        .default(20),
    // Duração máxima para vídeo (segundos)
    MAX_VIDEO_DURATION_SECONDS: z.coerce
        .number()
        .positive('MAX_VIDEO_DURATION_SECONDS deve ser positivo')
        .max(60, 'MAX_VIDEO_DURATION_SECONDS não deve exceder 60s para stickers')
        .default(10),
    // Concorrência máxima da fila
    MAX_CONCURRENT_JOBS: z.coerce
        .number()
        .int('MAX_CONCURRENT_JOBS deve ser um número inteiro')
        .min(1, 'MAX_CONCURRENT_JOBS deve ser pelo menos 1')
        .max(10, 'MAX_CONCURRENT_JOBS não deve exceder 10 para evitar sobrecarga de CPU')
        .default(2),
    // Modo de corte
    VIDEO_TRIM_MODE: z.enum(['first']).default('first'),
    // Nível de log
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
        .default('info'),
    // Caminho do executável FFmpeg customizado (opcional)
    FFMPEG_PATH: z
        .string()
        .transform((s) => s.trim())
        .optional()
        .default(''),
    // Número para pareamento direto por código (ex: 5511999998888) - dispensa QR Code
    PAIRING_NUMBER: z
        .string()
        .transform((val) => val.replace(/\D/g, ''))
        .refine((val) => val === '' || (val.length >= 10 && val.length <= 15), {
        message: 'PAIRING_NUMBER deve ser um número de telefone com DDI e DDD (ex: 5511999998888)',
    })
        .optional()
        .default(''),
});
//# sourceMappingURL=schema.js.map