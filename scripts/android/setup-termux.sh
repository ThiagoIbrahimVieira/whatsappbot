#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Script de Instalação e Configuração Automática para Android (Termux)
# Otimizado para Xiaomi Redmi Note 14 4G (HyperOS / Android 14)
# ==============================================================================

set -e

echo ""
echo "=================================================================="
echo " 🤖 INSTALADOR DO WHATSAPP AUTO STICKER NO TERMUX (REDMI NOTE 14)"
echo "=================================================================="
echo ""

# 1. Solicita permissão de armazenamento se necessário
if [ ! -d "$HOME/storage" ]; then
    echo "📱 Solicitando permissão de armazenamento do Android..."
    termux-setup-storage || true
fi

# 2. Impede o Android de suspender a CPU
echo "🔋 Ativando Termux Wake-Lock (CPU ativa em segundo plano)..."
termux-wake-lock || true

# 3. Atualiza repositórios e instala dependências do sistema
echo ""
echo "📦 Atualizando pacotes e instalando dependências (Node.js, Git, FFmpeg)..."
pkg update -y
pkg install -y nodejs-lts git ffmpeg python make clang

# 4. Navega até a pasta do projeto
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"
echo "📂 Pasta do projeto: $PROJECT_DIR"

# 5. Instala dependências do npm
echo ""
echo "📥 Instalando bibliotecas do projeto (npm install)..."
npm install

# 6. Compila o TypeScript para JavaScript
echo ""
echo "🔨 Compilando o projeto TypeScript (npm run build)..."
npm run build

# 7. Configura arquivo .env se não existir
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo ""
    echo "📝 Criando arquivo .env a partir do .env.example..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com seu número para usar o Código de Pareamento:"
    echo "    nano .env"
fi

# 8. Configura os atalhos para o Termux:Widget
echo ""
echo "🔘 Configurando botões na tela inicial (Termux:Widget)..."
bash "$PROJECT_DIR/scripts/android/setup-shortcuts.sh"

echo ""
echo "=================================================================="
echo " ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=================================================================="
echo ""
echo "Próximos passos no seu Redmi Note 14:"
echo "1. Abra o arquivo .env e coloque seu número em PAIRING_NUMBER:"
echo "   nano .env"
echo "2. Inicie o bot para pegar seu código de pareamento:"
echo "   npm start"
echo "3. No seu WhatsApp, vá em Aparelhos Conectados > Conectar com número de telefone"
echo "4. Depois adicione o Widget do Termux na tela inicial do seu celular!"
echo ""
