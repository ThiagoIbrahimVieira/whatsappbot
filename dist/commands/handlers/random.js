import { libraryManager } from '../../storage/library-manager.js';
export const handleRandom = async (ctx) => {
    const item = libraryManager.getRandomSticker();
    if (!item) {
        await ctx.reply('📭 A biblioteca ainda não tem stickers salvos. Envie uma mídia para criar!');
        return;
    }
    const buffer = await libraryManager.getStickerBuffer(item.id);
    if (!buffer) {
        await ctx.reply('❌ Erro ao resgatar sticker aleatório da biblioteca.');
        return;
    }
    if (ctx.sendSticker) {
        await ctx.sendSticker(buffer, item.isAnimated);
    }
    else {
        await ctx.reply('❌ Falha ao enviar sticker aleatório.');
    }
};
//# sourceMappingURL=random.js.map