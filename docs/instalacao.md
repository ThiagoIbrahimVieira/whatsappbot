# 🚀 Guia de Instalação e Execução

Este guia orienta o processo de instalação e configuração do **WhatsApp Auto Sticker** em diferentes ambientes operacionais.

---

## 📋 Pré-requisitos Gerais

- **Node.js**: Versão 20.x ou superior (Recomendado: Node 22+ LTS).
- **Git**: Para clonar o repositório e receber atualizações.
- **FFmpeg**: Opcional no Windows/Linux (o projeto inclui fallback estático), obrigatório no Termux (Android).
- **Conta de WhatsApp**: Um número ativo com o aplicativo instalado no celular para ler o QR Code de autenticação.

---

## 🪟 Instalação no Windows (Desktop ou Servidor)

1. **Abra o PowerShell ou Terminal:**
   ```powershell
   cd C:\Users\thiag\Documents\Projetos
   git clone https://github.com/ThiagoIbrahimVieira/whatsappbot.git whatsapp-auto-sticker
   cd whatsapp-auto-sticker
   ```

2. **Instale as dependências do projeto:**
   ```powershell
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo de exemplo e ajuste suas preferências:
   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

4. **Compile o projeto (TypeScript para JavaScript):**
   ```powershell
   npm run build
   ```

5. **Inicie o bot:**
   ```powershell
   npm start
   ```
   *Um QR Code será impresso no terminal. Abra o WhatsApp no celular > Aparelhos conectados > Conectar um aparelho e aponte para a tela.*

---

## 🐧 Instalação no Linux / VPS (Ubuntu, Debian, etc.)

1. **Atualize os pacotes do sistema e instale as ferramentas básicas:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y git curl ffmpeg build-essential
   ```

2. **Instale o Node.js 22 LTS (via NodeSource):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Clone o repositório:**
   ```bash
   git clone https://github.com/ThiagoIbrahimVieira/whatsappbot.git whatsapp-auto-sticker
   cd whatsapp-auto-sticker
   ```

4. **Instale dependências e compile:**
   ```bash
   npm install
   npm run build
   ```

5. **Configuração de produção contínua com PM2:**
   Para manter o bot rodando 24/7 mesmo após fechar a sessão SSH ou reiniciar a máquina:
   ```bash
   sudo npm install -g pm2
   pm2 start dist/index.js --name "whatsapp-bot"
   pm2 save
   pm2 startup
   ```

   Para acompanhar os logs em tempo real:
   ```bash
   pm2 logs whatsapp-bot
   ```

---

## 📱 Instalação no Android via Termux

O bot possui suporte de primeira classe para rodar diretamente em celulares Android sem precisar de root, utilizando o aplicativo [Termux](https://termux.dev).

> 💡 **Nota Importante:** No Termux, compilar a biblioteca nativa `sharp` pode ser instável em algumas arquiteturas ARM. O bot detecta automaticamente a ausência do Sharp e aciona o **pipeline nativo FFmpeg**, realizando 100% das conversões com alta fidelidade e total estabilidade.

Para o passo a passo completo e detalhado do Termux, consulte o documento dedicado:
👉 [Guia Completo para Android (Termux)](termux.md)

---

## 🧪 Validando a Instalação

Após instalar, você pode rodar os testes unitários e de integração locais para garantir que tudo está funcionando perfeitamente no seu sistema:

```bash
npm test
```

A suíte executará mais de 130 testes automatizados cobrindo compressão de imagem, filtros FFmpeg, injeção de EXIF e roteamento de mensagens.
