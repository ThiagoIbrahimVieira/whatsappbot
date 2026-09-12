#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Inicia o WhatsApp Auto Sticker no Android (Termux)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$PROJECT_DIR/tmp/bot.pid"

mkdir -p "$PROJECT_DIR/tmp"

# Verifica se já está rodando
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "⚠️  O bot já está em execução (PID: $(cat "$PID_FILE"))."
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
