import pino from 'pino';
import { config } from '../config/config.js';
const isDev = config.NODE_ENV === 'development';
const isTest = config.NODE_ENV === 'test';
export const logger = pino({
    level: isTest ? 'silent' : config.LOG_LEVEL,
    transport: isDev && !isTest
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: {
        service: 'whatsapp-auto-sticker',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});
//# sourceMappingURL=logger.js.map