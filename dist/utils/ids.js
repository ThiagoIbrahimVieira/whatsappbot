import { randomBytes, randomUUID } from 'node:crypto';
/**
 * Gera um ID único para cada Job de processamento.
 */
export function generateJobId() {
    return randomBytes(6).toString('hex');
}
/**
 * Gera um UUID v4 padrão.
 */
export function generateUUID() {
    return randomUUID();
}
//# sourceMappingURL=ids.js.map