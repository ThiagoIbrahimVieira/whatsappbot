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

# 1. Atalho: Ligar Bot (Executa e mostra notificação/status)
cat << 'EOF' > "$SHORTCUTS_DIR/🟢_Ligar_Bot.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$HOME/whatsapp-auto-sticker"
if [ ! -d "$PROJECT_DIR" ]; then
    # Fallback caso a pasta tenha outro nome
    PROJECT_DIR="$(find "$HOME" -maxdepth 2 -name "whatsapp-auto-sticker" | head -n 1)"
fi

bash "$PROJECT_DIR/scripts/android/start-bot.sh"
EOF

# 2. Atalho: Desligar Bot
cat << 'EOF' > "$SHORTCUTS_DIR/🔴_Desligar_Bot.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$HOME/whatsapp-auto-sticker"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="$(find "$HOME" -maxdepth 2 -name "whatsapp-auto-sticker" | head -n 1)"
fi

bash "$PROJECT_DIR/scripts/android/stop-bot.sh"
EOF

# 3. Atalho: Ver Logs em Tempo Real
cat << 'EOF' > "$SHORTCUTS_DIR/📄_Ver_Logs.sh"
#!/data/data/com.termux/files/usr/bin/bash
PROJECT_DIR="$HOME/whatsapp-auto-sticker"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="$(find "$HOME" -maxdepth 2 -name "whatsapp-auto-sticker" | head -n 1)"
fi

LOG_FILE="$PROJECT_DIR/tmp/bot.log"
if [ -f "$LOG_FILE" ]; then
    echo "Pressione Ctrl+C para sair dos logs."
    echo "-------------------------------------"
    tail -n 50 -f "$LOG_FILE"
else
    echo "Nenhum arquivo de log encontrado ainda."
fi
EOF

# Também cria versão silenciosa em tasks (para rodar sem abrir tela se o usuário preferir)
cp "$SHORTCUTS_DIR/🟢_Ligar_Bot.sh" "$TASKS_DIR/🟢_Ligar_Bot.sh"
cp "$SHORTCUTS_DIR/🔴_Desligar_Bot.sh" "$TASKS_DIR/🔴_Desligar_Bot.sh"

chmod +x "$SHORTCUTS_DIR"/*.sh
chmod +x "$TASKS_DIR"/*.sh
chmod +x "$PROJECT_DIR/scripts/android"/*.sh 2>/dev/null || true

echo "✅ Atalhos configurados com sucesso!"
echo "   - 🟢_Ligar_Bot.sh"
echo "   - 🔴_Desligar_Bot.sh"
echo "   - 📄_Ver_Logs.sh"
echo ""
echo "📱 No seu celular, adicione o Widget do 'Termux:Widget' na tela inicial para usar!"
