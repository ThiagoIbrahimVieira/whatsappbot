import { describe, it, expect } from 'vitest';
import { automationManager } from '../../src/control/automation-manager.js';
import { systemMonitor } from '../../src/control/system-monitor.js';

describe('Automations and System Telemetry', () => {
  it('deve avaliar intervalo de horário padrão e com virada de meia-noite corretamente', () => {
    // Caso 1: Horário normal no mesmo dia (08:00 às 22:00)
    expect(automationManager.isTimeInRange('10:00', '08:00', '22:00')).toBe(true);
    expect(automationManager.isTimeInRange('07:30', '08:00', '22:00')).toBe(false);
    expect(automationManager.isTimeInRange('22:30', '08:00', '22:00')).toBe(false);

    // Caso 2: Virada de meia-noite (23:00 às 02:00)
    expect(automationManager.isTimeInRange('23:30', '23:00', '02:00')).toBe(true);
    expect(automationManager.isTimeInRange('01:15', '23:00', '02:00')).toBe(true);
    expect(automationManager.isTimeInRange('03:00', '23:00', '02:00')).toBe(false);
    expect(automationManager.isTimeInRange('15:00', '23:00', '02:00')).toBe(false);
  });

  it('deve retornar telemetria real do sistema (CPU, RAM, Uptime e Fila)', () => {
    const telemetry = systemMonitor.getTelemetry();

    expect(telemetry.nodeVersion).toBe(process.version);
    expect(telemetry.osPlatform).toBe(process.platform);
    expect(telemetry.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(telemetry.memory.processRssMb).toBeGreaterThan(0);
    expect(telemetry.memory.systemTotalMb).toBeGreaterThan(0);
    expect(telemetry.cpu.cores).toBeGreaterThan(0);
    expect(telemetry.queue).toBeDefined();
    expect(typeof telemetry.activeSessions).toBe('number');
  });

  it('deve registrar logs de debug da pipeline e filtrar segredos/tokens', () => {
    systemMonitor.addDebugLog('processor', 'Teste de pipeline', {
      token: 'SECRET_TOKEN_DO_NOT_EXPOSE',
      mediaType: 'image',
    });

    const logs = systemMonitor.getDebugLogs(5);
    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[0];
    expect(lastLog.stage).toBe('processor');
    expect(lastLog.message).toBe('Teste de pipeline');
    expect(lastLog.details?.token).toBeUndefined();
    expect(lastLog.details?.mediaType).toBe('image');
  });
});
