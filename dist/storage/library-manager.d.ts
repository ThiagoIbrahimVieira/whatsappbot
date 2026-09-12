export interface LibraryItem {
    id: string;
    fileName: string;
    createdAt: number;
    mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
    isAnimated: boolean;
    isFavorite: boolean;
    packId?: string;
    sizeBytes: number;
    originUser: string;
    operation?: string;
}
export declare function maskPhoneNumber(phone: string): string;
export declare class LibraryManager {
    private items;
    constructor();
    private ensureDirs;
    private loadFromDisk;
    private saveToDisk;
    /**
     * Salva um sticker gerado na biblioteca com deduplicação por hash SHA256.
     */
    saveSticker(buffer: Buffer, meta: {
        mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
        isAnimated: boolean;
        originUser: string;
        operation?: string;
        isFavorite?: boolean;
    }): Promise<LibraryItem>;
    private cleanupOldItems;
    toggleFavorite(id: string): boolean;
    setFavorite(id: string, isFavorite: boolean): boolean;
    getLibrary(filter?: {
        favoritesOnly?: boolean;
        packId?: string;
    }): LibraryItem[];
    getItem(id: string): LibraryItem | undefined;
    getStickerBuffer(id: string): Promise<Buffer | null>;
    getRandomSticker(): LibraryItem | null;
}
export declare const libraryManager: LibraryManager;
