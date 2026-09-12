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
//# sourceMappingURL=auth.js.map