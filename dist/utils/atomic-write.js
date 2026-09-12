import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';
/**
 * Escreve um arquivo em disco de forma atômica (salva primeiro como .tmp e renomeia).
 * Evita que o arquivo seja corrompido em caso de desligamento abrupto ou crash.
 */
export function atomicWriteFileSync(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    try {
        fs.writeFileSync(tempPath, content, 'utf-8');
        fs.renameSync(tempPath, filePath);
    }
    catch (err) {
        logger.error({ err, filePath }, 'Falha na escrita atômica do arquivo');
        try {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
        catch { }
        throw err;
    }
}
/**
 * Lê e parseia um arquivo JSON de forma segura com fallback caso esteja ausente ou corrompido.
 */
export function safeReadJsonSync(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) {
            return fallback;
        }
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (!raw.trim())
            return fallback;
        return JSON.parse(raw);
    }
    catch (err) {
        logger.warn({ err, filePath }, 'Arquivo JSON inválido ou corrompido. Usando fallback seguro');
        return fallback;
    }
}
//# sourceMappingURL=atomic-write.js.map