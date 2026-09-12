import path from 'node:path';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const PACKS_FILE = path.join(DATA_DIR, 'packs.json');
export class PackManager {
    packs = [];
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        const diskData = safeReadJsonSync(PACKS_FILE, []);
        this.packs = Array.isArray(diskData) ? diskData : [];
    }
    saveToDisk() {
        try {
            atomicWriteFileSync(PACKS_FILE, JSON.stringify(this.packs, null, 2));
        }
        catch (err) {
            logger.error({ err }, 'Erro ao salvar packs.json');
        }
    }
    createPack(name, description) {
        const trimmed = name.trim();
        const existing = this.packs.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
            return existing;
        }
        const id = `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newPack = {
            id,
            name: trimmed,
            description: description?.trim(),
            createdAt: Date.now(),
            stickerIds: [],
        };
        this.packs.push(newPack);
        this.saveToDisk();
        return newPack;
    }
    addStickerToPack(packIdOrName, stickerId) {
        const pack = this.packs.find((p) => p.id === packIdOrName || p.name.toLowerCase() === packIdOrName.toLowerCase());
        if (!pack)
            return false;
        if (!pack.stickerIds.includes(stickerId)) {
            pack.stickerIds.push(stickerId);
            this.saveToDisk();
        }
        return true;
    }
    listPacks() {
        return [...this.packs];
    }
    getPack(packIdOrName) {
        return this.packs.find((p) => p.id === packIdOrName || p.name.toLowerCase() === packIdOrName.toLowerCase());
    }
    removePack(packId) {
        const initialLen = this.packs.length;
        this.packs = this.packs.filter((p) => p.id !== packId);
        if (this.packs.length !== initialLen) {
            this.saveToDisk();
            return true;
        }
        return false;
    }
}
export const packManager = new PackManager();
//# sourceMappingURL=pack-manager.js.map