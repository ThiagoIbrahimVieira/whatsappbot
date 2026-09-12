export interface StickerPack {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    stickerIds: string[];
}
export declare class PackManager {
    private packs;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    createPack(name: string, description?: string): StickerPack;
    addStickerToPack(packIdOrName: string, stickerId: string): boolean;
    listPacks(): StickerPack[];
    getPack(packIdOrName: string): StickerPack | undefined;
    removePack(packId: string): boolean;
}
export declare const packManager: PackManager;
