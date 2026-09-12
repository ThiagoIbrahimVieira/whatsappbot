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
declare class BotStateManager {
    private settings;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    isBotActive(): boolean;
    setBotActive(active: boolean): void;
    toggleBotActive(): boolean;
    getSettings(): BotSettings;
    updateSettings(partial: Partial<BotSettings>): BotSettings;
}
export declare const botState: BotStateManager;
export {};
