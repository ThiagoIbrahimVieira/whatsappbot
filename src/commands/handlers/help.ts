import type { CommandHandler } from '../../types/command.js';

export const handleHelp: CommandHandler = async (ctx) => {
  const helpText = [
    '✨ *WhatsApp Auto Sticker — Comandos Disponíveis*',
    '',
    '🤖 *Gerais:*',
    '• */help* — Mostra esta lista de comandos',
    '• */status* — Estado do bot e estatísticas em tempo real',
    '• */info* — Informações técnicas da fila e sistema',
    '• */ping* — Testa resposta e latência do bot',
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
    '📦 *Biblioteca & Coleções:*',
    '• */random* — Envia um sticker aleatório da biblioteca',
    '• */pack list* — Lista pacotes de figurinhas criados',
    '• */pack create <nome>* — Cria uma nova coleção',
    '• */pack add <nome>* — Adiciona figurinha ao pacote',
  ].join('\n');

  await ctx.reply(helpText);
};
