import type { CommandHandler } from '../../types/command.js';
import { packManager, pendingPackCreation } from '../../storage/pack-manager.js';
import { whatsappClient } from '../../whatsapp/client.js';
import { sendInteractivePoll } from '../../whatsapp/interactive-messages.js';
import { stickerSender } from '../../whatsapp/sticker-sender.js';
import { stickerPackSender } from '../../whatsapp/sticker-pack-sender.js';

export const handlePack: CommandHandler = async (ctx) => {
  const sock = whatsappClient.getSocket();
  const chatId = ctx.message.chatId;
  const senderPhone =
    ctx.senderPhone ||
    (ctx.message.senderJid || ctx.message.chatId || '').split(':')[0].split('@')[0];

  const subCommand = (ctx.command.args[0] || '').toLowerCase();
  const rawArg = ctx.command.args.slice(1).join(' ').trim();

  // 1. Enviar figurinhas de um pack para o chat
  if (subCommand === 'enviar' || subCommand === 'send') {
    const isLooseRequested = rawArg.includes('solta') || rawArg.includes('individual');
    const cleanArg = rawArg.replace(/soltas?|individua(l|is)/gi, '').trim();
    const targetNameOrId = cleanArg || 'default';

    const pack =
      targetNameOrId === 'default'
        ? packManager.getOrCreateDefaultPack(senderPhone)
        : packManager.getPack(targetNameOrId, senderPhone) || packManager.getOrCreateDefaultPack(senderPhone);

    if (pack.stickerIds.length === 0) {
      await ctx.reply(
        `📭 O pack *"${pack.name}"* está vazio!\n\nEnvie fotos ou vídeos para criar figurinhas e toque em *📁 Salvar no Meu Pack* logo após criá-las!`
      );
      return;
    }

    // Se o usuário não pediu figurinhas soltas explicitamente, envia o Card Oficial do WhatsApp (Imagem 2)
    if (!isLooseRequested && sock) {
      const cardSent = await stickerPackSender.sendStickerPackCard(sock, chatId, pack, ctx.message.rawMessage);
      if (cardSent) return;
    }

    // Fallback ou envio de figurinhas soltas individuais
    const buffers = await packManager.getStickerBuffersForPack(pack.id);
    if (buffers.length === 0) {
      await ctx.reply(`⚠️ As figurinhas de *"${pack.name}"* não foram encontradas no armazenamento.`);
      return;
    }

    await ctx.reply(`🚀 *Enviando ${buffers.length} figurinhas do pack "${pack.name}"...* Aguarde alguns instantes.`);

    for (const item of buffers) {
      if (ctx.sendSticker) {
        await ctx.sendSticker(item.buffer, item.isAnimated);
      } else if (sock) {
        await stickerSender.sendSticker(sock, chatId, item.buffer, ctx.message.rawMessage, {
          isAnimated: item.isAnimated,
        });
      }
      await new Promise((r) => setTimeout(r, 350));
    }

    await ctx.reply(`✅ *Todas as ${buffers.length} figurinhas de "${pack.name}" foram enviadas com sucesso!* 🎉`);
    return;
  }

  // 2. Criar novo pack
  if (subCommand === 'criar' || subCommand === 'create' || subCommand === 'novo') {
    if (!rawArg) {
      pendingPackCreation.set(senderPhone, { chatId, timestamp: Date.now() });
      await ctx.reply(
        '✍️ *Criando seu novo Pack de Figurinhas!*\n\n👉 *Basta digitar o nome do seu pack aqui abaixo:*\n_(Exemplo: Memes, Gatinhos, Zoeira, etc.)_'
      );
      return;
    }

    const created = packManager.createPack(rawArg, senderPhone);
    await ctx.reply(
      [
        '✅ *Pack Criado com Sucesso!*',
        `📦 Nome: *${created.name}*`,
        '',
        '👉 *Como adicionar figurinhas:*',
        '• Toque em *📁 Salvar no Meu Pack* logo após criar qualquer figurinha',
        `• Ou responda a qualquer figurinha digitando: */pack add ${created.name}*`,
        '',
        '👉 *Para enviar seu pack:*',
        `• Digite: */pack enviar ${created.name}*`,
        `• Para compartilhar com amigos: */pack compartilhar ${created.name}*`,
      ].join('\n')
    );
    return;
  }

  // 3. Listar packs do usuário
  if (subCommand === 'lista' || subCommand === 'list' || subCommand === 'listar') {
    const packs = packManager.getUserPacks(senderPhone);
    if (packs.length === 0) {
      await ctx.reply('📭 Você ainda não possui nenhum pack.\nUse */pack criar* para criar o primeiro!');
      return;
    }

    const listText = packs
      .map((p, i) => {
        const star = p.isDefault ? ' ⭐ [Padrão]' : '';
        return `${i + 1}. 📦 *${p.name}*${star}\n   • ${p.stickerIds.length} figurinha(s)`;
      })
      .join('\n\n');

    await ctx.reply(
      [
        '📦 *SEUS PACKS DE FIGURINHAS:*',
        '',
        listText,
        '',
        '👉 *Comandos úteis:*',
        '• */pack enviar [nome]* — Envia o pacote no chat',
        '• */pack compartilhar [nome]* — Compartilha com amigos',
        '• */pack limpar [nome]* — Esvazia o pack',
      ].join('\n')
    );
    return;
  }

  // 4. Compartilhar pack com amigos
  if (subCommand === 'compartilhar' || subCommand === 'share') {
    const targetNameOrId = rawArg || 'default';
    const pack =
      targetNameOrId === 'default'
        ? packManager.getOrCreateDefaultPack(senderPhone)
        : packManager.getPack(targetNameOrId, senderPhone) || packManager.getOrCreateDefaultPack(senderPhone);

    await ctx.reply(
      [
        '🔗 *COMPARTILHAR PACK COM AMIGOS*',
        `📦 Pack: *${pack.name}*`,
        `📊 Quantidade: *${pack.stickerIds.length} figurinhas*`,
        '',
        '📢 *Copie e envie o texto abaixo para seus amigos:*',
        '────────────────────────────',
        `Olha esse pack de figurinhas que criei no WhatsApp Auto Sticker!`,
        `Envie este comando para o bot:`,
        `*/pack baixar ${pack.name}*`,
        '────────────────────────────',
      ].join('\n')
    );
    return;
  }

  // 5. Baixar / importar pack de amigo
  if (subCommand === 'baixar' || subCommand === 'download' || subCommand === 'importar') {
    if (!rawArg) {
      await ctx.reply('❌ Informe o nome do pack que deseja baixar.\nExemplo: */pack baixar Meme*');
      return;
    }

    const sourcePack = packManager.getPack(rawArg);
    if (!sourcePack) {
      await ctx.reply('❌ Pack não encontrado. Verifique se o nome digitado está correto!');
      return;
    }

    const importedPack = packManager.createPack(
      `${sourcePack.name}`,
      senderPhone,
      `Importado de ${sourcePack.ownerPhone || 'amigo'}`
    );

    for (const stickerId of sourcePack.stickerIds) {
      packManager.addStickerToPack(importedPack.id, stickerId, senderPhone);
    }

    await ctx.reply(
      [
        '🎉 *Pack Importado com Sucesso!*',
        `📦 Nome: *${importedPack.name}*`,
        `📊 Figurinhas adicionadas: *${sourcePack.stickerIds.length}*`,
        '',
        `👉 Para ver o pacote no chat agora mesmo, digite:`,
        `*/pack enviar ${importedPack.name}*`,
      ].join('\n')
    );
    return;
  }

  // 6. Limpar / esvaziar pack
  if (subCommand === 'limpar' || subCommand === 'clear' || subCommand === 'esvaziar') {
    const targetNameOrId = rawArg || 'default';
    const pack =
      targetNameOrId === 'default'
        ? packManager.getOrCreateDefaultPack(senderPhone)
        : packManager.getPack(targetNameOrId, senderPhone) || packManager.getOrCreateDefaultPack(senderPhone);

    packManager.clearPack(pack.id, senderPhone);
    await ctx.reply(`🗑️ *O pack "${pack.name}" foi esvaziado com sucesso!*`);
    return;
  }

  // 7. Adicionar sticker manualmente (respondendo a figurinha)
  if (subCommand === 'add' || subCommand === 'adicionar') {
    const targetNameOrId = rawArg || 'default';
    const pack =
      targetNameOrId === 'default'
        ? packManager.getOrCreateDefaultPack(senderPhone)
        : packManager.getPack(targetNameOrId, senderPhone) || packManager.getOrCreateDefaultPack(senderPhone);

    const quoted = ctx.message.quotedMessage;
    if (!quoted && ctx.message.mediaType !== 'STICKER') {
      await ctx.reply(
        '⚠️ Para adicionar manualmente, responda a uma figurinha com */pack add* ou toque no botão da enquete logo após criar um sticker.'
      );
      return;
    }

    const stickerId = quoted?.id || ctx.message.id;
    packManager.addStickerToPack(pack.id, stickerId, senderPhone);
    await ctx.reply(`📁 *Figurinha adicionada ao pack "${pack.name}"!* Total: ${pack.stickerIds.length}`);
    return;
  }

  // 8. Menu Principal + Enquete Interativa de 1 Toque
  const defaultPack = packManager.getOrCreateDefaultPack(senderPhone);
  const userPacks = packManager.getUserPacks(senderPhone);

  const menuText = [
    '📦 *GERENCIADOR DE PACKS DE FIGURINHAS*',
    '────────────────────────────',
    `⭐ *Meu Pack Principal:* ${defaultPack.stickerIds.length} figurinha(s)`,
    `📁 *Total de Coleções:* ${userPacks.length} pack(s)`,
    '────────────────────────────',
    '',
    '🤖 *Comandos Rápidos:*',
    '• */pack enviar* — Envia o pacote oficial no chat',
    '• */pack criar* — Cria um novo álbum (só digitar o nome)',
    '• */pack lista* — Lista seus packs',
    '• */pack compartilhar* — Compartilha seu pack com amigos',
    '• */pack baixar <nome>* — Baixa o pack de um amigo',
    '• */pack limpar* — Esvazia seu pack atual',
    '',
    '👇 *Ou escolha diretamente na enquete interativa abaixo:*',
  ].join('\n');

  await ctx.reply(menuText);

  if (sock) {
    await sendInteractivePoll(sock, chatId, {
      type: 'pack',
      title: '📦 O que deseja fazer com seu Pack? (Toque abaixo):',
      options: [
        { id: 'send_pack', title: '🚀 Enviar Meu Pack' },
        { id: 'new_pack', title: '➕ Criar Novo Pack' },
        { id: 'share_pack', title: '👥 Compartilhar com Amigos' },
        { id: 'clear_pack', title: '🗑️ Limpar Meu Pack' },
      ],
      metadata: { userPhone: senderPhone },
    });
  }
};
