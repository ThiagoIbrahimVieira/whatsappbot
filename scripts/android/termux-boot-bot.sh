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
BOT_DIR="$HOME/whatsappbot"
if [ ! -d "$BOT_DIR" ]; then
  BOT_DIR="$HOME/whatsapp-auto-sticker"
fi
if [ ! -d "$BOT_DIR" ]; then
  BOT_DIR=$(find "$HOME" -maxdepth 2 -name "whatsappbot" -o -name "whatsapp-auto-sticker" -type d | head -n 1)
fi

if [ -z "$BOT_DIR" ] || [ ! -d "$BOT_DIR" ]; then
  echo "❌ Diretório do bot não encontrado em $HOME" >> "$HOME/bot-boot.log"
  exit 1
fi

cd "$BOT_DIR" || exit 1

# 4. Inicia o processo usando start-bot.sh
bash "$BOT_DIR/scripts/android/start-bot.sh" >> "$HOME/bot-boot.log" 2>&1

echo "✅ [Termux:Boot] WhatsApp Auto Sticker disparado em $(date)" >> "$HOME/bot-boot.log"
