export interface StickerPack {
    id: string;
    name: string;
    description?: string;
    ownerPhone?: string;
    isDefault?: boolean;
    createdAt: number;
    stickerIds: string[];
}
export declare class PackManager {
    private packs;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    /**
     * Obtém ou cria o pack principal/padrão de um usuário.
     */
    getOrCreateDefaultPack(userPhone: string): StickerPack;
    /**
     * Lista todos os packs pertencentes ao usuário (cria o padrão caso ainda não exista).
     */
    getUserPacks(userPhone: string): StickerPack[];
    /**
     * Cria um novo álbum/pack para o usuário ou global.
     */
    createPack(name: string, userPhone?: string, description?: string): StickerPack;
    /**
     * Adiciona um sticker a um pack (por padrão, o 'Meu Pack' do usuário).
     */
    addStickerToPack(packIdOrName: string, stickerId: string, userPhone?: string): {
        success: boolean;
        pack: StickerPack;
    };
    /**
     * Busca um pack por ID ou Nome (do usuário ou público).
     */
    getPack(packIdOrName: string, userPhone?: string): StickerPack | undefined;
    /**
     * Retorna os buffers das figurinhas contidas no pack para envio no WhatsApp.
     */
    getStickerBuffersForPack(packId: string): Promise<Array<{
        id: string;
        buffer: Buffer;
        isAnimated: boolean;
    }>>;
    /**
     * Remove todas as figurinhas de um pack.
     */
    clearPack(packId: string, userPhone?: string): boolean;
    /**
     * Exclui um pack.
     */
    removePack(packId: string, userPhone?: string): boolean;
    listPacks(): StickerPack[];
}
export interface PendingPackCreation {
    chatId: string;
    timestamp: number;
}
export declare const pendingPackCreation: Map<string, PendingPackCreation>;
export declare const packManager: PackManager;
