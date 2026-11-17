# 📱 Guia de Instalação e Uso no Android (Termux)

Este guia ensina como rodar o **WhatsApp Auto Sticker** diretamente no seu smartphone Android 24 horas por dia, 7 dias por semana, sem precisar de computador e sem necessidade de root.

---

## 📥 1. Instalando o Termux Corretamente

> ⚠️ **Atenção:** NÃO baixe o Termux pela Google Play Store! A versão da Play Store está abandonada e desatualizada. Baixe a versão oficial pelo **F-Droid** ou GitHub:
> - Download via F-Droid: [f-droid.org/packages/com.termux](https://f-droid.org/packages/com.termux/)

---

## ⚙️ 2. Preparando o Ambiente no Termux

Abra o aplicativo Termux e execute a sequência de comandos abaixo:

```bash
# 1. Atualiza os repositórios e pacotes do Termux
pkg update -y && pkg upgrade -y

# 2. Instala o Git, Node.js e o FFmpeg
pkg install -y git nodejs ffmpeg

# 3. Dá permissão de armazenamento para o Termux (toque em Permitir no popup)
termux-setup-storage
```

---

## 📦 3. Clonando o Bot e Instalando Dependências

```bash
# 1. Clone o repositório
git clone https://github.com/ThiagoIbrahimVieira/whatsappbot.git whatsapp-auto-sticker
cd whatsapp-auto-sticker

# 2. Instale as dependências (ignorando scripts nativos que podem falhar no Android)
npm install --ignore-scripts
```

> 💡 **Como o bot roda no Termux sem a biblioteca Sharp?**
> A biblioteca `sharp` requer binários C++ pesados pré-compilados que costumam falhar em processadores ARM de celulares.
> O nosso bot possui detecção inteligente: se o Sharp não estiver instalado, ele aciona automaticamente o **motor nativo FFmpeg**, realizando 100% das conversões de imagens e vídeos com perfeita fidelidade visual!

---

## 🚀 4. Configurando e Iniciando o Bot

```bash
# 1. Crie o arquivo de configuração a partir do modelo
cp .env.example .env

# 2. Edite o .env se desejar (opcional, pode usar o nano)
nano .env

# 3. Inicie o bot
npm start
```

### Escaneando o QR Code no próprio aparelho:
Quando o QR Code aparecer na tela do Termux:
1. Tire um print da tela do Termux com o QR Code.
2. Envie essa imagem para outro aparelho (celular de um amigo, computador ou televisão).
3. No seu WhatsApp, vá em **Aparelhos Conectados > Conectar um aparelho** e aponte para o QR Code na outra tela.

---

## 🔋 5. Mantendo o Bot Rodando 24/7 em Segundo Plano

O Android costuma suspender processos em segundo plano para economizar bateria. Para evitar que o bot pare quando a tela apagar:

1. **Ative o Wake Lock no Termux:**
   Puxe a barra de notificações do Android onde aparece o Termux e toque no botão **Acquire Wakelock** (ou rode `termux-wake-lock` no terminal).
2. **Desative a Otimização de Bateria:**
   Vá nas Configurações do Android > Aplicativos > Termux > Bateria > Escolha **Sem restrições**.
3. **Usando PM2 no Termux:**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "sticker-bot"
   pm2 save
   ```
