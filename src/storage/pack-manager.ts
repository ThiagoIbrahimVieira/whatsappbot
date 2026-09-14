import path from 'node:path';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';
import { libraryManager } from './library-manager.js';

export interface StickerPack {
  id: string;
  name: string;
  description?: string;
  ownerPhone?: string;
  isDefault?: boolean;
  createdAt: number;
  stickerIds: string[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PACKS_FILE = path.join(DATA_DIR, 'packs.json');

function cleanPhone(phone?: string): string {
  return (phone || '').replace(/\D/g, '');
}

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

  /**
   * Obtém ou cria o pack principal/padrão de um usuário.
   */
  public getOrCreateDefaultPack(userPhone: string): StickerPack {
    const clean = cleanPhone(userPhone);
    const existing = this.packs.find(
      (p) => cleanPhone(p.ownerPhone) === clean && (p.isDefault || p.name.toLowerCase() === 'meu pack')
    );

    if (existing) {
      return existing;
    }

    const id = `pack_${clean ? clean.slice(-4) : 'usr'}_${Date.now().toString(36)}`;
    const defaultPack: StickerPack = {
      id,
      name: 'Meu Pack',
      description: 'Pack pessoal de figurinhas salvas',
      ownerPhone: clean || 'default',
      isDefault: true,
      createdAt: Date.now(),
      stickerIds: [],
    };

    this.packs.push(defaultPack);
    this.saveToDisk();
    return defaultPack;
  }

  /**
   * Lista todos os packs pertencentes ao usuário (cria o padrão caso ainda não exista).
   */
  public getUserPacks(userPhone: string): StickerPack[] {
    const clean = cleanPhone(userPhone);
    const defaultPack = this.getOrCreateDefaultPack(userPhone);

    const userPacks = this.packs.filter(
      (p) => cleanPhone(p.ownerPhone) === clean || (!p.ownerPhone && p.id === defaultPack.id)
    );

    // Garante que o padrão esteja presente na lista
    if (!userPacks.some((p) => p.id === defaultPack.id)) {
      userPacks.unshift(defaultPack);
    }

    return userPacks;
  }

  /**
   * Cria um novo álbum/pack para o usuário ou global.
   */
  public createPack(name: string, userPhone?: string, description?: string): StickerPack {
    const trimmed = name.trim();
    const clean = cleanPhone(userPhone);

    // Verifica se já existe um pack com esse nome para este usuário
    const existing = this.packs.find(
      (p) =>
        p.name.toLowerCase() === trimmed.toLowerCase() &&
        (clean ? cleanPhone(p.ownerPhone) === clean : !p.ownerPhone)
    );
    if (existing) {
      return existing;
    }

    const id = `pack_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newPack: StickerPack = {
      id,
      name: trimmed,
      description: description?.trim(),
      ownerPhone: clean || undefined,
      isDefault: false,
      createdAt: Date.now(),
      stickerIds: [],
    };

    this.packs.push(newPack);
    this.saveToDisk();
    return newPack;
  }

  /**
   * Adiciona um sticker a um pack (por padrão, o 'Meu Pack' do usuário).
   */
  public addStickerToPack(packIdOrName: string, stickerId: string, userPhone?: string): { success: boolean; pack: StickerPack } {
    const clean = cleanPhone(userPhone);
    let pack: StickerPack | undefined;

    if (!packIdOrName || packIdOrName === 'default' || packIdOrName.toLowerCase() === 'meu pack') {
      pack = this.getOrCreateDefaultPack(userPhone || '');
    } else {
      pack = this.packs.find(
        (p) =>
          (p.id === packIdOrName || p.name.toLowerCase() === packIdOrName.toLowerCase()) &&
          (!clean || !p.ownerPhone || cleanPhone(p.ownerPhone) === clean)
      );
    }

    if (!pack) {
      pack = this.getOrCreateDefaultPack(userPhone || '');
    }

    if (!pack.stickerIds.includes(stickerId)) {
      pack.stickerIds.push(stickerId);
      this.saveToDisk();
    }

    return { success: true, pack };
  }

  /**
   * Busca um pack por ID ou Nome (do usuário ou público).
   */
  public getPack(packIdOrName: string, userPhone?: string): StickerPack | undefined {
    const clean = cleanPhone(userPhone);
    const trimmed = packIdOrName.trim().toLowerCase();

    // 1. Tenta encontrar pack do usuário
    if (clean) {
      const userPack = this.packs.find(
        (p) =>
          cleanPhone(p.ownerPhone) === clean &&
          (p.id.toLowerCase() === trimmed || p.name.toLowerCase() === trimmed)
      );
      if (userPack) return userPack;
    }

    // 2. Busca por ID exato ou nome global
    return this.packs.find(
      (p) => p.id.toLowerCase() === trimmed || p.name.toLowerCase() === trimmed
    );
  }

  /**
   * Retorna os buffers das figurinhas contidas no pack para envio no WhatsApp.
   */
  public async getStickerBuffersForPack(
    packId: string
  ): Promise<Array<{ id: string; buffer: Buffer; isAnimated: boolean }>> {
    const pack = this.getPack(packId);
    if (!pack || pack.stickerIds.length === 0) return [];

    const results: Array<{ id: string; buffer: Buffer; isAnimated: boolean }> = [];
    for (const stickerId of pack.stickerIds) {
      const buffer = await libraryManager.getStickerBuffer(stickerId);
      const item = libraryManager.getItem(stickerId);
      if (buffer) {
        results.push({
          id: stickerId,
          buffer,
          isAnimated: Boolean(item?.isAnimated),
        });
      }
    }
    return results;
  }

  /**
   * Remove todas as figurinhas de um pack.
   */
  public clearPack(packId: string, userPhone?: string): boolean {
    const pack = this.getPack(packId, userPhone);
    if (!pack) return false;

    pack.stickerIds = [];
    this.saveToDisk();
    return true;
  }

  /**
   * Exclui um pack.
   */
  public removePack(packId: string, userPhone?: string): boolean {
    const clean = cleanPhone(userPhone);
    const initialLen = this.packs.length;

    this.packs = this.packs.filter(
      (p) =>
        p.id !== packId ||
        (clean && p.ownerPhone && cleanPhone(p.ownerPhone) !== clean)
    );

    if (this.packs.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public listPacks(): StickerPack[] {
    return [...this.packs];
  }
}

export interface PendingPackCreation {
  chatId: string;
  timestamp: number;
}

export const pendingPackCreation = new Map<string, PendingPackCreation>();

export const packManager = new PackManager();

