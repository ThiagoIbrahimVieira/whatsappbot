import path from 'node:path';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';

export interface StickerPack {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  stickerIds: string[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PACKS_FILE = path.join(DATA_DIR, 'packs.json');

export class PackManager {
  private packs: StickerPack[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    const diskData = safeReadJsonSync<StickerPack[]>(PACKS_FILE, []);
    this.packs = Array.isArray(diskData) ? diskData : [];
  }

  private saveToDisk(): void {
    try {
      atomicWriteFileSync(PACKS_FILE, JSON.stringify(this.packs, null, 2));
    } catch (err) {
      logger.error({ err }, 'Erro ao salvar packs.json');
    }
  }

  public createPack(name: string, description?: string): StickerPack {
    const trimmed = name.trim();
    const existing = this.packs.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return existing;
    }

    const id = `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPack: StickerPack = {
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

  public addStickerToPack(packIdOrName: string, stickerId: string): boolean {
    const pack = this.packs.find(
      (p) => p.id === packIdOrName || p.name.toLowerCase() === packIdOrName.toLowerCase()
    );
    if (!pack) return false;

    if (!pack.stickerIds.includes(stickerId)) {
      pack.stickerIds.push(stickerId);
      this.saveToDisk();
    }
    return true;
  }

  public listPacks(): StickerPack[] {
    return [...this.packs];
  }

  public getPack(packIdOrName: string): StickerPack | undefined {
    return this.packs.find(
      (p) => p.id === packIdOrName || p.name.toLowerCase() === packIdOrName.toLowerCase()
    );
  }

  public removePack(packId: string): boolean {
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
