#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Script de Inicialização Automática com Termux:Boot
# Inicia o serviço do WhatsApp Auto Sticker automaticamente ao ligar o celular
# ==============================================================================

# 1. Impede o Android de suspender o processo do Termux em segundo plano
termux-wake-lock

# 2. Aguarda a rede ficar pronta após a inicialização do aparelho
sleep 10

# 3. Localiza o diretório do projeto
BOT_DIR="$HOME/whatsapp-auto-sticker"

if [ ! -d "$BOT_DIR" ]; then
  # Tenta localizar caso a pasta tenha outro nome comum
  BOT_DIR=$(find "$HOME" -maxdepth 2 -name "whatsapp-auto-sticker" -type d | head -n 1)
fi

if [ -z "$BOT_DIR" ] || [ ! -d "$BOT_DIR" ]; then
  echo "❌ Diretório do bot não encontrado em $HOME" >> "$HOME/bot-boot.log"
  exit 1
fi

cd "$BOT_DIR" || exit 1

# 4. Verifica se já está em execução para evitar duplicidade
if pgrep -f "node.*dist/index.js" > /dev/null; then
  echo "⚠️ O bot já está em execução. Nenhuma ação necessária." >> "$HOME/bot-boot.log"
  exit 0
fi

# 5. Inicia o processo do bot
# NOTA DE ARQUITETURA: Iniciar o processo NÃO força botActive = true.
# O estado de ativação configurado em data/bot-settings.json é estritamente preservado.
nohup node dist/index.js > "$HOME/bot.log" 2>&1 &

echo "✅ [Termux:Boot] WhatsApp Auto Sticker iniciado com PID $! em $(date)" >> "$HOME/bot-boot.log"
