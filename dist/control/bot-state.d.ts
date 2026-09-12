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
    partyMode: boolean;
    autoOffMinutes: number;
    scheduleEnabled: boolean;
    scheduleStart: string;
    scheduleEnd: string;
    developerMode: boolean;
}
declare class BotStateManager {
    private settings;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    isBotActive(): boolean;
    setBotActive(active: boolean): void;
    toggleBotActive(): boolean;
    getProcessingMode(): ProcessingMode;
    setProcessingMode(mode: ProcessingMode): void;
    getSettings(): BotSettings;
    updateSettings(partial: Partial<BotSettings>): BotSettings;
}
export declare const botState: BotStateManager;
export {};
