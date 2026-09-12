import os from 'node:os';
import { jobQueue } from '../queue/job-queue.js';
import { sessionManager } from './session-manager.js';
import { libraryManager } from '../storage/library-manager.js';

export interface SystemTelemetry {
  osPlatform: string;
  osRelease: string;
  osArch: string;
  nodeVersion: string;
  uptimeSeconds: number;
  cpu: {
    model: string;
    cores: number;
    loadAvg: number[];
  };
  memory: {
    processRssMb: number;
    processHeapUsedMb: number;
    systemTotalMb: number;
    systemFreeMb: number;
    systemUsedPercent: number;
  };
  storage: {
    libraryCount: number;
    librarySizeMb: number;
  };
  queue: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  activeSessions: number;
  timestamp: number;
}

export interface PipelineDebugLog {
  id: string;
  timestamp: number;
  stage: 'detector' | 'validator' | 'queue' | 'processor' | 'compression';
  message: string;
  details?: Record<string, any>;
}

export class SystemMonitor {
  private debugLogs: PipelineDebugLog[] = [];
  private readonly maxDebugLogs = 50;

  public getTelemetry(): SystemTelemetry {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus() || [];

    const libraryItems = libraryManager.getLibrary();
    const librarySizeBytes = libraryItems.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);

    const queueStats = jobQueue.getStats();

    return {
      osPlatform: process.platform,
      osRelease: os.release(),
      osArch: process.arch,
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      cpu: {
        model: cpus[0]?.model || 'Desconhecido',
        cores: cpus.length,
        loadAvg: os.loadavg(),
      },
      memory: {
        processRssMb: Math.round(mem.rss / 1024 / 1024),
        processHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        systemTotalMb: Math.round(totalMem / 1024 / 1024),
        systemFreeMb: Math.round(freeMem / 1024 / 1024),
        systemUsedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      },
      storage: {
        libraryCount: libraryItems.length,
        librarySizeMb: +(librarySizeBytes / 1024 / 1024).toFixed(2),
      },
      queue: {
        queued: queueStats.queued,
        processing: queueStats.processing,
        completed: queueStats.completed,
        failed: queueStats.failed,
      },
      activeSessions: sessionManager.getActiveCount(),
      timestamp: Date.now(),
    };
  }

  public addDebugLog(
    stage: 'detector' | 'validator' | 'queue' | 'processor' | 'compression',
    message: string,
    details?: Record<string, any>
  ): void {
    const cleanDetails = details ? { ...details } : undefined;
    // Sanitização: nunca registra segredos, tokens ou telefones completos
    if (cleanDetails?.auth) delete cleanDetails.auth;
    if (cleanDetails?.token) delete cleanDetails.token;

    this.debugLogs.unshift({
      id: `dbg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      stage,
      message,
      details: cleanDetails,
    });

    if (this.debugLogs.length > this.maxDebugLogs) {
      this.debugLogs = this.debugLogs.slice(0, this.maxDebugLogs);
    }
  }

  public getDebugLogs(limit = 20): PipelineDebugLog[] {
    return this.debugLogs.slice(0, limit);
  }
}

export const systemMonitor = new SystemMonitor();
