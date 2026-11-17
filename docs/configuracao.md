# ⚙️ Guia de Configuração (`.env`)

O comportamento do **WhatsApp Auto Sticker** pode ser totalmente personalizado por meio do arquivo `.env` na raiz do projeto.

---

## 📄 Exemplo de Arquivo `.env` Completo

```env
# ==============================================================================
# CONFIGURAÇÕES BÁSICAS
# ==============================================================================
# Modo de operação: 'auto' (converte direto) ou 'interactive' (envia enquete)
PROCESSING_MODE=interactive

# Nome e autor do pacote de figurinhas embutidos nos metadados EXIF
STICKER_PACK_NAME="WhatsApp Auto Sticker"
STICKER_PACK_AUTHOR="@ThiagoIbrahim"

# Número do administrador (formato internacional sem '+' ou espaços)
ADMIN_NUMBER="5511999999999"

# ==============================================================================
# FILA E LIMITES DE MÍDIA
# ==============================================================================
# Quantidade máxima de conversões simultâneas (recomendado: 2 para evitar pico de CPU)
MAX_CONCURRENT_JOBS=2

# Limite máximo de tamanho de arquivos para download (em Megabytes)
MAX_IMAGE_SIZE_MB=15
MAX_VIDEO_SIZE_MB=25
MAX_GIF_SIZE_MB=20

# Duração máxima para corte de vídeos em figurinhas animadas (em segundos, máx: 10)
MAX_VIDEO_DURATION_SECONDS=10

# Qualidade padrão de saída WebP (1 a 100)
DEFAULT_STICKER_QUALITY=80

# ==============================================================================
# REGRAS DE ISOLAMENTO E FILTRAGEM
# ==============================================================================
# Ignora mensagens vindas de grupos (mantenha sempre 'true')
IGNORE_GROUPS=true

# Ignora mensagens enviadas pelo próprio bot (evita loops infinitos)
IGNORE_OWN_MESSAGES=true

# ==============================================================================
# SISTEMA VIP E LIMITES DIÁRIOS
# ==============================================================================
# Quantidade de figurinhas permitidas por dia para usuários gratuitos (0 = ilimitado)
DAILY_STICKER_LIMIT=20

# Chave PIX para recebimento de doações ou ativação de VIP (CPF, e-mail, telefone ou aleatória)
PIX_KEY="seu-email-ou-chave-pix@exemplo.com"
PIX_NAME="Seu Nome Completo"
PIX_CITY="Sao Paulo"
PIX_MIN_VIP_VALUE=5.00

# ==============================================================================
# SERVIDOR WEB INTEGRADO
# ==============================================================================
# Porta para o servidor local de status e APIs
PORT=3000

# Host para escuta (127.0.0.1 restringe ao computador local com máxima segurança)
HOST=127.0.0.1

# ==============================================================================
# CAMINHO PERSONALIZADO DO FFMPEG (OPCIONAL)
# ==============================================================================
# Deixe em branco para detecção automática (recomendado).
# Defina apenas se tiver uma instalação customizada do FFmpeg.
# FFMPEG_PATH="/usr/bin/ffmpeg"
```

---

## 🔍 Detalhamento dos Principais Parâmetros

### `PROCESSING_MODE`
- **`interactive`** *(Recomendado)*: Ao receber foto ou vídeo, o bot envia uma enquete com opções de estilo (Estática, Animada, Meme, Contorno, etc.).
- **`auto`**: Transforma a mídia imediatamente no formato padrão sem perguntar nada.

### `MAX_CONCURRENT_JOBS`
Define quantos processos de transcodificação de mídia podem rodar simultaneamente na memória.
- **Valor padrão:** `2`.
- **Por que limitar?** Cada transcodificação de vídeo com FFmpeg consome poder de processamento. Limitar a 2 tarefas garante que a fila processe rápido sem deixar a CPU em 100% ou comprometer o WebSocket do WhatsApp.

### `STICKER_PACK_NAME` e `STICKER_PACK_AUTHOR`
Os valores configurados aqui aparecem nativamente quando qualquer pessoa clica em *"Ver pacote de figurinhas"* ou favorita a figurinha no aplicativo do WhatsApp.

### `ADMIN_NUMBER`
Seu número de WhatsApp no formato internacional completo (código do país + DDD + número, por exemplo: `5511987654321`). Usuários com esse número têm acesso aos comandos de gerenciamento (`/mode`, `/vip`, `/approve`, `/status`).
