import type { CommandHandler } from '../../types/command.js';
import { statisticsManager } from '../../control/statistics-manager.js';

function renderProgressBar(percent: number, length = 10): string {
  const filled = Math.max(0, Math.min(length, Math.round((percent / 100) * length)));
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export const handleProfile: CommandHandler = async (ctx) => {
  const senderPhone =
    ctx.senderPhone ||
    (ctx.message.senderJid || ctx.message.chatId || '').split(':')[0].split('@')[0];

  const stats = statisticsManager.getUserStats(senderPhone);

  const lines: string[] = [
    `👤 *PERFIL DO CRIADOR — ${stats.handle}*`,
    '──────────────────────',
    `🎖️ *Nível:* ${stats.levelBadge} ${stats.levelTitle}`,
    `🏆 *Ranking Geral:* ${stats.rank > 0 ? `#${stats.rank} lugar` : 'Não ranqueado'}`,
    `🎯 *Total de Figurinhas:* ${stats.totalStickers}`,
    '',
    '📊 *Por Tipo de Mídia:*',
    `• 🖼️ Fotos: ${stats.images}`,
    `• 🎬 Vídeos: ${stats.videos}`,
    `• 🎞️ GIFs: ${stats.gifs}`,
    '',
    '⚡ *Progresso do Nível:*',
  ];

  if (stats.totalStickers >= 501) {
    lines.push(`[${'█'.repeat(10)}] 100%`);
    lines.push('👑 *Você atingiu a patente máxima: Lenda do WhatsApp!*');
  } else {
    const bar = renderProgressBar(stats.progressPercent);
    const needed = stats.nextLevelStickers - stats.totalStickers;
    lines.push(`[${bar}] ${stats.progressPercent}%`);
    lines.push(`Faltam *${needed}* figurinhas para o próximo nível (${stats.nextLevelStickers})!`);
  }

  lines.push('──────────────────────');
  lines.push('💡 _Dica: Digite */ranking* para ver o Top 10 de criadores!_');

  await ctx.reply(lines.join('\n'));
};
