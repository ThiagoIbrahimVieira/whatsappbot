import path from 'node:path';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';

export type ProcessingMode = 'interactive' | 'automatic';
export type QualityPreset = 'original' | 'best_quality' | 'small_file' | 'fast' | 'meme';

export interface BotSettings {
  isBotActive: boolean;
  processingMode: ProcessingMode;
  qualityPreset: QualityPreset;
  autoImage: boolean;
  autoVideo: boolean;
  autoGif: boolean;
  commandsEnabled: boolean;
  autoCropSquare: boolean;
  keepQuality: boolean;
  replyWithAuthor: boolean;
  packName: string;
  authorName: string;
  // Fases L, M, O, K:
  partyMode: boolean;
  autoOffMinutes: number; // 0 = never, 30, 60, 180
  scheduleEnabled: boolean;
  scheduleStart: string; // 'HH:MM'
  scheduleEnd: string;   // 'HH:MM'
  developerMode: boolean;
  // Monetização & VIP
  freemiumEnabled: boolean;
  dailyFreeLimit: number;
  vipPriceText: string;
  pixKey: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'bot-settings.json');

const DEFAULT_SETTINGS: BotSettings = {
  isBotActive: true,
  processingMode: 'interactive',
  qualityPreset: 'original',
  autoImage: config.AUTO_IMAGE,
  autoVideo: config.AUTO_VIDEO,
  autoGif: config.AUTO_GIF,
  commandsEnabled: config.COMMANDS_ENABLED,
  autoCropSquare: true,
  keepQuality: true,
  replyWithAuthor: true,
  packName: config.STICKER_PACK_NAME,
  authorName: config.STICKER_PACK_AUTHOR,
  partyMode: false,
  autoOffMinutes: 0,
  scheduleEnabled: false,
  scheduleStart: '08:00',
  scheduleEnd: '22:00',
  developerMode: false,
  freemiumEnabled: true,
  dailyFreeLimit: 5,
  vipPriceText: 'R$ 5,00/mês',
  pixKey: '41496413-db85-4757-8279-c323c8f575e5',
};

class BotStateManager {
  private settings: BotSettings;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') {
      return;
    }
    const diskData = safeReadJsonSync<Partial<BotSettings>>(SETTINGS_FILE, {});
    this.settings = { ...DEFAULT_SETTINGS, ...diskData };
    // Garante que o modo interativo seja sempre o padrão ativo ao iniciar
    this.settings.processingMode = 'interactive';
    this.saveToDisk();
    logger.info({ settings: this.settings }, 'Configurações do bot carregadas do disco');
  }

  private saveToDisk(): void {
    if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') {
      return;
    }
    try {
      atomicWriteFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2));
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

  public getProcessingMode(): ProcessingMode {
    return this.settings.processingMode;
  }

  public setProcessingMode(mode: ProcessingMode): void {
    this.settings.processingMode = mode;
    this.saveToDisk();
    logger.info({ mode }, `Modo de processamento alterado para: ${mode}`);
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
