import type { MediaType, ProcessingResult } from '../types/media.js';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  chatId: string;
  messageId: string;
  mediaType: MediaType;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export type JobWorker<T = ProcessingResult> = (job: Job) => Promise<T>;

export interface QueueStats {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}
