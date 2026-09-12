import type { CommandHandler } from '../../types/command.js';
import { packManager } from '../../storage/pack-manager.js';

export const handlePack: CommandHandler = async (ctx) => {
  const subCommand = (ctx.command.args[0] || 'list').toLowerCase();

  if (subCommand === 'create') {
    const packName = ctx.command.args.slice(1).join(' ').trim();
    if (!packName) {
      await ctx.reply('❌ Informe o nome do pacote.\nExemplo: */pack create Meus Memes*');
      return;
    }
    const created = packManager.createPack(packName);
    await ctx.reply(`✅ Pacote criado com sucesso: *${created.name}* (ID: ${created.id})`);
    return;
  }

  if (subCommand === 'list') {
    const packs = packManager.listPacks();
    if (packs.length === 0) {
      await ctx.reply('📭 Nenhum pacote de figurinhas criado ainda.\nUse */pack create <nome>* para criar o primeiro!');
      return;
    }
    const listText = packs
      .map((p, i) => `${i + 1}. 📦 *${p.name}* (${p.stickerIds.length} stickers)`)
      .join('\n');
    await ctx.reply(`📦 *Pacotes Disponíveis:*\n\n${listText}`);
    return;
  }

  if (subCommand === 'add') {
    const packName = ctx.command.args.slice(1).join(' ').trim();
    if (!packName) {
      await ctx.reply('❌ Informe o nome do pacote.\nExemplo: */pack add Meus Memes* respondendo a um sticker.');
      return;
    }
    const pack = packManager.getPack(packName);
    if (!pack) {
      await ctx.reply(`❌ Pacote *"${packName}"* não encontrado. Crie com */pack create ${packName}*.`);
      return;
    }

    const target = ctx.message.quotedMessage || ctx.message;
    const stickerId = target.id;
    packManager.addStickerToPack(pack.id, stickerId);
    await ctx.reply(`✅ Sticker adicionado ao pacote *${pack.name}*! Total: ${pack.stickerIds.length}`);
    return;
  }

  await ctx.reply(
    '📦 *Comandos de Pacotes:*\n• */pack create <nome>*\n• */pack list*\n• */pack add <nome>* (respondendo a um sticker)'
  );
};
