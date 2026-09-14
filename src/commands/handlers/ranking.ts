import type { CommandHandler } from '../../types/command.js';
import { statisticsManager } from '../../control/statistics-manager.js';

export const handleRanking: CommandHandler = async (ctx) => {
  const topUsers = statisticsManager.getRanking('allTime', 10);
  const senderPhone =
    ctx.senderPhone ||
    (ctx.message.senderJid || ctx.message.chatId || '').split(':')[0].split('@')[0];

  const senderStats = statisticsManager.getUserStats(senderPhone);

  const lines: string[] = [
    '🏆 *TOP CRIADORES DE STICKERS* 🏆',
    '──────────────────────',
  ];

  if (topUsers.length === 0) {
    lines.push('Ainda não há figurinhas no ranking!');
    lines.push('Seja o primeiro a criar enviando uma foto ou vídeo 🥇');
  } else {
    topUsers.forEach((user, idx) => {
      let medal = `${idx + 1}º`;
      if (idx === 0) medal = '🥇 1º';
      else if (idx === 1) medal = '🥈 2º';
      else if (idx === 2) medal = '🥉 3º';

      lines.push(
        `${medal} *${user.handle}* • ${user.count} ${user.count === 1 ? 'figurinha' : 'figurinhas'} [${user.levelBadge} ${user.levelTitle}]`
      );
    });
  }

  lines.push('──────────────────────');

  if (senderStats.totalStickers > 0) {
    lines.push(`👤 *Sua Posição:* #${senderStats.rank} • *${senderStats.handle}*`);
    lines.push(`🎯 *Total Criado:* ${senderStats.totalStickers} figurinhas`);
    lines.push(`🎖️ *Nível:* ${senderStats.levelBadge} ${senderStats.levelTitle}`);

    if (senderStats.totalStickers < 501) {
      const remaining = senderStats.nextLevelStickers - senderStats.totalStickers;
      lines.push(`⚡ *Faltam:* ${remaining} figurinhas para o próximo nível!`);
    } else {
      lines.push('👑 *Você alcançou o topo! Nível Máximo.*');
    }
  } else {
    lines.push('👤 *Sua Posição:* Sem figurinhas ainda');
    lines.push('💡 _Envie uma foto ou vídeo para entrar no ranking!_');
  }

  lines.push('──────────────────────');
  lines.push('💡 _Dica: Digite */perfil* para ver suas estatísticas detalhadas!_');

  await ctx.reply(lines.join('\n'));
};
