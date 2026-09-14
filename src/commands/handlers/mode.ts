import type { CommandHandler } from '../../types/command.js';
import { botState } from '../../control/bot-state.js';
import { whatsappClient } from '../../whatsapp/client.js';
import { sendInteractivePoll } from '../../whatsapp/interactive-messages.js';

export const handleMode: CommandHandler = async (ctx) => {
  const arg = (ctx.command.args[0] || '').toLowerCase().trim();

  if (arg === 'auto' || arg === 'automatico' || arg === 'automático') {
    botState.setProcessingMode('automatic');
    await ctx.reply(
      '⚡ *Modo Automático ativado!*\n\nAgora você pode enviar fotos e vídeos que eles virarão figurinhas *imediatamente*, inclusive se você mandar *várias fotos de uma vez*!'
    );
    return;
  }

  if (arg === 'menu' || arg === 'interativo' || arg === 'interactive') {
    botState.setProcessingMode('interactive');
    await ctx.reply(
      '📱 *Modo Interativo (Menu) ativado!*\n\nAo enviar fotos ou vídeos, o bot exibirá o menu com opções de memes, bordas, sombras e efeitos.'
    );
    return;
  }

  const current = botState.getSettings().processingMode;
  const currentLabel = current === 'automatic' ? '⚡ Automático (Sem menu)' : '📱 Interativo (Com menu)';

  await ctx.reply(
    `⚙️ *Modo Atual:* ${currentLabel}\nComo você prefere que o bot responda às suas mídias?`
  );

  const sock = whatsappClient.getSocket();
  if (sock) {
    await sendInteractivePoll(sock, ctx.message.chatId, {
      type: 'mode',
      title: '⚙️ Escolha o modo desejado:',
      options: [
        { id: 'mode_auto', title: '⚡ Automático (Criação Direta)' },
        { id: 'mode_interactive', title: '📱 Interativo (Com Menu)' },
      ],
    });
  }
};

