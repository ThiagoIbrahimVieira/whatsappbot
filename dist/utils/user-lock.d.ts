/**
 * Gerenciador de travas / fila serial por usuário.
 * Garante que mensagens do mesmo usuário/chat sejam processadas de forma
 * estritamente sequencial, prevenindo condições de corrida e respostas duplicadas.
 */
export declare class UserLock {
    private queues;
    /**
     * Executa uma tarefa assíncrona sob uma trava associada à chave fornecida.
     * Mensagens com a mesma chave aguardam a conclusão da anterior.
     */
    acquire<T>(key: string, task: () => Promise<T> | T): Promise<T>;
    isLocked(key: string): boolean;
    clear(): void;
}
export declare const userLock: UserLock;
