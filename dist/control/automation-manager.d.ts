export declare class AutomationManager {
    private autoOffTimer;
    private scheduleCheckInterval;
    private autoOffTargetTimestamp;
    constructor();
    initFromSettings(): void;
    /**
     * Configura o Auto-Off (desligamento automático após X minutos).
     * Cancela qualquer timer anterior para evitar duplicidade.
     */
    setAutoOff(minutes: number): void;
    getAutoOffRemainingSeconds(): number;
    /**
     * Loop periódico para verificação do agendamento (Schedule).
     */
    private startScheduleLoop;
    /**
     * Avalia se o horário atual local está dentro do período agendado (suporta virada da meia-noite).
     */
    evaluateSchedule(): void;
    /**
     * Verifica se currentTime está entre start e end, com suporte a virada de meia-noite (ex: 23:00 até 02:00).
     */
    isTimeInRange(current: string, start: string, end: string): boolean;
    /**
     * Ativa ou desativa o Party Mode.
     * REGRA INVIOLÁVEL: Grupos continuam completamente bloqueados.
     */
    setPartyMode(enable: boolean): void;
}
export declare const automationManager: AutomationManager;
