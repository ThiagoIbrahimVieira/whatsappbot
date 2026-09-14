#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Configura os atalhos para o Termux:Widget no Android
# Cria botões interativos na tela inicial do celular
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SHORTCUTS_DIR="$HOME/.shortcuts"
TASKS_DIR="$HOME/.shortcuts/tasks"

mkdir -p "$SHORTCUTS_DIR"
mkdir -p "$TASKS_DIR"

echo "📂 Criando atalhos em $SHORTCUTS_DIR ..."

# 1. Atalho: Ligar Bot (Executa e mostra status na tela)
cat << EOF > "$SHORTCUTS_DIR/🟢_Ligar_Bot.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$PROJECT_DIR"
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsappbot"
fi
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsapp-auto-sticker"
fi

echo "============================================="
echo "🟢 INICIANDO WHATSAPP AUTO STICKER..."
echo "============================================="
bash "\$PROJECT_DIR/scripts/android/start-bot.sh"
echo ""
echo "Concluído! Pressione Enter para fechar esta janela..."
read -r
EOF

# 2. Atalho: Desligar Bot (Executa e mostra status na tela)
cat << EOF > "$SHORTCUTS_DIR/🔴_Desligar_Bot.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$PROJECT_DIR"
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsappbot"
fi
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsapp-auto-sticker"
fi

echo "============================================="
echo "🔴 PARANDO WHATSAPP AUTO STICKER..."
echo "============================================="
bash "\$PROJECT_DIR/scripts/android/stop-bot.sh"
echo ""
echo "Concluído! Pressione Enter para fechar esta janela..."
read -r
EOF

# 3. Atalho: Ver Logs em Tempo Real
cat << EOF > "$SHORTCUTS_DIR/📄_Ver_Logs.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$PROJECT_DIR"
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsappbot"
fi
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsapp-auto-sticker"
fi

LOG_FILE="\$PROJECT_DIR/tmp/bot.log"
if [ -f "\$LOG_FILE" ]; then
    echo "============================================="
    echo "📄 LOGS DO BOT EM TEMPO REAL"
    echo "Pressione Ctrl+C para sair dos logs."
    echo "============================================="
    tail -n 50 -f "\$LOG_FILE"
else
    echo "Nenhum arquivo de log encontrado ainda."
    echo "Pressione Enter para sair..."
    read -r
fi
EOF

# Cria versão em tasks (executa silenciosamente em background sem abrir terminal)
cat << EOF > "$TASKS_DIR/🟢_Ligar_Bot.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$PROJECT_DIR"
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsappbot"
fi
bash "\$PROJECT_DIR/scripts/android/start-bot.sh"
EOF

cat << EOF > "$TASKS_DIR/🔴_Desligar_Bot.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$PROJECT_DIR"
if [ ! -d "\$PROJECT_DIR" ]; then
    PROJECT_DIR="\$HOME/whatsappbot"
fi
bash "\$PROJECT_DIR/scripts/android/stop-bot.sh"
EOF

# Configura inicialização com Termux:Boot se a pasta existir
BOOT_DIR="$HOME/.termux/boot"
mkdir -p "$BOOT_DIR"
cp "$PROJECT_DIR/scripts/android/termux-boot-bot.sh" "$BOOT_DIR/start-bot.sh"
chmod +x "$BOOT_DIR/start-bot.sh"

chmod +x "$SHORTCUTS_DIR"/*.sh
chmod +x "$TASKS_DIR"/*.sh
chmod +x "$PROJECT_DIR/scripts/android"/*.sh 2>/dev/null || true

echo "✅ Atalhos configurados com sucesso!"
echo "   - 🟢_Ligar_Bot.sh"
echo "   - 🔴_Desligar_Bot.sh"
echo "   - 📄_Ver_Logs.sh"
echo ""
echo "📱 No seu celular, adicione o Widget do 'Termux:Widget' na tela inicial para usar!"
