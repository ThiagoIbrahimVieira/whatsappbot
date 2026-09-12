/**
 * Inicializa e gerencia a autenticação persistente multi-arquivo do Baileys.
 * As credenciais são salvas no diretório /auth (ignorado pelo git).
 */
export declare function initAuth(): Promise<{
    state: import("@whiskeysockets/baileys").AuthenticationState;
    saveCreds: () => Promise<void>;
    authDir: string;
}>;
