import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createJobDir, removeJobDir, cleanAllTmp } from '../../src/utils/files.js';
import { RecentMessagesCache } from '../../src/utils/cache.js';

describe('File and Cleanup Utilities', () => {
  beforeEach(async () => {
    await cleanAllTmp();
  });

  afterEach(async () => {
    await cleanAllTmp();
  });

  it('deve criar e remover pasta temporária isolada para um job', async () => {
    const jobId = 'testjob123';
    const jobDir = await createJobDir(jobId);

    expect(jobDir).toContain(jobId);

    const existsBefore = await fs
      .access(jobDir)
      .then(() => true)
      .catch(() => false);
    expect(existsBefore).toBe(true);

    // Cria um arquivo fictício dentro
    const testFile = path.join(jobDir, 'input.jpg');
    await fs.writeFile(testFile, 'dummy data');

    // Remove
    await removeJobDir(jobDir);

    const existsAfter = await fs
      .access(jobDir)
      .then(() => true)
      .catch(() => false);
    expect(existsAfter).toBe(false);
  });

  it('deve sanitizar jobId contra path traversal', async () => {
    const maliciousId = '../../etc/passwd';
    const jobDir = await createJobDir(maliciousId);

    // O caminho final deve conter apenas caracteres alfanuméricos seguros dentro de tmp
    expect(jobDir).not.toContain('..');
    expect(jobDir).toContain('etcpasswd');
    await removeJobDir(jobDir);
  });
});

describe('RecentMessagesCache', () => {
  it('deve armazenar e recuperar IDs de mensagens para evitar duplicatas', () => {
    const cache = new RecentMessagesCache(1000, 10);

    expect(cache.has('msg-1')).toBe(false);
    cache.add('msg-1');
    expect(cache.has('msg-1')).toBe(true);
    expect(cache.size).toBe(1);
  });

  it('deve respeitar limite máximo descartando as mais antigas', () => {
    const cache = new RecentMessagesCache(10000, 2);

    cache.add('msg-1');
    cache.add('msg-2');
    cache.add('msg-3');

    expect(cache.has('msg-1')).toBe(false);
    expect(cache.has('msg-2')).toBe(true);
    expect(cache.has('msg-3')).toBe(true);
    expect(cache.size).toBe(2);
  });
});
