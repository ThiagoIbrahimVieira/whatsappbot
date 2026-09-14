import type { CommandHandler } from '../../types/command.js';
import { whatsappClient } from '../../whatsapp/client.js';
import { sendInteractivePoll } from '../../whatsapp/interactive-messages.js';

export const handleHelp: CommandHandler = async (ctx) => {
  const sock = whatsappClient.getSocket();
  const chatId = ctx.message.chatId;

  const helpText = [
    '🤖 *TT Sticker Bot — Guia Rápido*',
    '',
    '📸 *CRIE:*',
    '• Envie fotos, GIFs ou vídeos diretamente',
    '• */sticker* ou */s* — Converte foto/vídeo respondido',
    '• */meme <texto>* — Gera meme (topo | base)',
    '• */static* — Extrai frame estático de vídeo',
    '',
    '📦 *PACKS:*',
    '• */pack* — Gerencie suas coleções',
    '• */pack criar <nome>* — Cria novo pack',
    '• */pack enviar* — Envia o pack completo no chat',
    '',
    '🏆 *CONQUISTAS:*',
    '• */ranking* — Top criadores',
    '• */perfil* — Suas estatísticas e nível',
    '',
    '💎 *VIP:*',
    '• */vip* — Figurinhas ilimitadas e sem espera',
    '',
    '⚙️ *SISTEMA:*',
    '• */modo* — Alterna modo direto (auto) ou interativo (menu)',
    '• */status* — Estado do bot e estatísticas',
    '• */ping* — Testa latência do bot',
  ].join('\n');

  await ctx.reply(helpText);

  if (sock) {
    await sendInteractivePoll(sock, chatId, {
      type: 'help',
      title: '✨ Quer acessar alguma área agora?',
      options: [
        { id: 'help_vip', title: '💎 Planos VIP' },
        { id: 'help_pack', title: '📦 Meus Packs' },
        { id: 'help_ranking', title: '🏆 Ranking' },
        { id: 'help_mode', title: '⚙️ Alternar Modo' },
      ],
    });
  }
};
