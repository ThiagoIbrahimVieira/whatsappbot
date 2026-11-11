import type { ParsedCommand } from '../types/command.js';
declare const SUPPORTED_COMMANDS: Set<string>;
/**
 * Faz o parsing de um texto para identificar se contém um comando válido.
 */
export declare function parseCommand(text?: string | null): ParsedCommand;
export { SUPPORTED_COMMANDS };
