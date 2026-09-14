/**
 * Gerenciador de travas / fila serial por usuário.
 * Garante que mensagens do mesmo usuário/chat sejam processadas de forma
 * estritamente sequencial, prevenindo condições de corrida e respostas duplicadas.
 */
export class UserLock {
  private queues = new Map<string, Promise<void>>();

  /**
   * Executa uma tarefa assíncrona sob uma trava associada à chave fornecida.
   * Mensagens com a mesma chave aguardam a conclusão da anterior.
   */
  public async acquire<T>(key: string, task: () => Promise<T> | T): Promise<T> {
    if (!key) return await task();

    const currentPromise = this.queues.get(key) || Promise.resolve();

    let release: () => void;
    const nextPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    const chained = currentPromise.then(() => {}, () => {}).then(() => nextPromise);
    this.queues.set(key, chained);

    try {
      await currentPromise.catch(() => {});
      return await task();
    } finally {
      release!();
      if (this.queues.get(key) === chained) {
        this.queues.delete(key);
      }
    }
  }

  public isLocked(key: string): boolean {
    return this.queues.has(key);
  }

  public clear(): void {
    this.queues.clear();
  }
}

export const userLock = new UserLock();
