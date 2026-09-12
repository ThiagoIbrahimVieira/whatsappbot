import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';

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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LIBRARY_DIR = path.join(DATA_DIR, 'library');
const METADATA_FILE = path.join(DATA_DIR, 'library.json');
const MAX_LIBRARY_ITEMS = 500;

export function maskPhoneNumber(phone: string): string {
  const clean = (phone || '').replace(/\D/g, '');
  if (clean.length < 8) return clean || 'Anônimo';

  // Exemplo: 5511988887777 -> +55 11 9****-7777
  if (clean.length >= 12) {
    const ddi = clean.slice(0, 2);
    const ddd = clean.slice(2, 4);
    const firstDigit = clean.slice(4, 5);
    const lastDigits = clean.slice(-4);
    return `+${ddi} ${ddd} ${firstDigit}****-${lastDigits}`;
  }

  const start = clean.slice(0, 2);
  const end = clean.slice(-3);
  return `${start}****${end}`;
}

export class LibraryManager {
  private items: LibraryItem[] = [];

  constructor() {
    this.ensureDirs();
    this.loadFromDisk();
  }

  private ensureDirs(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LIBRARY_DIR)) {
      fs.mkdirSync(LIBRARY_DIR, { recursive: true });
    }
  }

  private loadFromDisk(): void {
    const diskData = safeReadJsonSync<LibraryItem[]>(METADATA_FILE, []);
    this.items = Array.isArray(diskData) ? diskData : [];
  }

  private saveToDisk(): void {
    try {
      atomicWriteFileSync(METADATA_FILE, JSON.stringify(this.items, null, 2));
    } catch (err) {
      logger.error({ err }, 'Erro ao salvar library.json');
    }
  }

  /**
   * Salva um sticker gerado na biblioteca com deduplicação por hash SHA256.
   */
  public async saveSticker(
    buffer: Buffer,
    meta: {
      mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
      isAnimated: boolean;
      originUser: string;
      operation?: string;
      isFavorite?: boolean;
    }
  ): Promise<LibraryItem> {
    this.ensureDirs();

    // Calcula hash para deduplicação: se o mesmo sticker já existir, atualiza e não duplica arquivo
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const fileName = `${hash}.webp`;
    const filePath = path.join(LIBRARY_DIR, fileName);

    const existingIndex = this.items.findIndex((item) => item.id === hash);
    if (existingIndex >= 0) {
      const existing = this.items[existingIndex];
      if (meta.isFavorite) existing.isFavorite = true;
      this.saveToDisk();
      return existing;
    }

    // Salva arquivo físico WebP
    await fs.promises.writeFile(filePath, buffer);

    const newItem: LibraryItem = {
      id: hash,
      fileName,
      createdAt: Date.now(),
      mediaType: meta.mediaType,
      isAnimated: meta.isAnimated,
      isFavorite: Boolean(meta.isFavorite),
      sizeBytes: buffer.length,
      originUser: maskPhoneNumber(meta.originUser),
      operation: meta.operation || 'sticker',
    };

    this.items.unshift(newItem);

    // Limpeza de excedentes: remove os mais antigos que NÃO são favoritos
    if (this.items.length > MAX_LIBRARY_ITEMS) {
      this.cleanupOldItems();
    }

    this.saveToDisk();
    return newItem;
  }

  private cleanupOldItems(): void {
    const toKeep: LibraryItem[] = [];
    let nonFavCount = 0;
    const maxNonFav = MAX_LIBRARY_ITEMS - 50;

    for (const item of this.items) {
      if (item.isFavorite) {
        toKeep.push(item);
      } else if (nonFavCount < maxNonFav) {
        toKeep.push(item);
        nonFavCount++;
      } else {
        // Exclui arquivo físico
        try {
          const p = path.join(LIBRARY_DIR, item.fileName);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {}
      }
    }
    this.items = toKeep;
  }

  public toggleFavorite(id: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (!item) return false;

    item.isFavorite = !item.isFavorite;
    this.saveToDisk();
    return item.isFavorite;
  }

  public setFavorite(id: string, isFavorite: boolean): boolean {
    const item = this.items.find((i) => i.id === id);
    if (!item) return false;

    item.isFavorite = isFavorite;
    this.saveToDisk();
    return true;
  }

  public getLibrary(filter?: { favoritesOnly?: boolean; packId?: string }): LibraryItem[] {
    let result = [...this.items];
    if (filter?.favoritesOnly) {
      result = result.filter((i) => i.isFavorite);
    }
    if (filter?.packId) {
      result = result.filter((i) => i.packId === filter.packId);
    }
    return result;
  }

  public getItem(id: string): LibraryItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  public async getStickerBuffer(id: string): Promise<Buffer | null> {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;

    const filePath = path.join(LIBRARY_DIR, item.fileName);
    try {
      return await fs.promises.readFile(filePath);
    } catch {
      return null;
    }
  }

  public getRandomSticker(): LibraryItem | null {
    if (this.items.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.items.length);
    return this.items[randomIndex];
  }
}

export const libraryManager = new LibraryManager();
