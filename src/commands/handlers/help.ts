import type { CommandHandler } from '../../types/command.js';
import { whatsappClient } from '../../whatsapp/client.js';
import { sendInteractivePoll } from '../../whatsapp/interactive-messages.js';

export const handleHelp: CommandHandler = async (ctx) => {
  const sock = whatsappClient.getSocket();
  const chatId = ctx.message.chatId;

  const helpText = [
    '✨ *WhatsApp Auto Sticker — Comandos Disponíveis*',
    '',
    '🤖 *Gerais:*',
    '• */help* — Mostra esta lista de comandos',
    '• */modo [auto|menu]* — Alterna entre figurinhas instantâneas (auto) ou com menu interativo',
    '• */status* — Estado do bot e estatísticas em tempo real',
    '• */info* — Informações técnicas da fila e sistema',
    '• */ping* — Testa resposta e latência do bot',
    '',
    '🏆 *Ranking & Conquistas:*',
    '• */ranking* ou */top* — Top 10 criadores e sua colocação',
    '• */perfil* ou */me* — Suas estatísticas, nível e progresso',
    '• */vip* ou */pix* — Planos VIP para figurinhas ilimitadas',
    '• */cafe* ou */doar* — Pague um café ou faça uma doação espontânea ao bot',
    '',
    '📦 *Packs & Coleções Pessoais:*',
    '• */pack* — Menu interativo e opções do seu pack',
    '• */pack enviar* — Envia todas as suas figurinhas no chat',
    '• */pack criar <nome>* — Cria um pack personalizado',
    '• */pack lista* — Lista seus packs',
    '• */pack compartilhar* — Compartilha seu pack com amigos',
    '• */pack baixar <id>* — Baixa o pack de um amigo',
    '',
    '🎨 *Criação e Memes:*',
    '• */sticker* ou */s* — Cria figurinha da foto/vídeo respondido',
    '• */meme <texto>* — Gera meme (use | para dividir topo e rodapé)',
    '• */static [segundos|middle]* — Extrai frame estático do vídeo',
    '',
    '✂️ *Efeitos de Imagem:*',
    '• */outline [cor]* — Adiciona contorno ao redor do sticker',
    '• */shadow [soft|hard]* — Projeta sombra suave ou marcada',
    '• */rotate [90|180|270]* — Rotaciona a imagem',
    '• */flip* — Espelha verticalmente',
    '• */mirror* — Espelha horizontalmente',
    '• */crop [square|portrait|auto]* — Corta a imagem',
    '',
    '🎬 *Ferramentas de Vídeo:*',
    '• */trim <segundos>* — Corta o vídeo no tempo especificado',
    '• */fps <8|10|12>* — Ajusta taxa de quadros da animação',
    '• */speed <1.5|2.0>* — Acelera animação',
    '• */slow <0.5>* — Deixa animação em câmera lenta',
    '',
    '🎲 *Aleatório:*',
    '• */random* — Envia um sticker aleatório da biblioteca',
  ].join('\n');

  await ctx.reply(helpText);

  if (sock) {
    await sendInteractivePoll(sock, chatId, {
      type: 'help',
      title: '⚡ Atalhos Rápidos (Toque em uma opção):',
      options: [
        { id: 'help_vip', title: '🌸 Planos VIP' },
        { id: 'help_pack', title: '📦 Meus Packs' },
        { id: 'help_cafe', title: '☕ Pagar um Café' },
        { id: 'help_mode', title: '⚙️ Alternar Modo' },
      ],
    });
  }
};
