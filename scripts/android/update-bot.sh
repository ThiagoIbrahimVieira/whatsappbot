#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Atualiza o WhatsApp Auto Sticker no Android (Termux)
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

echo "=========================================="
echo "🔄 Atualizando WhatsApp Auto Sticker..."
echo "=========================================="

# 1. Encerra o bot se estiver rodando
if [ -f "scripts/android/stop-bot.sh" ]; then
    echo "🛑 Parando versão anterior do bot..."
    bash scripts/android/stop-bot.sh || true
fi

# 2. Puxa as alterações do repositório
echo "📥 Baixando novidades do Git..."
git pull

# 3. Atualiza dependências se necessário
echo "📦 Verificando dependências npm..."
npm install

# 4. Recompila TypeScript para JavaScript
echo "⚙️ Recompilando o código (build)..."
npm run build

echo "=========================================="
echo "✅ Atualização concluída com sucesso!"
echo "=========================================="
echo "Para ligar o bot novamente:"
echo "  npm start"
echo "Ou pelo atalho em segundo plano:"
echo "  bash scripts/android/start-bot.sh"
