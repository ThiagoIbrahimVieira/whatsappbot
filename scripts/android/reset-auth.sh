#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Limpa as credenciais antigas do WhatsApp para gerar um novo código de pareamento
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "🛑 Encerrando qualquer processo ativo do bot..."
bash "$PROJECT_DIR/scripts/android/stop-bot.sh" 2>/dev/null || true

echo "🧹 Removendo credenciais antigas/desconectadas de auth/..."
rm -rf "$PROJECT_DIR/auth"
mkdir -p "$PROJECT_DIR/auth"

echo ""
echo "✅ Sessão antiga limpa com sucesso!"
echo "📱 Agora inicie o bot para receber o novo código de 8 dígitos:"
echo "   npm start"
echo "   (ou em segundo plano com: bash scripts/android/start-bot.sh)"
echo ""
