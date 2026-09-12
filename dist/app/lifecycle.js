import { cleanAllTmp } from '../utils/files.js';
import { whatsappClient } from '../whatsapp/client.js';
import { jobQueue } from '../queue/job-queue.js';
import { webServer } from '../server/web-server.js';
import { logger } from '../utils/logger.js';
/**
 * Gerencia o ciclo de vida e encerramento seguro da aplicação.
 */
export async function shutdownApp() {
    logger.info('Iniciando encerramento gracioso da aplicação...');
    // 1. Limpa jobs pendentes na fila
    jobQueue.clear();
    // 2. Encerra o servidor web
    await webServer.stop();
    // 3. Encerra socket do WhatsApp
    await whatsappClient.stop();
    // 4. Limpa diretórios temporários
    await cleanAllTmp();
    logger.info('Aplicação encerrada com sucesso.');
}
//# sourceMappingURL=lifecycle.js.map