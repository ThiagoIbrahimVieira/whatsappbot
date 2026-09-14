#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Inicia o WhatsApp Auto Sticker no Android (Termux)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$PROJECT_DIR/tmp/bot.pid"

mkdir -p "$PROJECT_DIR/tmp"

# Verifica se já está rodando garantindo que o PID pertence a um processo node ativo
if [ -f "$PID_FILE" ]; then
    PID="$(cat "$PID_FILE" 2>/dev/null | tr -d ' \r\n')"
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null && [ -f "/proc/$PID/cmdline" ] && grep -q "node" "/proc/$PID/cmdline" 2>/dev/null; then
        echo "⚠️  O bot já está em execução (PID: $PID)."
        exit 0
    else
        # PID órfão ou de outro processo do Android -> limpa arquivo antigo
        rm -f "$PID_FILE"
    fi
fi

if pgrep -f "node.*dist/index" 2>/dev/null > /dev/null; then
    echo "⚠️  O bot já está em execução em segundo plano!"
    echo "Para reiniciar, execute primeiro: ./scripts/android/stop-bot.sh"
    exit 0
fi

echo "🔋 Garantindo CPU ativa (Wake-Lock)..."
termux-wake-lock || true

cd "$PROJECT_DIR"

echo "🚀 Iniciando WhatsApp Auto Sticker..."
# Executa em segundo plano e salva logs em tmp/bot.log
nohup node dist/index.js > "$PROJECT_DIR/tmp/bot.log" 2>&1 &
BOT_PID=$!
echo "$BOT_PID" > "$PID_FILE"

sleep 2

if kill -0 "$BOT_PID" 2>/dev/null; then
    echo "✅ Bot iniciado com sucesso em segundo plano (PID: $BOT_PID)!"
    echo "🌐 Painel Web: http://localhost:3000"
    echo "📱 Acesso na rede local: http://<IP-DO-CELULAR>:3000"
    echo "📄 Para ver os logs em tempo real, execute:"
    echo "   tail -f $PROJECT_DIR/tmp/bot.log"
else
    echo "❌ Falha ao iniciar o bot. Verifique o log em:"
    echo "   cat $PROJECT_DIR/tmp/bot.log"
    exit 1
fi
