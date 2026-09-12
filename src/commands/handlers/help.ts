import type { CommandHandler } from '../../types/command.js';

export const handleHelp: CommandHandler = async (ctx) => {
  const helpText = [
    '🤖 *𝔗𝔥𝔦𝔞𝔤𝔬 ℑ𝔟𝔯𝔞𝔥𝔦𝔪 | @𝚝𝚑𝚒𝚊𝚐𝚘_𝚙𝚕𝚊𝚢𝚎𝚛𝟾𝟿𝟶*',
    '━━━━━━━━━━━━━━━━━━━━',
    '✨ *Comandos Disponíveis:*',
    '',
    '• */sticker* ou */s* — Converte a mídia enviada ou citada em figurinha',
    '• */static* — Converte em figurinha estática (extrai frame se for vídeo/GIF)',
    '• */video* — Força a conversão em figurinha animada',
    '• */gif* — Converte GIF em figurinha animada',
    '• */info* — Exibe informações técnicas da mídia (tamanho, resolução, duração)',
    '• */status* — Mostra o status do bot, uptime e estatísticas da fila',
    '• */ping* — Testa se o bot está ativo',
    '• */help* — Exibe este menu de ajuda',
    '',
    '_💡 Dica: No modo automático, basta enviar uma foto, vídeo ou GIF diretamente no privado!_',
    '',
    '📸 *Instagram:* @𝚝𝚑𝚒𝚊𝚐𝚘_𝚙𝚕𝚊𝚢𝚎𝚛𝟾𝟿𝟶',
  ].join('\n');

  await ctx.reply(helpText);
};
