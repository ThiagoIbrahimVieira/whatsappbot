export const handleHelp = async (ctx) => {
    const helpText = [
        '🤖 *WhatsApp Auto Sticker — Comandos Disponíveis*',
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
    ].join('\n');
    await ctx.reply(helpText);
};
//# sourceMappingURL=help.js.map