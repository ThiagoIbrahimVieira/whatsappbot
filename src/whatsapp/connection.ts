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
import { generateQrArtifacts, getQrSvg } from './qr-generator.js';
import { messageContentStore } from '../utils/cache.js';

export interface WhatsAppConnectionState {
  socket: WASocket | null;
  isConnected: boolean;
}

export class WhatsAppConnection {
  private sock: WASocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private isManualShutdown = false;
  private currentPairingCode: string | null = null;
  private currentQr: string | null = null;

  public getAuthInfo() {
    return {
      isConnected: this.isConnected,
      pairingCode: this.currentPairingCode,
      qr: this.currentQr,
      qrSvg: this.currentQr ? getQrSvg(this.currentQr) : null,
      pairingNumberConfigured: config.PAIRING_NUMBER || null,
    };
  }

  public async requestPairingForNumber(phoneNumber: string): Promise<string> {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 10) {
      throw new Error('Número de telefone inválido. Digite com DDD e DDI (ex: 5511999998888)');
    }
    if (!this.sock) {
      throw new Error('WhatsApp não está pronto. Aguarde o bot inicializar.');
    }
    const pairingCode = await this.sock.requestPairingCode(cleanNumber);
    const formatted = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode;
    this.currentPairingCode = formatted;
    logger.info({ pairingCode: formatted }, 'Código de pareamento gerado manualmente');
    return formatted;
  }

  public async resetAuth(): Promise<void> {
    logger.info('Resetando credenciais e reiniciando pareamento...');
    await this.disconnect();
    await clearAuth();
    this.currentPairingCode = null;
    this.currentQr = null;
    this.reconnectAttempts = 0;
    await this.connect();
  }

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
      getMessage: async (key) => {
        return messageContentStore.get(key.id || '');
      },
    });

    // Se o número para pareamento direto foi informado e o aparelho ainda não foi registrado
    if (usePairingCode) {
      const requestWithRetry = async (attempt = 1) => {
        try {
          if (!this.sock || state.creds.registered) return;
          const pairingCode = await this.sock.requestPairingCode(config.PAIRING_NUMBER);
          const formatted = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode;
          this.currentPairingCode = formatted;

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
        } catch (err: any) {
          logger.warn({ attempt, err: err?.message }, 'Tentativa de solicitar código de pareamento');
          if (attempt < 4 && !state.creds.registered) {
            setTimeout(() => requestWithRetry(attempt + 1), 3000 * attempt);
          }
        }
      };
      setTimeout(() => requestWithRetry(1), 3000);
    }

    // Salva as credenciais sempre que forem atualizadas
    this.sock.ev.on('creds.update', saveCreds);

    // Gerencia o ciclo de vida e estado da conexão
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // 1. Exibição do QR Code (apenas se NÃO estiver usando código de pareamento)
      if (qr && !usePairingCode) {
        this.currentQr = qr;
        try {
          const { pngPath, htmlPath } = await generateQrArtifacts(qr);

          console.log('\n=============================================================');
          console.log('📱 ESCANEIE O QR CODE COM O SEU WHATSAPP:');
          console.log('   (WhatsApp > Aparelhos conectados > Conectar um aparelho)');
          console.log('=============================================================');
          console.log(`🖼️  PNG: ${pngPath}`);
          console.log(`🌐 HTML: ${htmlPath}`);
        } catch (err) {
          logger.error({ err }, 'Erro ao gerar artefatos PNG/HTML do QR Code');
        }

        // SEMPRE imprime o QR no terminal para visualização direta no Termux
        console.log('\n📱 Ou escaneie diretamente aqui pelo terminal:');
        qrcode.generate(qr, { small: true });
        console.log('\nAguardando autenticação...\n');
      }

      // 2. Conexão estabelecida com sucesso
      if (connection === 'open') {
        this.isConnected = true;
        this.currentPairingCode = null;
        this.currentQr = null;
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

        const errorMessage = lastDisconnect?.error?.message || '';
        const errorData = (lastDisconnect?.error as any)?.data;
        const isConflict =
          statusCode === DisconnectReason.connectionReplaced ||
          statusCode === 440 ||
          errorMessage.includes('conflict') ||
          errorMessage.includes('replaced') ||
          errorData?.tag === 'conflict';

        if (isConflict) {
          logger.warn(
            '⚠️ Conexão substituída por outra instância (Stream Errored conflict: replaced). Reconexão automática abortada para evitar loop.'
          );
          console.log(
            '\n⚠️ ATENÇÃO: O WhatsApp desconectou porque outra janela ou processo do bot acabou de conectar com a mesma conta!'
          );
          console.log(
            'Para resolver e deixar apenas UM bot rodando, feche as outras janelas do Termux ou rode: ./scripts/android/stop-bot.sh\n'
          );
          return;
        }

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
        if (msg.key?.id && msg.message) {
          messageContentStore.set(msg.key.id, msg.message);
        }
        console.log(`📩 Nova mensagem detectada! Chat: ${msg.key?.remoteJid}, De mim: ${msg.key?.fromMe}`);
        try {
          await messageRouter.handleMessage(this.sock!, msg);
        } catch (err) {
          logger.error({ err }, 'Erro não capturado no processamento de mensagem');
        }
      }
    });

    // Escuta atualizações de mensagens (especialmente votos em enquetes/botões interativos)
    this.sock.ev.on('messages.update', async (updates) => {
      for (const update of updates) {
        if (update.update?.pollUpdates) {
          try {
            await messageRouter.handlePollUpdate(this.sock!, update);
          } catch (err) {
            logger.error({ err }, 'Erro ao processar voto de enquete interativa');
          }
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
