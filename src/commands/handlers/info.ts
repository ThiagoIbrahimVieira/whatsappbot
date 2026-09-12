import type { CommandHandler } from '../../types/command.js';

export const handleInfo: CommandHandler = async (ctx) => {
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
      '❌ Nenhuma mídia encontrada. Responda a uma foto, vídeo ou GIF com o comando */info*.'
    );
    return;
  }

  const rawMsg = target.rawMediaMessage as any;
  const sizeBytes = Number(rawMsg?.fileLength || 0);
  const sizeMb = sizeBytes > 0 ? (sizeBytes / (1024 * 1024)).toFixed(2) + ' MB' : 'Desconhecido';
  const duration = rawMsg?.seconds ? `${rawMsg.seconds}s` : 'N/A';
  const width = rawMsg?.width || 'N/A';
  const height = rawMsg?.height || 'N/A';
  const mimetype = rawMsg?.mimetype || 'Desconhecido';

  const infoText = [
    'ℹ️ *Informações da Mídia:*',
    '',
    `• *Tipo:* ${target.mediaType}`,
    `• *MIME:* ${mimetype}`,
    `• *Tamanho:* ${sizeMb}`,
    `• *Dimensões:* ${width}x${height}`,
    `• *Duração:* ${duration}`,
  ].join('\n');

  await ctx.reply(infoText);
};
