import os from 'node:os';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { cleanAllTmp } from '../utils/files.js';
import { registerCleanupHooks } from '../utils/cleanup.js';
import { getFFmpegPath } from '../media/ffmpeg.js';
import { whatsappClient } from '../whatsapp/client.js';
import { shutdownApp } from './lifecycle.js';
import { webServer } from '../server/web-server.js';

function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

/**
 * Inicialização completa da aplicação.
 */
export async function bootstrap(): Promise<void> {
  console.log('\n=============================================================');
  console.log('🚀 INICIANDO BOT — 𝔗𝔥𝔦𝔞𝔤𝔬 ℑ𝔟𝔯𝔞𝔥𝔦𝔪 | @𝚝𝚑𝚒𝚊𝚐𝚘_𝚙𝚕𝚊𝚢𝚎𝚛𝟾𝟿𝟶');
  console.log('=============================================================\n');

  logger.info({ event: 'app_started', env: config.NODE_ENV }, 'Iniciando bot 𝔗𝔥𝔦𝔞𝔤𝔬 ℑ𝔟𝔯𝔞𝔥𝔦𝔪...');

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

  // 4. Inicia o servidor HTTP e API REST da Web GUI
  try {
    const port = await webServer.start(config.WEB_PORT, config.WEB_HOST);
    const ips = getLocalIpAddresses();
    console.log('-------------------------------------------------------------');
    console.log(`🌐 PAINEL DE CONTROLE WEB:`);
    console.log(`   👉 No celular (mesmo aparelho):  http://localhost:${port}`);
    if (ips.length > 0) {
      for (const ip of ips) {
        console.log(`   👉 No PC / outro aparelho (Wi-Fi): http://${ip}:${port}`);
      }
    } else {
      console.log(`   👉 No PC / outro aparelho:         http://<IP_DO_CELULAR>:${port}`);
    }
    console.log('-------------------------------------------------------------\n');
  } catch (err) {
    logger.error({ err }, 'Não foi possível iniciar o servidor HTTP da Web GUI');
  }

  // 5. Inicia a conexão com o WhatsApp
  await whatsappClient.start();
}

