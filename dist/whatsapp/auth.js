import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import path from 'node:path';
import fs from 'node:fs/promises';
import { logger } from '../utils/logger.js';
const AUTH_DIR = path.resolve(process.cwd(), 'auth');
/**
 * Inicializa e gerencia a autenticação persistente multi-arquivo do Baileys.
 * As credenciais são salvas no diretório /auth (ignorado pelo git).
 */
export async function initAuth() {
    await fs.mkdir(AUTH_DIR, { recursive: true });
    logger.debug({ authDir: AUTH_DIR }, 'Carregando estado de autenticação persistente...');
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    return {
        state,
        saveCreds,
        authDir: AUTH_DIR,
    };
}
/**
 * Remove todas as credenciais antigas ou revogadas da pasta auth/
 */
export async function clearAuth() {
    try {
        const entries = await fs.readdir(AUTH_DIR);
        for (const entry of entries) {
            await fs.rm(path.join(AUTH_DIR, entry), { recursive: true, force: true });
        }
        logger.info('🧹 Credenciais antigas de auth/ removidas com sucesso.');
    }
    catch (err) {
        logger.warn({ err }, 'Aviso ao limpar pasta auth/');
    }
}
//# sourceMappingURL=auth.js.map