#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Encerra o WhatsApp Auto Sticker no Android (Termux) e libera a memória RAM
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PID_FILE="$PROJECT_DIR/tmp/bot.pid"

STOPPED=false

if [ -f "$PID_FILE" ]; then
    PID="$(cat "$PID_FILE")"
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Encerrando processo do bot (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
        sleep 1
        # Força encerramento se necessário
        if kill -0 "$PID" 2>/dev/null; then
            kill -9 "$PID" 2>/dev/null || true
        fi
        STOPPED=true
    fi
    rm -f "$PID_FILE"
fi

# Garante encerramento de qualquer instância residual de dist/index.js
pkill -f "node.*dist/index.js" 2>/dev/null && STOPPED=true || true

if [ "$STOPPED" = true ]; then
    echo "✅ Bot desligado com sucesso. Memória RAM liberada!"
else
    echo "ℹ️  O bot não estava em execução."
fi
