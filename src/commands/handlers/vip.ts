import type { CommandHandler } from '../../types/command.js';
import { accessControl } from '../../control/access-control.js';
import { dailyLimitStore } from '../../control/daily-limit-store.js';
import { botState } from '../../control/bot-state.js';
import { generatePixPayload, generatePixQrBuffer } from '../../utils/pix.js';
import {
  sendPixPaymentMessages,
  sendInteractivePoll,
} from '../../whatsapp/interactive-messages.js';
import { whatsappClient } from '../../whatsapp/client.js';

export const handleVip: CommandHandler = async (ctx) => {
  const sock = whatsappClient.getSocket();
  const chatId = ctx.message.chatId;
  const senderPhone =
    ctx.senderPhone ||
    (ctx.message.senderJid || ctx.message.chatId || '').split(':')[0].split('@')[0];

  const settings = botState.getSettings();
  const contacts = accessControl.getContacts();
  const isVip =
    ctx.isSelfChat ||
    contacts.some((c) => c.phone.replace(/\D/g, '') === senderPhone.replace(/\D/g, ''));

  const subCommand = (ctx.command.args[0] || '').toLowerCase();
  const fullText = (ctx.command.name + ' ' + ctx.command.args.join(' ')).toLowerCase();
  const pixKey = settings.pixKey || '41496413-db85-4757-8279-c323c8f575e5';
  const beneficiaryName = 'THIAGO IBRAHIM';
  const city = 'SAO PAULO';

  const isExplicitPixOrPlans =
    ctx.command.name === 'planos' ||
    ctx.command.name === 'cafe' ||
    ctx.command.name === 'doar' ||
    ctx.command.name === 'doacao' ||
    subCommand === 'planos' ||
    subCommand === 'pro' ||
    subCommand === 'mestre' ||
    subCommand === 'beneficios' ||
    subCommand === 'cafe' ||
    subCommand === 'doar' ||
    subCommand === 'doacao' ||
    subCommand === '1' ||
    subCommand === '2' ||
    subCommand === '3' ||
    fullText.includes('pix') ||
    fullText.includes('planos');

  // 1.5 Fluxo: Doação espontânea / Me pague um café!
  if (
    ctx.command.name === 'cafe' ||
    ctx.command.name === 'doar' ||
    ctx.command.name === 'doacao' ||
    subCommand === 'cafe' ||
    subCommand === 'doar' ||
    subCommand === 'doacao'
  ) {
    const cafeText = [
      '☕ *ME PAGUE UM CAFÉ / APOIE O BOT!*',
      '────────────────────────────',
      'Gostou do bot e quer apoiar o desenvolvedor a manter os servidores rápidos e online?',
      'Qualquer contribuição de coração é muito bem-vinda! ❤️',
      '',
      '🔑 *Chave Pix Aleatória:*',
      'A chave está isolada na mensagem logo abaixo para você copiar com 1 toque:',
    ].join('\n');
    await ctx.reply(cafeText);
    await ctx.reply(pixKey);
    await ctx.reply('❤️ *Muito obrigado pelo carinho e por apoiar o projeto!*');
    return;
  }

  // 1. Se já for VIP ou o próprio Thiago (e NÃO pediu explicitamente para ver planos ou gerar Pix)
  if (isVip && !isExplicitPixOrPlans) {
    const vipText = [
      '👑 *VOCÊ É UM ASSINANTE VIP!* 👑',
      '──────────────────────',
      'Status: 🟢 *Ativo (Acesso Ilimitado)*',
      '',
      '💎 *Seus Benefícios Exclusivos:*',
      '• ✨ Criação ilimitada de figurinhas todos os dias',
      '• 🎬 Vídeos e animações longas em alta fidelidade',
      '• 🎨 Memes com card moderno e bordas personalizadas',
      '• ⚡ Fila prioritária sem tempo de espera',
      '',
      '💡 *Dica:* Para testar o pagamento Pix, envie */pix pro* ou escolha abaixo:',
      '',
      'Obrigado pelo apoio! Crie figurinhas à vontade 🚀',
    ].join('\n');

    await ctx.reply(vipText);

    await sendInteractivePoll(sock, chatId, {
      type: 'vip',
      title: '🧪 Simular Planos VIP (Toque na opção):',
      options: [
        { id: 'vip_pro', title: '🌸 VIP Pro (30 dias) - R$ 5,00' },
        { id: 'vip_mestre', title: '👑 VIP Mestre (Permanente) - R$ 10,00' },
        { id: 'vip_beneficios', title: '💎 Ver Benefícios' },
      ],
    });
    return;
  }

  // 2. Fluxo: Gerar Pix do VIP Pro (R$ 5,00)
  if (
    subCommand === 'pro' ||
    subCommand === '1' ||
    fullText.includes('pix_pro') ||
    fullText.includes('pix pro')
  ) {
    const amount = 5.0;
    const amountText = 'R$ 5,00 (Mensal - 30 dias)';
    const pixPayload = generatePixPayload({
      key: pixKey,
      name: beneficiaryName,
      city,
      amount,
      txid: '***',
    });

    const qrBuffer = await generatePixQrBuffer(pixPayload);
    await sendPixPaymentMessages(sock, chatId, {
      planName: '🌸 VIP Pro (30 dias)',
      amountText,
      qrBuffer,
      pixPayload,
      pixKey,
    });
    return;
  }

  // 3. Fluxo: Gerar Pix do VIP Mestre / Permanente (R$ 10,00)
  if (
    subCommand === 'mestre' ||
    subCommand === 'vitalicio' ||
    subCommand === 'perm' ||
    subCommand === 'permanente' ||
    subCommand === '2' ||
    fullText.includes('pix_mestre') ||
    fullText.includes('pix mestre')
  ) {
    const amount = 10.0;
    const amountText = 'R$ 10,00 (Vitalício / Permanente)';
    const pixPayload = generatePixPayload({
      key: pixKey,
      name: beneficiaryName,
      city,
      amount,
      txid: '***',
    });

    const qrBuffer = await generatePixQrBuffer(pixPayload);
    await sendPixPaymentMessages(sock, chatId, {
      planName: '👑 VIP Mestre (Permanente)',
      amountText,
      qrBuffer,
      pixPayload,
      pixKey,
    });
    return;
  }

  // 4. Fluxo: Ver Benefícios
  if (
    subCommand === 'beneficios' ||
    subCommand === 'vantagens' ||
    subCommand === '3' ||
    fullText.includes('beneficios')
  ) {
    const benefitsText = [
      '🌟 *TODOS OS BENEFÍCIOS DO VIP:*',
      '────────────────────────────',
      '✅ *Sem Limite Diário:* Crie quantas figurinhas quiser 24h por dia.',
      '✅ *Vídeos e GIFs:* Envie vídeos de até 10s e GIFs que viram figurinhas animadas fluidas.',
      '✅ *Fotos em Alta Resolução:* Converte com preservação de nitidez e proporção quadrada.',
      '✅ *Fila Prioritária:* Suas figurinhas são processadas na frente de outros usuários.',
      '✅ *Memes e Efeitos:* Suporte a modo meme superior/inferior e molduras.',
      '',
      '💡 *Escolha seu plano abaixo tocando no botão:*',
    ].join('\n');

    await ctx.reply(benefitsText);

    await sendInteractivePoll(sock, chatId, {
      type: 'vip',
      title: '🌸 ESCOLHA SEU PLANO (Toque para ativar):',
      values: [
        '🌸 VIP Pro (30 dias) - R$ 5,00',
        '👑 VIP Mestre (Permanente) - R$ 10,00',
      ],
    });
    return;
  }

  // 5. Fluxo: Menu dos Planos (Chamado por /planos ou /vip planos ou botão)
  if (
    ctx.command.name === 'planos' ||
    subCommand === 'planos' ||
    subCommand === 'assinar' ||
    subCommand === 'vip' ||
    fullText.includes('planos') ||
    fullText.includes('ativar_vip') ||
    fullText.includes('ativar vip')
  ) {
    const plansText = [
      '🔓 *PLANOS VIP & APOIO AO PROJETO*',
      '👑 *Desbloqueie o Bot sem limites.*',
      '',
      'Ative o VIP e aproveite uma experiência completa, com mais liberdade, velocidade, prioridade e recursos exclusivos. ❤️',
      '',
      '✨ *Vantagens do VIP:*',
      '✅ Crie quantas figurinhas quiser sem limite diário',
      '✅ Transforme fotos, vídeos e GIFs em figurinhas',
      '✅ Prioridade máxima na conversão',
      '✅ Metadados oficiais personalizados (@𝚝.𝚒𝚋𝚛𝚑𝚡_)',
      '',
      '────────────────────────────',
      '🌸 *VIP Pro (30 dias) — R$ 5,00*',
      '⭐ Crie à vontade durante 1 mês inteiro.',
      '',
      '👑 *VIP Mestre (Permanente) — R$ 10,00*',
      '⭐ Acesso ilimitado PARA SEMPRE (sem renovações).',
      '────────────────────────────',
      '☕ *Apoie com um Café:* Use nossa chave Pix para doações espontâneas de qualquer valor!',
      '',
      '⏳ *Prazo de ativação:* de *5 a 10 horas* após o envio do comprovante para conferência manual.',
      '',
      '👇 *Toque em uma das opções abaixo para gerar o Pix:*',
    ].join('\n');

    await ctx.reply(plansText);

    await sendInteractivePoll(sock, chatId, {
      type: 'vip',
      title: '🌸 ESCOLHA SEU PLANO VIP (Toque na opção):',
      options: [
        { id: 'vip_pro', title: '🌸 VIP Pro (30 dias) - R$ 5,00' },
        { id: 'vip_mestre', title: '👑 VIP Mestre (Permanente) - R$ 10,00' },
        { id: 'vip_beneficios', title: '💎 Ver Benefícios' },
      ],
    });
    return;
  }

  // 6. Fluxo Padrão: Aviso de Limite / Status (Print 1)
  const usedToday = dailyLimitStore.getDailyCount(senderPhone);
  const limit = settings.dailyFreeLimit || 5;

  const limitAlertText = [
    '💖 *Continue criando agora*',
    '⭐ *Quer fazer mais figurinhas hoje? Com VIP, você cria à vontade.*',
    '',
    '⌛ *Próximas grátis em:* Meia-noite (00:00)',
    `📌 *Uso gratuito:* ${usedToday}/${limit} utilizado`,
  ].join('\n');

  await ctx.reply(limitAlertText);

  await sendInteractivePoll(sock, chatId, {
    type: 'vip',
    title: '⭐ Deseja assinar o VIP? Toque na opção:',
    options: [
      { id: 'vip_pro', title: '🌸 VIP Pro (30 dias) - R$ 5,00' },
      { id: 'vip_mestre', title: '👑 VIP Mestre (Permanente) - R$ 10,00' },
      { id: 'vip_beneficios', title: '💎 Conhecer Benefícios VIP' },
    ],
  });
};
