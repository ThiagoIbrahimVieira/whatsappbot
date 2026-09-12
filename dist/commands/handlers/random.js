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
    // Notifica no chat com sticker
    await ctx.reply('🎲 Enviando sticker aleatório da biblioteca...');
};
//# sourceMappingURL=random.js.map