import type { CommandHandler } from '../../types/command.js';
import { jobQueue } from '../../queue/job-queue.js';

export const handleStatus: CommandHandler = async (ctx) => {
  const stats = jobQueue.getStats();

  const hours = Math.floor(stats.uptimeSeconds / 3600);
  const minutes = Math.floor((stats.uptimeSeconds % 3600) / 60);
  const seconds = stats.uptimeSeconds % 60;
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

  const statusText = [
    '📊 *Status do Sistema — WhatsApp Auto Sticker*',
    '',
    `• *Conexão:* 🟢 Ativo`,
    `• *Tempo de atividade:* ${uptimeStr}`,
    `• *Jobs concluídos:* ${stats.completed}`,
    `• *Jobs com falha:* ${stats.failed}`,
    `• *Jobs em execução:* ${stats.processing}`,
    `• *Jobs na fila:* ${stats.queued}`,
    `• *Total processado:* ${stats.total}`,
  ].join('\n');

  await ctx.reply(statusText);
};
