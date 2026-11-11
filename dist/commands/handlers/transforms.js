export const handleRotate = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'IMAGE') {
        await ctx.reply('❌ O comando */rotate* só pode ser aplicado em fotos ou stickers estáticos.');
        return;
    }
    const deg = Number(ctx.command.args[0]) || 90;
    await ctx.processMedia({ rotate: deg });
};
export const handleFlip = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'IMAGE') {
        await ctx.reply('❌ O comando */flip* só pode ser aplicado em fotos ou stickers estáticos.');
        return;
    }
    await ctx.processMedia({ flip: true });
};
export const handleMirror = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'IMAGE') {
        await ctx.reply('❌ O comando */mirror* só pode ser aplicado em fotos ou stickers estáticos.');
        return;
    }
    await ctx.processMedia({ mirror: true });
};
export const handleCrop = async (ctx) => {
    const target = ctx.message.quotedMessage && ctx.message.quotedMessage.mediaType !== 'UNKNOWN'
        ? ctx.message.quotedMessage
        : ctx.message;
    if (target.mediaType !== 'IMAGE') {
        await ctx.reply('❌ O comando */crop* só pode ser aplicado em fotos ou stickers estáticos.');
        return;
    }
    const modeArg = (ctx.command.args[0] || 'square').toLowerCase();
    const cropMode = modeArg === 'portrait' ? 'portrait' : modeArg === 'auto' ? 'auto' : 'square';
    await ctx.processMedia({ crop: cropMode });
};
//# sourceMappingURL=transforms.js.map