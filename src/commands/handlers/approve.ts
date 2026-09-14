import type { CommandHandler } from '../../types/command.js';
import { accessControl } from '../../control/access-control.js';
import { whatsappClient } from '../../whatsapp/client.js';
import { logger } from '../../utils/logger.js';

export const handleApprove: CommandHandler = async (ctx) => {
  // Apenas Thiago (dono / admin do bot) pode executar o comando /aprovar
  const isSelf = ctx.isSelfChat || ctx.message.fromMe;
  if (!isSelf) {
    await ctx.reply('❌ Este comando é exclusivo para o administrador do bot.');
    return;
  }

  let targetPhone = '';
  let targetName = 'Cliente VIP';

  // 1. Verifica se citou / respondeu a uma mensagem de outro usuário
  const raw: any = ctx.message.rawMessage;
  const contextInfo =
    raw?.extendedTextMessage?.contextInfo ||
    raw?.imageMessage?.contextInfo ||
    raw?.videoMessage?.contextInfo ||
    raw?.message?.extendedTextMessage?.contextInfo;

  if (contextInfo?.participant) {
    targetPhone = contextInfo.participant.split('@')[0].split(':')[0];
  } else if (contextInfo?.remoteJid && !contextInfo.remoteJid.endsWith('@g.us')) {
    targetPhone = contextInfo.remoteJid.split('@')[0].split(':')[0];
  }

  // 2. Se não citou mensagem, verifica se passou o número por argumento: /aprovar 5511999998888
  if (!targetPhone && ctx.command.args.length > 0) {
    const candidate = ctx.command.args[0].replace(/\D/g, '');
    if (candidate.length >= 8) {
      targetPhone = candidate;
    }
  }

  // 3. Se estiver em um chat privado (não grupo), usa o próprio contato do chat
  if (!targetPhone && !ctx.message.isGroup && ctx.message.chatId && !ctx.isSelfChat) {
    targetPhone = ctx.message.chatId.split('@')[0].split(':')[0];
  }

  if (!targetPhone) {
    await ctx.reply(
      '⚠️ *Como usar o /aprovar:*\n\n' +
        '1️⃣ *Opção 1:* Responda (cite) o comprovante do cliente com `/aprovar`\n' +
        '2️⃣ *Opção 2:* Digite `/aprovar [número_com_ddd]` (ex: `/aprovar 11999998888`)'
    );
    return;
  }

  // Normaliza telefone com 55 se necessário
  let cleanNumber = targetPhone.replace(/\D/g, '');
  if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    cleanNumber = `55${cleanNumber}`;
  }

  // Determina se é permanente ou mensal
  const isPermanent = ctx.command.args.some(
    (a: string) => a.toLowerCase().includes('perm') || a.toLowerCase().includes('mestre') || a.toLowerCase().includes('vita')
  ) || true; // Por padrão, libera permanente/ilimitado

  // Adiciona o contato na Whitelist
  targetName = `VIP ${cleanNumber.slice(-4)}`;
  accessControl.addContact(targetName, cleanNumber);

  logger.info({ cleanNumber, isPermanent }, 'Usuário aprovado como VIP via comando /aprovar');

  // Envia mensagem de confirmação para o Thiago
  await ctx.reply(
    `✅ *PAGAMENTO APROVADO COM SUCESSO!*\n\n` +
      `👤 *Cliente:* +${cleanNumber}\n` +
      `👑 *Status:* VIP Ilimitado Ativado\n\n` +
      `O cliente já pode criar figurinhas sem nenhum limite diário!`
  );

  // Envia mensagem comemorativa para o cliente no privado dele
  const sock = whatsappClient.getSocket();
  if (sock) {
    const clientJid = `${cleanNumber}@s.whatsapp.net`;
    const congratulationText =
      `🎉 *PAGAMENTO CONFIRMADO!* 🎉\n\n` +
      `Olá! Seu pagamento via Pix foi verificado e o seu plano *👑 VIP Ilimitado* já está ativo na sua conta!\n\n` +
      `✨ *Seus Benefícios Liberados:* \n` +
      `• Figurinhas infinitas sem nenhum limite diário\n` +
      `• Suporte a fotos, vídeos e GIFs animados\n` +
      `• Prioridade máxima no processamento\n\n` +
      `Envie fotos ou vídeos a qualquer momento para transformar em figurinhas. Obrigado pelo apoio e divirta-se! 🚀`;

    try {
      await sock.sendMessage(clientJid, { text: congratulationText });
    } catch (err: any) {
      logger.warn({ err: err?.message, clientJid }, 'Não foi possível enviar mensagem automática para o cliente');
    }
  }
};
