import { botState } from './bot-state.js';
import { logger } from '../utils/logger.js';
export class AutomationManager {
    autoOffTimer = null;
    scheduleCheckInterval = null;
    autoOffTargetTimestamp = null;
    constructor() {
        this.initFromSettings();
        this.startScheduleLoop();
    }
    initFromSettings() {
        const settings = botState.getSettings();
        if (settings.autoOffMinutes && settings.autoOffMinutes > 0) {
            this.setAutoOff(settings.autoOffMinutes);
        }
    }
    /**
     * Configura o Auto-Off (desligamento automático após X minutos).
     * Cancela qualquer timer anterior para evitar duplicidade.
     */
    setAutoOff(minutes) {
        if (this.autoOffTimer) {
            clearTimeout(this.autoOffTimer);
            this.autoOffTimer = null;
            this.autoOffTargetTimestamp = null;
        }
        if (!minutes || minutes <= 0) {
            botState.updateSettings({ autoOffMinutes: 0 });
            logger.info('Auto-Off desativado (Never)');
            return;
        }
        botState.updateSettings({ autoOffMinutes: minutes });
        this.autoOffTargetTimestamp = Date.now() + minutes * 60 * 1000;
        this.autoOffTimer = setTimeout(() => {
            logger.info({ minutes }, '⏰ Timer de Auto-Off expirou! Desativando o bot automaticamente...');
            botState.setBotActive(false);
            this.autoOffTimer = null;
            this.autoOffTargetTimestamp = null;
        }, minutes * 60 * 1000);
        if (this.autoOffTimer.unref) {
            this.autoOffTimer.unref();
        }
        logger.info({ minutes }, `Auto-Off configurado para ${minutes} minutos`);
    }
    getAutoOffRemainingSeconds() {
        if (!this.autoOffTargetTimestamp)
            return 0;
        const remaining = Math.max(0, Math.round((this.autoOffTargetTimestamp - Date.now()) / 1000));
        return remaining;
    }
    /**
     * Loop periódico para verificação do agendamento (Schedule).
     */
    startScheduleLoop() {
        if (this.scheduleCheckInterval)
            return;
        this.scheduleCheckInterval = setInterval(() => {
            this.evaluateSchedule();
        }, 60_000);
        if (this.scheduleCheckInterval.unref) {
            this.scheduleCheckInterval.unref();
        }
    }
    /**
     * Avalia se o horário atual local está dentro do período agendado (suporta virada da meia-noite).
     */
    evaluateSchedule() {
        const settings = botState.getSettings();
        if (!settings.scheduleEnabled)
            return;
        const start = settings.scheduleStart || '08:00';
        const end = settings.scheduleEnd || '22:00';
        const now = new Date();
        const currentH = String(now.getHours()).padStart(2, '0');
        const currentM = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentH}:${currentM}`;
        const isWithin = this.isTimeInRange(currentTime, start, end);
        if (botState.isBotActive() !== isWithin) {
            logger.info({ currentTime, start, end, shouldBeActive: isWithin }, `Horário agendado: alterando botActive para ${isWithin}`);
            botState.setBotActive(isWithin);
        }
    }
    /**
     * Verifica se currentTime está entre start e end, com suporte a virada de meia-noite (ex: 23:00 até 02:00).
     */
    isTimeInRange(current, start, end) {
        if (start <= end) {
            return current >= start && current < end;
        }
        // Virada de meia-noite (ex: 23:00 -> 02:00)
        return current >= start || current < end;
    }
    /**
     * Ativa ou desativa o Party Mode.
     * REGRA INVIOLÁVEL: Grupos continuam completamente bloqueados.
     */
    setPartyMode(enable) {
        botState.updateSettings({
            partyMode: enable,
            autoImage: true,
            autoVideo: true,
            autoGif: true,
        });
        logger.info({ enable }, 'Party Mode configurado (Grupos permanecem 100% bloqueados)');
    }
}
export const automationManager = new AutomationManager();
//# sourceMappingURL=automation-manager.js.map