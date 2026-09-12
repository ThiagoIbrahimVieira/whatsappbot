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
export declare class SystemMonitor {
    private debugLogs;
    private readonly maxDebugLogs;
    getTelemetry(): SystemTelemetry;
    addDebugLog(stage: 'detector' | 'validator' | 'queue' | 'processor' | 'compression', message: string, details?: Record<string, any>): void;
    getDebugLogs(limit?: number): PipelineDebugLog[];
}
export declare const systemMonitor: SystemMonitor;
