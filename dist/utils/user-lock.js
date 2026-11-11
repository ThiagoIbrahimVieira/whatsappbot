/**
 * Gerenciador de travas / fila serial por usuário.
 * Garante que mensagens do mesmo usuário/chat sejam processadas de forma
 * estritamente sequencial, prevenindo condições de corrida e respostas duplicadas.
 */
export class UserLock {
    queues = new Map();
    /**
     * Executa uma tarefa assíncrona sob uma trava associada à chave fornecida.
     * Mensagens com a mesma chave aguardam a conclusão da anterior.
     */
    async acquire(key, task) {
        if (!key)
            return await task();
        const currentPromise = this.queues.get(key) || Promise.resolve();
        let release;
        const nextPromise = new Promise((resolve) => {
            release = resolve;
        });
        const chained = currentPromise.then(() => { }, () => { }).then(() => nextPromise);
        this.queues.set(key, chained);
        try {
            await currentPromise.catch(() => { });
            return await task();
        }
        finally {
            release();
            if (this.queues.get(key) === chained) {
                this.queues.delete(key);
            }
        }
    }
    isLocked(key) {
        return this.queues.has(key);
    }
    clear() {
        this.queues.clear();
    }
}
export const userLock = new UserLock();
//# sourceMappingURL=user-lock.js.map