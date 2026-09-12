export const handleGif = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'GIF' && target.mediaType !== 'VIDEO') {
        await ctx.reply('❌ O comando */gif* deve ser usado respondendo a um GIF ou vídeo.');
        return;
    }
    await ctx.processMedia({ forceAnimated: true });
};
//# sourceMappingURL=gif.js.map