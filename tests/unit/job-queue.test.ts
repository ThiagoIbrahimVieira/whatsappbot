import { describe, it, expect } from 'vitest';
import { JobQueue } from '../../src/queue/job-queue.js';
import type { Job } from '../../src/queue/job-types.js';
import type { ProcessingResult } from '../../src/types/media.js';

describe('Job Queue Concurrency & Lifecycle', () => {
  const mockResult: ProcessingResult = {
    outputPath: '/tmp/out.webp',
    outputBuffer: Buffer.from('test'),
    mimetype: 'image/webp',
    isAnimated: false,
    width: 512,
    height: 512,
    sizeBytes: 4,
    processingTimeMs: 10,
  };

  it('deve processar jobs com concorrência máxima limitada a 2', async () => {
    const queue = new JobQueue(2);
    let activeWorkers = 0;
    let maxObservedActive = 0;

    const worker = async (_job: Job): Promise<ProcessingResult> => {
      activeWorkers++;
      maxObservedActive = Math.max(maxObservedActive, activeWorkers);
      // Simula tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 50));
      activeWorkers--;
      return mockResult;
    };

    const jobs: Job[] = [1, 2, 3, 4, 5].map((i) => ({
      id: `job-${i}`,
      chatId: 'user@s.whatsapp.net',
      messageId: `msg-${i}`,
      mediaType: 'IMAGE',
      status: 'queued',
      createdAt: Date.now(),
    }));

    const promises = jobs.map((job) => queue.enqueue(job, worker));
    await Promise.all(promises);

    expect(maxObservedActive).toBe(2);
    const stats = queue.getStats();
    expect(stats.completed).toBe(5);
    expect(stats.failed).toBe(0);
    expect(stats.processing).toBe(0);
    expect(stats.queued).toBe(0);
  });

  it('deve contabilizar falhas de job corretamente', async () => {
    const queue = new JobQueue(1);

    const failingWorker = async (_job: Job): Promise<ProcessingResult> => {
      throw new Error('Falha simulada no processador');
    };

    const job: Job = {
      id: 'fail-1',
      chatId: 'user@s.whatsapp.net',
      messageId: 'msg-f',
      mediaType: 'IMAGE',
      status: 'queued',
      createdAt: Date.now(),
    };

    await expect(queue.enqueue(job, failingWorker)).rejects.toThrow('Falha simulada');

    const stats = queue.getStats();
    expect(stats.failed).toBe(1);
    expect(stats.completed).toBe(0);
  });
});
