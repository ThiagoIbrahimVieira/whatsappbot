import type { CommandHandler } from '../../types/command.js';

export const handleShadow: CommandHandler = async (ctx) => {
  const target =
    ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
      ? ctx.message.quotedMessage
      : ctx.message;

  if (target.mediaType !== 'IMAGE') {
    await ctx.reply('❌ O comando */shadow* só pode ser aplicado em fotos ou stickers estáticos.');
    return;
  }

  const typeArg = (ctx.command.args[0] || '').toLowerCase();
  const shadowType = typeArg === 'hard' ? 'hard' : 'soft';

  await ctx.processMedia({ shadow: shadowType });
};
