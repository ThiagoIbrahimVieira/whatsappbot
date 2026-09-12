import type { CommandHandler } from '../../types/command.js';

export const handleVideo: CommandHandler = async (ctx) => {
  const target =
    ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
      ? ctx.message.quotedMessage
      : ctx.message;

  if (target.mediaType !== 'VIDEO' && target.mediaType !== 'GIF') {
    await ctx.reply(
      '❌ O comando */video* deve ser usado respondendo a um vídeo ou GIF.'
    );
    return;
  }

  await ctx.processMedia({ forceAnimated: true });
};
