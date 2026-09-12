import { cleanAllTmp } from './files.js';
import { logger } from './logger.js';
let isShuttingDown = false;
/**
 * Registra listeners para encerramento gracioso e limpeza de recursos temporários.
 */
export function registerCleanupHooks(onShutdownCallback) {
    const handleExit = async (signal) => {
        if (isShuttingDown)
            return;
        isShuttingDown = true;
        logger.info({ signal }, 'Encerrando aplicação e limpando diretórios temporários...');
        try {
            if (onShutdownCallback) {
                await onShutdownCallback();
            }
            await cleanAllTmp();
        }
        catch (err) {
            logger.error({ err }, 'Erro ao realizar limpeza durante encerramento');
        }
        finally {
            process.exit(0);
        }
    };
    process.on('SIGINT', () => handleExit('SIGINT'));
    process.on('SIGTERM', () => handleExit('SIGTERM'));
    process.on('uncaughtException', async (error) => {
        logger.fatal({ err: error }, 'Exceção não tratada capturada (uncaughtException)');
        await cleanAllTmp();
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        logger.error({ reason }, 'Promise rejeitada não tratada (unhandledRejection)');
    });
}
//# sourceMappingURL=cleanup.js.map