export const handleStatic = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'IMAGE' &&
        target.mediaType !== 'VIDEO' &&
        target.mediaType !== 'GIF') {
        await ctx.reply('❌ Envie ou responda a uma foto, vídeo ou GIF com o comando */static*.\nExemplos:\n• */static*\n• */static 4* (frame aos 4 segundos)\n• */static middle* (frame central)');
        return;
    }
    const arg = (ctx.command.args[0] || '').trim().toLowerCase();
    let staticTimestamp = undefined;
    if (arg === 'middle') {
        staticTimestamp = 'middle';
    }
    else if (arg && !isNaN(Number(arg))) {
        staticTimestamp = Math.max(0, Number(arg));
    }
    await ctx.processMedia({ forceStatic: true, staticTimestamp });
};
//# sourceMappingURL=static.js.map