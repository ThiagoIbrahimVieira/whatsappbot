import type { CommandHandler } from '../../types/command.js';

export const handlePing: CommandHandler = async (ctx) => {
  await ctx.reply('🏓 pong');
};
