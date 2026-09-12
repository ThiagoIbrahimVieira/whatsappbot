import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { cleanAllTmp } from '../utils/files.js';
import { registerCleanupHooks } from '../utils/cleanup.js';
import { getFFmpegPath } from '../media/ffmpeg.js';
import { whatsappClient } from '../whatsapp/client.js';
import { shutdownApp } from './lifecycle.js';

/**
 * Inicialização completa da aplicação.
 */
export async function bootstrap(): Promise<void> {
  console.log('\n=============================================================');
  console.log('🚀 INICIANDO WHATSAPP AUTO STICKER (BOT PESSOAL)');
  console.log('=============================================================\n');

  logger.info({ event: 'app_started', env: config.NODE_ENV }, 'Iniciando WhatsApp Auto Sticker...');

  // 1. Limpeza de resíduos temporários de execuções anteriores
  await cleanAllTmp();

  // 2. Validação antecipada da disponibilidade do FFmpeg
  try {
    const ffmpegPath = await getFFmpegPath();
    logger.info({ ffmpegPath }, 'FFmpeg localizado e pronto para processamento de vídeo e GIF');
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Aviso sobre FFmpeg: vídeos e GIFs podem falhar sem o FFmpeg configurado.');
  }

  // 3. Registra os hooks de encerramento seguro
  registerCleanupHooks(shutdownApp);

  // 4. Inicia a conexão com o WhatsApp
  await whatsappClient.start();
}
