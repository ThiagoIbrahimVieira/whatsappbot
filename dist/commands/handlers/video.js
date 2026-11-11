export const handleVideo = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'VIDEO' && target.mediaType !== 'GIF') {
        await ctx.reply('❌ O comando */video* deve ser usado respondendo a um vídeo ou GIF.');
        return;
    }
    await ctx.processMedia({ forceAnimated: true });
};
//# sourceMappingURL=video.js.map