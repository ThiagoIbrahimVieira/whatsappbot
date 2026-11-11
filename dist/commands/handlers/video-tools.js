export const handleTrim = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'VIDEO' && target.mediaType !== 'GIF') {
        await ctx.reply('❌ O comando */trim* deve ser aplicado em vídeos ou GIFs.\nExemplo: */trim 5* (corta nos primeiros 5 segundos)');
        return;
    }
    const seconds = Number(ctx.command.args[0]) || 5;
    await ctx.processMedia({ trimSeconds: Math.max(1, Math.min(10, seconds)) });
};
export const handleFps = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'VIDEO' && target.mediaType !== 'GIF') {
        await ctx.reply('❌ O comando */fps* deve ser aplicado em vídeos ou GIFs.\nExemplo: */fps 8* ou */fps 12*');
        return;
    }
    const fps = Number(ctx.command.args[0]) || 8;
    await ctx.processMedia({ fps: Math.max(1, Math.min(30, fps)) });
};
export const handleSpeed = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'VIDEO' && target.mediaType !== 'GIF') {
        await ctx.reply('❌ O comando */speed* deve ser aplicado em vídeos ou GIFs.\nExemplo: */speed 1.5* ou */speed 2.0*');
        return;
    }
    const factor = Number(ctx.command.args[0]) || 1.5;
    await ctx.processMedia({ speed: Math.max(0.5, Math.min(3.0, factor)) });
};
export const handleSlow = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'VIDEO' && target.mediaType !== 'GIF') {
        await ctx.reply('❌ O comando */slow* deve ser aplicado em vídeos ou GIFs.\nExemplo: */slow 0.5*');
        return;
    }
    const factor = Number(ctx.command.args[0]) || 0.5;
    await ctx.processMedia({ speed: Math.max(0.25, Math.min(1.0, factor)) });
};
//# sourceMappingURL=video-tools.js.map