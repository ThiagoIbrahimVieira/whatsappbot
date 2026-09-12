import fs from 'node:fs/promises';
import path from 'node:path';

const TMP_BASE_DIR = path.resolve(process.cwd(), 'tmp');

/**
 * Garante que a pasta base de temporários existe.
 */
export async function ensureTmpDir(): Promise<string> {
  await fs.mkdir(TMP_BASE_DIR, { recursive: true });
  return TMP_BASE_DIR;
}

/**
 * Cria uma subpasta temporária isolada para um job específico.
 */
export async function createJobDir(jobId: string): Promise<string> {
  // Evita path traversal garantindo que o jobId contenha apenas caracteres alfanuméricos seguros
  const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, '');
  const jobDir = path.join(TMP_BASE_DIR, safeJobId);
  await fs.mkdir(jobDir, { recursive: true });
  return jobDir;
}

/**
 * Remove com segurança uma pasta temporária de job.
 */
export async function removeJobDir(jobDir: string): Promise<void> {
  try {
    // Validação de segurança: apenas diretórios dentro de TMP_BASE_DIR podem ser apagados
    const resolved = path.resolve(jobDir);
    if (!resolved.startsWith(TMP_BASE_DIR) || resolved === TMP_BASE_DIR) {
      return;
    }
    await fs.rm(resolved, { recursive: true, force: true });
  } catch {
    // Falha silenciosa na remoção secundária para não interromper o fluxo principal
  }
}

/**
 * Limpa todos os temporários remanescentes (útil no bootstrap da aplicação).
 */
export async function cleanAllTmp(): Promise<void> {
  try {
    await fs.rm(TMP_BASE_DIR, { recursive: true, force: true });
    await fs.mkdir(TMP_BASE_DIR, { recursive: true });
  } catch {
    // Ignora erro se pasta ainda não existir
  }
}

/**
 * Obtém o tamanho de um arquivo em bytes.
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stat = await fs.stat(filePath);
  return stat.size;
}
