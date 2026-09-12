import type { CommandHandler } from '../../types/command.js';

export const handleOutline: CommandHandler = async (ctx) => {
  const target =
    ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
      ? ctx.message.quotedMessage
      : ctx.message;

  if (target.mediaType !== 'IMAGE') {
    await ctx.reply('❌ O comando */outline* só pode ser aplicado em fotos ou stickers estáticos.');
    return;
  }

  const colorArg = (ctx.command.args[0] || '').toLowerCase();
  let color = '#FFFFFF';
  if (colorArg === 'black' || colorArg === 'preto') color = '#000000';
  else if (colorArg.startsWith('#')) color = colorArg;

  await ctx.processMedia({ outline: color });
};
