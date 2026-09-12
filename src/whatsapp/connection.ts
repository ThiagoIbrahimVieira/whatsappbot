import makeWASocket, {
  DisconnectReason,
  Browsers,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { initAuth, clearAuth } from './auth.js';
import { messageRouter } from './message-router.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { generateQrArtifacts } from './qr-generator.js';

export interface WhatsAppConnectionState {
  socket: WASocket | null;
  isConnected: boolean;
}

export class WhatsAppConnection {
  private sock: WASocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private isManualShutdown = false;

  /**
   * Inicia ou restabelece a conexão com os servidores do WhatsApp.
   */
  public async connect(): Promise<WASocket> {
    this.isManualShutdown = false;
    const { state, saveCreds } = await initAuth();

    logger.info({ event: 'whatsapp_connecting' }, 'Iniciando conexão com o WhatsApp...');

    // Cria o socket com Baileys usando Pino logger em modo silent/warn para logs internos da lib
    const internalLogger = logger.child({ module: 'baileys' });
    const usePairingCode = Boolean(config.PAIRING_NUMBER && !state.creds.registered);

    this.sock = makeWASocket({
      auth: state,
      logger: internalLogger as any,
      browser: usePairingCode ? Browsers.ubuntu('Chrome') : Browsers.windows('Desktop'),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false, // Não processa mensagens antigas do histórico
    });

    // Se o número para pareamento direto foi informado e o aparelho ainda não foi registrado
    if (usePairingCode) {
      setTimeout(async () => {
        try {
          if (!this.sock || state.creds.registered) return;
          const pairingCode = await this.sock.requestPairingCode(config.PAIRING_NUMBER);
          const formatted = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode;

          console.log('\n=============================================================');
          console.log('🔑 CÓDIGO DE PAREAMENTO DO WHATSAPP GERADO:');
          console.log(`\n                  👉  ${formatted}  👈\n`);
          console.log('📱 Como conectar no seu celular (sem precisar de câmera):');
          console.log('   1. Abra o WhatsApp no seu celular');
          console.log('   2. Toque nos 3 pontinhos (canto superior direito)');
          console.log('   3. Toque em "Aparelhos conectados"');
          console.log('   4. Toque em "Conectar um aparelho"');
          console.log('   5. Toque em "Conectar com número de telefone" no rodapé da tela');
          console.log(`   6. Digite o código de 8 dígitos: ${formatted}`);
          console.log('=============================================================\n');
        } catch (err) {
          logger.error({ err }, 'Erro ao solicitar código de pareamento do WhatsApp');
        }
      }, 3000);
    }

    // Salva as credenciais sempre que forem atualizadas
    this.sock.ev.on('creds.update', saveCreds);

    // Gerencia o ciclo de vida e estado da conexão
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // 1. Exibição do QR Code (apenas se NÃO estiver usando código de pareamento)
      if (qr && !usePairingCode) {
        try {
          const { pngPath, htmlPath } = await generateQrArtifacts(qr);

          console.log('\n=============================================================');
          console.log('📱 ESCANEIE O QR CODE COM O SEU WHATSAPP PESSOAL:');
          console.log('   (WhatsApp > Aparelhos conectados > Conectar um aparelho)');
          console.log('=============================================================');
          console.log(`\n🖼️  ARQUIVO PNG DE ALTA RESOLUÇÃO GERADO EM:`);
          console.log(`    ${pngPath}`);
          console.log(`\n🌐 PÁGINA HTML ABERTA AUTOMATICAMENTE:`);
          console.log(`    ${htmlPath}`);
          console.log('\nAguardando autenticação...\n');
        } catch (err) {
          logger.error({ err }, 'Erro ao gerar artefatos PNG/HTML do QR Code');
          qrcode.generate(qr, { small: true });
        }
      }

      // 2. Conexão estabelecida com sucesso
      if (connection === 'open') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info(
          { event: 'whatsapp_connected' },
          '✅ Conectado com sucesso ao WhatsApp com a sua própria conta!'
        );
        console.log('\n✅ Conexão ativa! Aguardando mídias em conversas privadas...\n');
      }

      // 3. Conexão encerrada
      if (connection === 'close') {
        this.isConnected = false;
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut && !this.isManualShutdown;

        logger.warn(
          {
            event: 'whatsapp_disconnected',
            statusCode,
            reason: lastDisconnect?.error?.message,
            willReconnect: shouldReconnect,
          },
          `Conexão com WhatsApp encerrada (código: ${statusCode || 'desconhecido'})`
        );

        if (statusCode === DisconnectReason.loggedOut) {
          logger.warn(
            '⚠️ A sessão anterior foi desvinculada no celular (código 401). Limpando pasta auth/ automaticamente para iniciar um novo pareamento limpo...'
          );
          await clearAuth();
          this.reconnectAttempts = 0;
          setTimeout(() => {
            this.connect().catch((err) => {
              logger.error({ err }, 'Erro ao reiniciar conexão após limpeza de credenciais');
            });
          }, 1500);
        } else if (shouldReconnect) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectAttempts * 2000, 10000);
          logger.info(`Tentando reconectar em ${delay / 1000}s (tentativa ${this.reconnectAttempts})...`);
          setTimeout(() => {
            this.connect().catch((err) => {
              logger.error({ err }, 'Erro ao tentar reconexão automática');
            });
          }, delay);
        }
      }
    });

    // Escuta novas mensagens recebidas
    this.sock.ev.on('messages.upsert', async (upsert) => {
      // Reage tanto a mensagens de terceiros ('notify') quanto a mensagens enviadas do próprio aparelho ('append')
      if (upsert.type !== 'notify' && upsert.type !== 'append') return;

      for (const msg of upsert.messages) {
        console.log(`📩 Nova mensagem detectada! Chat: ${msg.key?.remoteJid}, De mim: ${msg.key?.fromMe}`);
        try {
          await messageRouter.handleMessage(this.sock!, msg);
        } catch (err) {
          logger.error({ err }, 'Erro não capturado no processamento de mensagem');
        }
      }
    });

    return this.sock;
  }

  /**
   * Encerramento controlado da conexão
   */
  public async disconnect(): Promise<void> {
    this.isManualShutdown = true;
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch {
        // Ignora erro de socket já finalizado
      }
      this.sock = null;
    }
    this.isConnected = false;
  }

  public getSocket(): WASocket | null {
    return this.sock;
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const whatsAppConnection = new WhatsAppConnection();
