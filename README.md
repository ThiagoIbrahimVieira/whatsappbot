# WhatsApp Auto Sticker — Bot Pessoal com o Próprio Número

Um aplicativo pessoal em **Node.js** e **TypeScript** que conecta a **sua própria conta de WhatsApp** (via WhatsApp Web / Baileys) para transformar mídias recebidas em conversas privadas (1x1) automaticamente em figurinhas (estáticas e animadas) compatíveis com o WhatsApp e enviá-las de volta para a mesma conversa.

---

## Índice

1. [Objetivo](#objetivo)
2. [Como Funciona](#como-funciona)
3. [O que Processa](#o-que-processa)
4. [O que Ignora](#o-que-ignora)
5. [Regra Absoluta de Grupos](#regra-absoluta-de-grupos)
6. [Prevenção de Loops e Mensagens Próprias](#prevenção-de-loops-e-mensagens-próprias)
7. [Arquitetura do Sistema](#arquitetura-do-sistema)
8. [Tecnologias Utilizadas (Guia Didático)](#tecnologias-utilizadas-guia-didático)
   - [8.1 Node.js](#81-nodejs)
   - [8.2 TypeScript](#82-typescript)
   - [8.3 Baileys](#83-baileys)
   - [8.4 Sharp](#84-sharp)
   - [8.5 FFmpeg](#85-ffmpeg)
   - [8.6 Zod](#86-zod)
   - [8.7 Pino](#87-pino)
   - [8.8 Vitest](#88-vitest)
9. [Fila em Memória e Concorrência](#fila-em-memória-e-concorrência)
10. [Comandos Manuais](#comandos-manuais)
11. [Requisitos do Sistema](#requisitos-do-sistema)
12. [Instalação Passo a Passo](#instalação-passo-a-passo)
13. [Configuração (`.env`)](#configuração-env)
14. [Autenticação e Primeira Execução](#autenticação-e-primeira-execução)
15. [Processamento de Mídia em Detalhes](#processamento-de-mídia-em-detalhes)
    - [Imagem (Sharp)](#imagem-sharp)
    - [Vídeo (FFmpeg)](#vídeo-ffmpeg)
    - [GIF (FFmpeg & Sharp)](#gif-ffmpeg--sharp)
16. [Segurança e Cleanup](#segurança-e-cleanup)
17. [Testes Automatizados](#testes-automatizados)
18. [Troubleshooting (Solução de Problemas)](#troubleshooting-solução-de-problemas)
19. [Limitações](#limitações)
20. [Aviso sobre Integração Não Oficial](#aviso-sobre-integração-não-oficial)

---

## Objetivo

O objetivo deste projeto é fornecer uma ferramenta pessoal, silenciosa e automatizada que opera utilizando o seu próprio número de telefone. Quando um amigo lhe envia uma foto, vídeo curto ou GIF em uma conversa individual, o programa:

1. Detecta a mídia recebida em tempo real.
2. Faz o download com segurança em uma pasta temporária isolada.
3. Processa e redimensiona a mídia para o formato e dimensões oficiais de figurinha do WhatsApp (512x512 WebP).
4. Aplica compressão inteligente para respeitar os limites do WhatsApp.
5. Injeta metadados de pacote (EXIF) para que a figurinha possa ser salva nos favoritos.
6. Envia a figurinha automaticamente na mesma conversa.
7. Remove todos os arquivos temporários criados para a conversão.

> [!IMPORTANT]
> O bot **NÃO** é um chatbot, **NÃO** responde a mensagens de texto normais, **NÃO** funciona em grupos, **NÃO** faz disparos em massa e **NÃO** tenta burlar mecanismos de segurança.

---

## Como Funciona

```
Amigo (Conversa Privada)
   │
   ▼ [Envia Foto, Vídeo ou GIF]
Meu WhatsApp (Celular/Conta)
   │
   ▼ [Evento Baileys: messages.upsert]
WhatsApp Auto Sticker (Computador Local)
   │
   ├── É Grupo? ────────────► SIM: DESCARTA IMEDIATAMENTE (Sem download, sem resposta)
   ├── É Próprio Número? ───► SIM: DESCARTA IMEDIATAMENTE (Evita loop)
   ├── É Texto/Áudio/Doc? ──► SIM: DESCARTA IMEDIATAMENTE
   │
   ▼ [Mídia Suportada em Privado]
Fila de Jobs (Concorrência Máxima = 2)
   │
   ├── IMAGE ───────────────► Sharp (Canvas 512x512, contain, alfa, WebP)
   ├── VIDEO ───────────────► FFmpeg (Corte primeiros 10s, sem áudio, 512x512, WebP animado)
   └── GIF ─────────────────► FFmpeg (WebP animado com loop infinito)
   │
   ▼ [Injeção de Metadados EXIF]
StickerSender (Baileys)
   │
   ▼
Conversa Privada recebe a figurinha
```

---

## O que Processa

Em conversas privadas (1x1), no modo automático:
- **Imagens** (`JPG`, `JPEG`, `PNG`, `WEBP`) ➔ Figurinha estática WebP (512x512).
- **Vídeos** (`MP4`, `3GP`, `MOV`) ➔ Figurinha animada WebP (512x512, até 10 segundos, sem áudio).
- **GIFs** ➔ Figurinha animada WebP (ou estática se tiver apenas 1 frame).

---

## O que Ignora

Qualquer outro tipo de mensagem é sumariamente ignorado:
- ❌ **Mensagens em Grupos** (independente do tipo ou comando).
- ❌ **Mensagens enviadas por você mesmo** (`fromMe = true`).
- ❌ **Mensagens de texto normais** ("olá", "kkkk").
- ❌ **Mensagens de áudio e notas de voz**.
- ❌ **Documentos e PDFs**.
- ❌ **Figurinhas recebidas**.
- ❌ **Contatos e Localizações**.
- ❌ **Atualizações de Status e Newsletters**.

---

## Regra Absoluta de Grupos

A regra número 1 do sistema é: **`GROUP = IGNORE`**.

Qualquer mensagem recebida cujo remetente pertença a um grupo (`@g.us`) é descartada **antes** de:
- Baixar qualquer byte de mídia;
- Tocar no disco rígido;
- Acionar o Sharp ou FFmpeg;
- Criar um job na fila;
- Enviar qualquer resposta ou reação.

Até mesmo comandos manuais como `/ping` ou `/help` **não** respondem em grupos. O bot é 100% invisível em grupos.

---

## Prevenção de Loops e Mensagens Próprias

Como o aplicativo conecta a sua **própria conta**, quando o bot envia uma figurinha de volta, o WhatsApp dispara um evento de mensagem enviada com o seu número (`fromMe = true`).

Para evitar um loop infinito (`foto ➔ sticker ➔ novo evento ➔ sticker...`):
1. **Filtro de Mensagens Próprias:** A verificação `key.fromMe === true` descarta o evento imediatamente quando `IGNORE_OWN_MESSAGES=true`.
2. **Deduplicação de MessageId:** Um cache LRU com TTL em memória registra os IDs de mensagens recentemente processadas. Se o WhatsApp retransmitir a mesma mensagem, ela não será reprocessada.

---

## Arquitetura do Sistema

O projeto adota o princípio de responsabilidade única e separação em camadas:

```
src/
├── app/                  # Bootstrap e gerenciamento do ciclo de vida
├── config/               # Configuração singleton validada com Zod
├── whatsapp/             # Camada do WhatsApp (Baileys, Auth, Router, Downloader, Sender)
├── media/                # Processamento de mídia (Sharp, FFmpeg, Metadados EXIF)
├── commands/             # Parser e handlers de comandos manuais no privado
├── queue/                # Fila em memória com controle de concorrência
├── utils/                # Utilitários de arquivo, logger (Pino), erros e cache
└── types/                # Definições de tipos TypeScript estritos
```

### Por que WhatsApp e Processamento de Mídia estão separados?
O `WhatsAppClient` não deve saber manipular imagens ou invocar o FFmpeg. Da mesma forma, o `ImageProcessor` e o `VideoProcessor` operam puramente sobre arquivos e buffers, sem conhecer o Baileys ou o protocolo do WhatsApp. Isso torna o código desacoplado, modular e facilmente testável via mocks.

---

## Tecnologias Utilizadas (Guia Didático)

### 8.1 Node.js
O **Node.js** é o ambiente de execução (runtime) JavaScript server-side construído sobre o motor V8 do Google Chrome.
- **Event Loop:** Permite que o bot lide com múltiplos eventos de mensagens I/O concorrentes de forma não bloqueante em uma única thread principal.
- **Streams e Buffers:** Utilizados para manipular dados binários de mídias e chunks de áudio/vídeo sem carregar arquivos inteiros de forma ineficiente na memória.
- **Child Processes (`execFile`):** Executa o binário do FFmpeg diretamente em um processo filho isolado, sem passar pelo shell do sistema operacional, prevenindo injeções de comando.

### 8.2 TypeScript
O **TypeScript** adiciona tipagem estática ao JavaScript, detectando erros de contrato e propriedades indefinidas em tempo de compilação.
- Nenhum uso de `any` sem justificativa.
- Interfaces estritas para mensagens (`ExtractedMessage`), mídias (`MediaInfo`, `ProcessingResult`), comandos (`CommandContext`) e configurações (`AppConfig`).

### 8.3 Baileys
O **Baileys** (`@whiskeysockets/baileys`) é uma biblioteca TypeScript/Node.js que se conecta aos servidores do WhatsApp através do protocolo WhatsApp Web (WebSocket multi-device com criptografia de ponta a ponta).
- **Autenticação Multi-Device:** Salva chaves criptográficas na pasta `auth/`, mantendo a sessão persistente após o primeiro escaneamento do QR Code.
- **Descriptografia de Mídia:** Baixa os arquivos de mídia criptografados e os descriptografa em memória usando `downloadMediaMessage`.
- **Envio de Sticker:** Empacota o buffer WebP com a flag de sticker `{ sticker: buffer }`.

### 8.4 Sharp
O **Sharp** é uma biblioteca de alta performance para processamento de imagens baseada na biblioteca nativa `libvips`.
- **Orientação EXIF:** Corrige automaticamente a rotação da foto com `.rotate()`.
- **Canvas 512x512:** Redimensiona a imagem com `fit: 'contain'` e fundo transparente `{ r: 0, g: 0, b: 0, alpha: 0 }`, garantindo que fotos verticais ou horizontais nunca fiquem esticadas ou distorcidas.
- **Compressão Adaptativa:** Ajusta dinamicamente a qualidade de 85 até 30 se o WebP exceder o limite seguro do WhatsApp.

### 8.5 FFmpeg
O **FFmpeg** é a ferramenta padrão da indústria para decodificação, conversão e manipulação de fluxos multimídia.
- **Por que não usar JavaScript puro para vídeos?** Codificar vídeo exige controle de codecs de alta intensidade matemática (`libwebp_anim`), temporização de quadros e descarte de faixas de áudio que são impraticáveis em JS puro.
- **Conceitos Essenciais:**
  - *Stream:* Fluxo contínuo de dados (fluxo de vídeo e fluxo de áudio). Usamos `-an` para eliminar a faixa de áudio.
  - *Frames & FPS (Frames Per Second):* A quantidade de quadros exibidos por segundo. Usamos entre 10 e 12 FPS para figurinhas fluidas sem tamanho excessivo.
  - *Scale & Pad:* O filtro `scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0` redimensiona o vídeo para caber perfeitamente no quadro de 512x512 com bordas transparentes.
  - *Loop:* `-loop 0` instrui o container WebP a reproduzir a animação continuamente no WhatsApp.

### 8.6 Zod
O **Zod** é uma biblioteca de declaração e validação de esquemas TypeScript-first.
- Garante que variáveis de ambiente como `MAX_CONCURRENT_JOBS` e `MAX_IMAGE_SIZE_MB` sejam números válidos.
- Realiza o parse seguro de strings booleanas no `.env` (evitando o bug clássico de `Boolean("false") === true`).

### 8.7 Pino
O **Pino** é um logger JSON estruturado de altíssima velocidade.
- Registra eventos claros para observabilidade (`whatsapp_connected`, `message_ignored_group`, `sticker_generated`, etc.).
- Utiliza `pino-pretty` em ambiente de desenvolvimento para exibição colorida e legível no console.

### 8.8 Vitest
O **Vitest** é um framework de testes unitários ultrarrápido nativo para TypeScript e ESM.
- 100% dos testes executam sem depender de uma conexão ativa com o WhatsApp, usando mocks precisos do socket Baileys.

---

## Fila em Memória e Concorrência

Processar imagens com Sharp consome pouca CPU, mas transcodificar vídeos com FFmpeg consome poder computacional significativo.

Se 5 pessoas enviarem vídeos longos ao mesmo tempo, processar todos simultaneamente poderia travar o seu computador. A **`JobQueue`** limita o processamento simultâneo a **2 jobs por padrão** (`MAX_CONCURRENT_JOBS=2`), mantendo os demais em espera e processando-os em ordem.

---

## Comandos Manuais

Em conversas privadas, você ou a outra pessoa podem utilizar comandos manuais:

| Comando | Descrição |
| :--- | :--- |
| `/sticker` ou `/s` | Transforma a mídia enviada ou citada (respondida) em figurinha. |
| `/static` | Força a criação de uma figurinha estática (extrai 1 frame se for vídeo/GIF). |
| `/video` | Força o pipeline de figurinha animada. |
| `/gif` | Converte um GIF em figurinha animada. |
| `/info` | Exibe metadados técnicos da mídia (tamanho, formato, resolução, duração). |
| `/status` | Exibe o status da conexão, tempo de atividade (uptime) e métricas da fila. |
| `/ping` | Responde `pong` para confirmar que o bot está online. |
| `/help` | Exibe a lista de comandos no chat. |

> [!NOTE]
> Nenhum comando funciona em grupos. Em grupos, comandos são ignorados silenciosamente.

---

## Requisitos do Sistema

- **Node.js:** Versão 20.x ou superior (Recomendado 22+ ou 24+).
- **Sistema Operacional:** Windows 10/11, macOS ou Linux.
- **FFmpeg:** O projeto já inclui `ffmpeg-static` automaticamente, mas você também pode utilizar o FFmpeg instalado no sistema operacional.

---

## Instalação Passo a Passo

### 1. Entrar na pasta do projeto
```powershell
cd C:\Users\thiag\.gemini\antigravity-ide\scratch\whatsapp-auto-sticker
```

### 2. Instalar dependências
```powershell
npm install
```

### 3. Configurar o `.env`
Copie o arquivo de exemplo:
```powershell
cp .env.example .env
```

---

## Configuração (`.env`)

```env
# Modo de ambiente
NODE_ENV=development

# Habilitação geral de stickers automáticos
AUTO_STICKER=true
AUTO_IMAGE=true
AUTO_VIDEO=true
AUTO_GIF=true

# Filtros (IGNORE_GROUPS deve ser sempre true)
IGNORE_GROUPS=true
IGNORE_OWN_MESSAGES=true

# Comandos manuais no privado
COMMANDS_ENABLED=true

# Limites de tamanho de entrada (em MB)
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=20
MAX_GIF_SIZE_MB=20

# Duração máxima para vídeo (em segundos)
MAX_VIDEO_DURATION_SECONDS=10

# Limite de processamento concorrente
MAX_CONCURRENT_JOBS=2

# Modo de corte ('first' pega os primeiros X segundos)
VIDEO_TRIM_MODE=first

# Nível de log (trace, debug, info, warn, error, fatal)
LOG_LEVEL=info

# Caminho opcional do FFmpeg (se vazio, usa ffmpeg-static ou o PATH global)
FFMPEG_PATH=
```

---

## Autenticação e Primeira Execução

Para iniciar o bot em modo de desenvolvimento com hot-reload:

```powershell
npm run dev
```

1. Na **primeira execução**, o terminal exibirá um **QR Code**.
2. Abra o WhatsApp no seu smartphone.
3. Acesse **Configurações / Aparelhos conectados / Conectar um aparelho**.
4. Aponte a câmera para o QR Code no seu terminal.
5. As chaves de sessão serão salvas na pasta `auth/`.
6. Nas próximas inicializações, a conexão será **automática e instantânea**, sem necessidade de ler o QR Code novamente!

---

## Processamento de Mídia em Detalhes

### Imagem (Sharp)
```
Input Buffer ➔ .rotate() (EXIF) ➔ .resize(512, 512, fit: contain, bg: transparent) ➔ .webp() ➔ Injeção EXIF ➔ Saída
```

### Vídeo (FFmpeg)
```
Input File ➔ Probe (duração) ➔ Trim (max 10s) ➔ -an (Sem áudio) ➔ Scale 512x512 Contain ➔ FPS 12 ➔ Libwebp Animado (-loop 0) ➔ Injeção EXIF ➔ Saída
```

### GIF (FFmpeg & Sharp)
- **GIF Animado:** Segue o pipeline do FFmpeg para WebP animado.
- **GIF Estático (1 frame):** Processado pelo Sharp para máxima nitidez e menor tamanho.

---

## Segurança e Cleanup

1. **Proteção contra Command Injection:** O FFmpeg é invocado com `execFile` passando argumentos em um array separado de strings. Nenhuma entrada do usuário é concatenada em string de terminal (`exec`).
2. **Prevenção de Path Traversal:** IDs de jobs são sanitizados com expressões regulares alfanuméricas estritas antes de montar caminhos em disco.
3. **Limpeza Garantida (`try ... finally`):** A pasta temporária `tmp/<job-id>/` é sumariamente excluída mesmo se o processamento, conversão ou envio falharem.
4. **Encerramento Gracioso:** Sinais de interrupção (`SIGINT`, `SIGTERM`) removem temporários órfãos antes de desligar o processo.
5. **Credenciais Protegidas:** A pasta `auth/` e o arquivo `.env` constam no `.gitignore` para impedir que sejam versionados no Git.

---

## Testes Automatizados

O projeto inclui uma suíte completa de testes com o **Vitest**:

```powershell
npm test
```

Para rodar em modo watch durante o desenvolvimento:
```powershell
npm run test:watch
```

Para verificar a compilação do TypeScript:
```powershell
npm run build
```

---

## Troubleshooting (Solução de Problemas)

### 1. "O executável do FFmpeg não foi encontrado"
O projeto utiliza o pacote `ffmpeg-static` automaticamente. Caso queira usar o FFmpeg global do Windows:
- Instale via winget: `winget install Gyan.FFmpeg`
- Ou defina no `.env`: `FFMPEG_PATH=C:\caminho\para\ffmpeg.exe`

### 2. "A sessão foi desvinculada no celular"
Se você desconectar o aparelho pelo celular:
1. Pare a aplicação (`Ctrl + C`).
2. Apague a pasta `auth/`.
3. Inicie novamente (`npm run dev`) e escaneie o novo QR Code.

### 3. Figurinha não é enviada porque excede o tamanho
O WhatsApp rejeita figurinhas maiores que o limite estrito oficial de 500KB. O sistema aplica compressão automática adaptativa diminuindo o FPS e qualidade. Se o vídeo for extremamente ruidoso ou longo, envie um vídeo com menos movimento ou utilize o comando `/static` para extrair uma imagem estática.

---

## Limitações

- **V1 Focada em Conversas Privadas:** Por design e segurança, não há suporte a grupos.
- **Sem IA na V1:** Remoção de fundo por IA ou detecção facial não estão presentes nesta versão para manter o sistema leve, rápido e local.
- **Duração de Vídeo:** Vídeos são cortados nos primeiros segundos configurados (`VIDEO_TRIM_MODE=first`).

---

## Aviso sobre Integração Não Oficial

> [!WARNING]
> Este software utiliza a biblioteca **Baileys**, que realiza engenharia reversa do protocolo de comunicação do WhatsApp Web. Este projeto **não é afiliado, endossado ou associado ao WhatsApp Inc. ou Meta**.
>
> O software foi desenvolvido exclusivamente para uso pessoal em conversas privadas individuais. Não o utilize para spam, disparos em massa ou automações comerciais invasivas.
