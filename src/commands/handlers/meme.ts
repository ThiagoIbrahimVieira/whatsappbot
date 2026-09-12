import type { CommandHandler } from '../../types/command.js';

export const handleMeme: CommandHandler = async (ctx) => {
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
      '❌ Envie ou responda a uma imagem, GIF ou vídeo com o comando */meme <texto>*.\nExemplo:\n• */meme MEU CÓDIGO | FUNCIONOU*\n• */meme TEXTO ÚNICO*'
    );
    return;
  }

  const memeText = ctx.command.args.join(' ').trim();
  if (!memeText) {
    await ctx.reply(
      '💡 Digite o texto desejado após o comando!\nExemplo: */meme TOPO | RODAPÉ* ou */meme APENAS RODAPÉ*'
    );
    return;
  }

  await ctx.processMedia({
    memeText,
    // Se for vídeo ou GIF, gera meme estático do frame inicial
    forceStatic: target.mediaType !== 'IMAGE',
  });
};
