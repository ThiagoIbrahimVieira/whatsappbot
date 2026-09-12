# 📱 Guia de Instalação: WhatsApp Auto Sticker no Redmi Note 14 4G

Este guia passo a passo foi preparado especialmente para o **Redmi Note 14 4G (Xiaomi HyperOS / Android 14)**. 

Ao final, você terá dois botões na tela inicial do seu celular:
- 🟢 **Ligar Bot**: Inicia o bot em segundo plano.
- 🔴 **Desligar Bot**: Encerra o bot e libera a memória RAM.

---

## 📥 Passo 1: Instalar o Termux e o Termux:Widget

No Android, instale os dois aplicativos gratuitos pelo **F-Droid** (a versão da Google Play está desatualizada):

1. **Termux**: [Baixar no F-Droid](https://f-droid.org/packages/com.termux/) *(ou baixe o arquivo APK diretamente)*.
2. **Termux:Widget**: [Baixar no F-Droid](https://f-droid.org/packages/com.termux.widget/) *(extensão que coloca os botões na tela inicial)*.

---

## ⚙️ Passo 2: Configurar a Bateria no Xiaomi HyperOS (Muito Importante!)

O HyperOS da Xiaomi encerra aplicativos em segundo plano para economizar bateria. Faça isso uma única vez para o bot nunca cair:

1. Na tela inicial do seu Redmi Note 14, **segure o dedo no ícone do Termux** e toque no ícone de informação **(i)** ou **"Informações do app"**.
2. Toque em **Início automático** e marque **Ativado** (Permitir).
3. Role para baixo até **Economia de bateria** e mude de "Recomendado" para **"Sem restrições"**.
4. Faça o mesmo procedimento para o app **Termux:Widget**.

---

## 📂 Passo 3: Baixar o Projeto no Termux

Abra o aplicativo **Termux** no celular e execute os comandos:

```bash
pkg update -y
pkg install -y git
git clone https://github.com/SEU_USUARIO/whatsapp-auto-sticker.git
cd whatsapp-auto-sticker
```

*(Se você preferir passar a pasta do computador para o celular via cabo USB ou Google Drive/ZIP, basta extrair na memória interna e copiar para o Termux com `termux-setup-storage`)*.

---

## 🔑 Passo 4: Configurar seu Número de WhatsApp (Código de Pareamento)

Como o bot vai rodar no mesmo celular, você **não precisa de câmera nem de QR Code**.

Dentro da pasta do projeto no Termux:
```bash
cp .env.example .env
nano .env
```

Procure a linha `PAIRING_NUMBER=` e coloque seu número com o código do país (55) e o DDD.  
*Exemplo para São Paulo:*
```env
PAIRING_NUMBER=5511999998888
```

Para salvar no nano: pressione `Ctrl` + `O`, dê `Enter`, e depois `Ctrl` + `X`.

---

## 🚀 Passo 5: Executar o Instalador Automático

Execute o script que prepara todo o ambiente no seu Redmi Note 14:

```bash
bash scripts/android/setup-termux.sh
```

Esse script vai:
- Instalar Node.js, Git e FFmpeg nativos do Android.
- Instalar as dependências (`npm install`).
- Compilar o TypeScript (`npm run build`).
- Ativar o `termux-wake-lock` (impede a CPU de dormir).
- Criar os botões de atalho automaticamente.

---

## 📲 Passo 6: Conectar o WhatsApp pela Primeira Vez

1. No Termux, inicie o bot:
   ```bash
   npm start
   ```
2. Após alguns segundos, o bot exibirá na tela o seu código de pareamento de 8 dígitos:
   ```text
   =============================================================
   🔑 CÓDIGO DE PAREAMENTO DO WHATSAPP GERADO:
                     👉  ABCD-1234  👈
   =============================================================
   ```
3. Abra o **WhatsApp** no seu Redmi Note 14:
   - Toque nos **3 pontinhos** no canto superior direito > **Aparelhos conectados**.
   - Toque em **Conectar um aparelho**.
   - No rodapé da tela, toque em **"Conectar com número de telefone"**.
   - Digite o código de 8 dígitos exibido no Termux.
4. Pronto! O WhatsApp informará que o aparelho foi conectado com sucesso.
5. Volte ao Termux e pressione `Ctrl` + `C` para parar (a autenticação já está salva permanentemente na pasta `auth/`).

---

## 🔘 Passo 7: Colocar os Botões na Tela Inicial do Celular

Agora adicione os botões na tela inicial do seu Redmi Note 14:

1. Vá para a tela inicial do seu celular e faça um movimento de pinça (ou segure o dedo em um espaço vazio).
2. Toque em **Widgets**.
3. Role até encontrar a seção **Termux:Widget**.
4. Escolha o widget **Termux Widget** ou **Termux Shortcut**.
5. Selecione:
   - 🟢 `Ligar_Bot.sh`
   - 🔴 `Desligar_Bot.sh`
   - 📄 `Ver_Logs.sh`

---

## 🎉 Como Usar no Dia a Dia

- **Quer ativar o bot?** Basta dar um toque no botão 🟢 **Ligar Bot** na sua tela inicial! O bot iniciará em segundo plano consumindo apenas ~80 MB de RAM.
- **Quer desativar?** Toque em 🔴 **Desligar Bot**. Ele encerra na hora e libera toda a memória do celular.
- **Quer ver o que o bot está fazendo?** Toque em 📄 **Ver Logs**.
