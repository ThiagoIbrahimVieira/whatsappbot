/**
 * Registra listeners para encerramento gracioso e limpeza de recursos temporários.
 */
export declare function registerCleanupHooks(onShutdownCallback?: () => Promise<void>): void;
