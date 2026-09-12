import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export interface BotSettings {
  isBotActive: boolean;
  autoImage: boolean;
  autoVideo: boolean;
  autoGif: boolean;
  commandsEnabled: boolean;
  autoCropSquare: boolean;
  keepQuality: boolean;
  replyWithAuthor: boolean;
  packName: string;
  authorName: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'bot-settings.json');

class BotStateManager {
  private settings: BotSettings;

  constructor() {
    this.settings = {
      isBotActive: true,
      autoImage: config.AUTO_IMAGE,
      autoVideo: config.AUTO_VIDEO,
      autoGif: config.AUTO_GIF,
      commandsEnabled: config.COMMANDS_ENABLED,
      autoCropSquare: true,
      keepQuality: true,
      replyWithAuthor: true,
      packName: config.STICKER_PACK_NAME,
      authorName: config.STICKER_PACK_AUTHOR,
    };

    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.settings = { ...this.settings, ...parsed };
        logger.info({ settings: this.settings }, 'Configurações do bot carregadas do disco');
      }
    } catch (err) {
      logger.warn({ err }, 'Não foi possível carregar bot-settings.json do disco, usando padrões');
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      logger.error({ err }, 'Erro ao persistir bot-settings.json no disco');
    }
  }

  public isBotActive(): boolean {
    return this.settings.isBotActive;
  }

  public setBotActive(active: boolean): void {
    this.settings.isBotActive = active;
    this.saveToDisk();
    logger.info({ active }, `Bot alterado para: ${active ? 'ATIVO' : 'PAUSADO'}`);
  }

  public toggleBotActive(): boolean {
    this.settings.isBotActive = !this.settings.isBotActive;
    this.saveToDisk();
    logger.info(`Bot alternado para: ${this.settings.isBotActive ? 'ATIVO' : 'PAUSADO'}`);
    return this.settings.isBotActive;
  }

  public getSettings(): BotSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<BotSettings>): BotSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveToDisk();
    logger.info({ updated: partial }, 'Configurações do bot atualizadas com sucesso');
    return this.getSettings();
  }
}

export const botState = new BotStateManager();
