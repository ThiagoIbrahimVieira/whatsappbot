const SUPPORTED_COMMANDS = new Set([
    'help',
    'sticker',
    's',
    'static',
    'video',
    'gif',
    'info',
    'status',
    'ping',
]);
/**
 * Faz o parsing de um texto para identificar se contém um comando válido.
 */
export function parseCommand(text) {
    if (!text || typeof text !== 'string') {
        return { name: '', args: [], rawText: '', isCommand: false };
    }
    const trimmed = text.trim();
    if (!trimmed.startsWith('/') && !trimmed.startsWith('!')) {
        return { name: '', args: [], rawText: trimmed, isCommand: false };
    }
    // Divide por espaços mantendo argumentos
    const parts = trimmed.slice(1).trim().split(/\s+/);
    const rawCommand = parts[0]?.toLowerCase() || '';
    const args = parts.slice(1);
    const isSupported = SUPPORTED_COMMANDS.has(rawCommand);
    return {
        name: rawCommand,
        args,
        rawText: trimmed,
        isCommand: isSupported || rawCommand.length > 0,
    };
}
export { SUPPORTED_COMMANDS };
//# sourceMappingURL=command-parser.js.map