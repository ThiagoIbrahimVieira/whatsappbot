import type { CommandHandler } from '../../types/command.js';

export const handleStatic: CommandHandler = async (ctx) => {
  const target =
    ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
      ? ctx.message.quotedMessage
      : ctx.message;

  if (
    target.mediaType !== 'IMAGE' &&
    target.mediaType !== 'VIDEO' &&
    target.mediaType !== 'GIF'
  ) {
    await ctx.reply(
      '❌ Envie ou responda a uma foto, vídeo ou GIF com o comando */static*.'
    );
    return;
  }

  await ctx.processMedia({ forceStatic: true });
};
