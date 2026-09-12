import path from 'node:path';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'bot-settings.json');
const DEFAULT_SETTINGS = {
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
};
class BotStateManager {
    settings;
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.loadFromDisk();
    }
    loadFromDisk() {
        if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') {
            return;
        }
        const diskData = safeReadJsonSync(SETTINGS_FILE, {});
        this.settings = { ...DEFAULT_SETTINGS, ...diskData };
        logger.info({ settings: this.settings }, 'Configurações do bot carregadas do disco');
    }
    saveToDisk() {
        if (config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') {
            return;
        }
        try {
            atomicWriteFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2));
        }
        catch (err) {
            logger.error({ err }, 'Erro ao persistir bot-settings.json no disco');
        }
    }
    isBotActive() {
        return this.settings.isBotActive;
    }
    setBotActive(active) {
        this.settings.isBotActive = active;
        this.saveToDisk();
        logger.info({ active }, `Bot alterado para: ${active ? 'ATIVO' : 'PAUSADO'}`);
    }
    toggleBotActive() {
        this.settings.isBotActive = !this.settings.isBotActive;
        this.saveToDisk();
        logger.info(`Bot alternado para: ${this.settings.isBotActive ? 'ATIVO' : 'PAUSADO'}`);
        return this.settings.isBotActive;
    }
    getProcessingMode() {
        return this.settings.processingMode;
    }
    setProcessingMode(mode) {
        this.settings.processingMode = mode;
        this.saveToDisk();
        logger.info({ mode }, `Modo de processamento alterado para: ${mode}`);
    }
    getSettings() {
        return { ...this.settings };
    }
    updateSettings(partial) {
        this.settings = { ...this.settings, ...partial };
        this.saveToDisk();
        logger.info({ updated: partial }, 'Configurações do bot atualizadas com sucesso');
        return this.getSettings();
    }
}
export const botState = new BotStateManager();
//# sourceMappingURL=bot-state.js.map