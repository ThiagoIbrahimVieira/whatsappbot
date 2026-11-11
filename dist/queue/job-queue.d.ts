import { EventEmitter } from 'node:events';
import type { Job, JobWorker, QueueStats } from './job-types.js';
import type { ProcessingResult } from '../types/media.js';
export declare class JobQueue extends EventEmitter {
    private queue;
    private activeJobs;
    private readonly maxConcurrency;
    private completedCount;
    private failedCount;
    private readonly startedAt;
    constructor(maxConcurrency?: number);
    /**
     * Adiciona um job na fila e retorna uma Promise resolvida quando o processamento terminar.
     */
    enqueue(job: Job, worker: JobWorker<ProcessingResult>): Promise<ProcessingResult>;
    /**
     * Processa o próximo item se houver capacidade de concorrência disponível.
     */
    private processNext;
    /**
     * Retorna estatísticas de execução da fila.
     */
    getStats(): QueueStats & {
        uptimeSeconds: number;
    };
    /**
     * Limpa a fila cancelando itens pendentes
     */
    clear(): void;
}
export declare const jobQueue: JobQueue;
