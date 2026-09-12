import { EventEmitter } from 'node:events';
import type { Job, JobWorker, QueueStats } from './job-types.js';
import type { ProcessingResult } from '../types/media.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

interface QueuedItem {
  job: Job;
  worker: JobWorker<ProcessingResult>;
  resolve: (res: ProcessingResult) => void;
  reject: (err: unknown) => void;
}

export class JobQueue extends EventEmitter {
  private queue: QueuedItem[] = [];
  private activeJobs = new Map<string, Job>();
  private readonly maxConcurrency: number;

  private completedCount = 0;
  private failedCount = 0;
  private readonly startedAt: number = Date.now();

  constructor(maxConcurrency: number = config.MAX_CONCURRENT_JOBS) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Adiciona um job na fila e retorna uma Promise resolvida quando o processamento terminar.
   */
  public enqueue(job: Job, worker: JobWorker<ProcessingResult>): Promise<ProcessingResult> {
    return new Promise<ProcessingResult>((resolve, reject) => {
      this.queue.push({ job, worker, resolve, reject });

      logger.info(
        {
          event: 'job_queued',
          jobId: job.id,
          mediaType: job.mediaType,
          queueLength: this.queue.length,
          active: this.activeJobs.size,
        },
        `Job ${job.id} enfileirado (${job.mediaType})`
      );

      this.processNext();
    });
  }

  /**
   * Processa o próximo item se houver capacidade de concorrência disponível.
   */
  private processNext(): void {
    if (this.activeJobs.size >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    const { job, worker, resolve, reject } = item;
    job.status = 'processing';
    job.startedAt = Date.now();
    this.activeJobs.set(job.id, job);

    logger.info(
      {
        event: 'job_started',
        jobId: job.id,
        mediaType: job.mediaType,
        active: this.activeJobs.size,
      },
      `Iniciando execução do job ${job.id}`
    );

    this.emit('jobStarted', job);

    // Executa o worker
    (async () => {
      try {
        const result = await worker(job);
        job.status = 'completed';
        job.completedAt = Date.now();
        this.completedCount++;
        this.activeJobs.delete(job.id);

        logger.info(
          {
            event: 'job_completed',
            jobId: job.id,
            durationMs: job.completedAt - (job.startedAt || job.createdAt),
            outputBytes: result.sizeBytes,
          },
          `Job ${job.id} concluído com sucesso`
        );

        this.emit('jobCompleted', job, result);
        resolve(result);
      } catch (err) {
        job.status = 'failed';
        job.completedAt = Date.now();
        job.error = err instanceof Error ? err.message : String(err);
        this.failedCount++;
        this.activeJobs.delete(job.id);

        logger.error(
          {
            event: 'job_failed',
            jobId: job.id,
            err: job.error,
          },
          `Job ${job.id} falhou: ${job.error}`
        );

        this.emit('jobFailed', job, err);
        reject(err);
      } finally {
        this.processNext();
      }
    })();
  }

  /**
   * Retorna estatísticas de execução da fila.
   */
  public getStats(): QueueStats & { uptimeSeconds: number } {
    return {
      queued: this.queue.length,
      processing: this.activeJobs.size,
      completed: this.completedCount,
      failed: this.failedCount,
      total: this.completedCount + this.failedCount + this.activeJobs.size + this.queue.length,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  /**
   * Limpa a fila cancelando itens pendentes
   */
  public clear(): void {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        item.job.status = 'failed';
        item.reject(new Error('Fila encerrada'));
      }
    }
  }
}

// Instância singleton da fila do sistema
export const jobQueue = new JobQueue();
