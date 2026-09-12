export const handleSticker = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'IMAGE' &&
        target.mediaType !== 'VIDEO' &&
        target.mediaType !== 'GIF') {
        await ctx.reply('❌ Envie ou responda a uma foto, vídeo ou GIF com o comando */sticker* para criar uma figurinha.');
        return;
    }
    await ctx.processMedia();
};
//# sourceMappingURL=sticker.js.map