import { randomBytes, randomUUID } from 'node:crypto';

/**
 * Gera um ID único para cada Job de processamento.
 */
export function generateJobId(): string {
  return randomBytes(6).toString('hex');
}

/**
 * Gera um UUID v4 padrão.
 */
export function generateUUID(): string {
  return randomUUID();
}
