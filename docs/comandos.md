# 🎮 Guia Completo de Comandos e Interações

O **WhatsApp Auto Sticker** pode operar de duas formas principais em conversas privadas (1x1):
1. **Modo Automático:** Converte imediatamente qualquer foto, vídeo ou GIF recebido em figurinha.
2. **Modo Interativo (Enquetes Nativas):** Ao receber uma mídia, envia uma enquete com opções para você escolher o estilo antes de converter.

---

## 🗳️ Menu Interativo por Enquete

Quando o modo interativo está ativo (`PROCESSING_MODE=interactive`), ao enviar uma mídia o usuário recebe uma enquete oficial do WhatsApp:

* **📸 Imagem estática** ➔ Converte direto para figurinha WebP 512x512.
* **🎞️ Figurinha animada** ➔ Converte vídeo ou GIF em figurinha em movimento (loop infinito).
* **🎭 Meme (Com texto)** ➔ Aplica o estilo de meme (card com texto superior/inferior).
* **✨ Contorno Branco** ➔ Aplica borda branca suave ao redor da foto.
* **🌑 Sombra Projetada** ➔ Adiciona profundidade e sombra ao redor da imagem.
* **❌ Cancelar** ➔ Cancela a operação e descarta a mídia sem processar.

> O bot processa o voto na enquete em tempo real e entrega a figurinha personalizada na hora!

---

## 💬 Comandos de Usuário (Chat Privado)

Todos os comandos podem ser enviados diretamente ou respondendo (citando) a uma mensagem que contenha foto ou vídeo:

| Comando | Sinônimos | Descrição | Exemplo de Uso |
| :--- | :--- | :--- | :--- |
| `/sticker` | `/s`, `/f`, `/figurinha` | Converte a foto, vídeo ou GIF em figurinha. | `/sticker` |
| `/static` | `/estatica` | Força a criação de figurinha estática. Se usado em vídeo, extrai o primeiro frame. | `/static` ou `/static 3` (segundo 3) |
| `/video` | `/v`, `/animada` | Força a criação de figurinha animada a partir de vídeo ou GIF. | `/video` |
| `/gif` | `/g` | Converte um arquivo GIF em figurinha animada com loop contínuo. | `/gif` |
| `/meme` | `/m` | Cria uma figurinha estilo meme a partir de uma foto. Suporta quebra de linha ou texto superior/inferior. | `/meme texto cima \| texto baixo` |
| `/outline` | `/borda` | Adiciona contorno fino e bem definido ao redor da imagem. | `/outline #ffffff` |
| `/shadow` | `/sombra` | Adiciona sombra projetada para efeito de destaque e profundidade. | `/shadow` |
| `/crop` | `/corte` | Corta a imagem para formato quadrado (`square`) ou retrato (`portrait`). | `/crop square` |
| `/rotate` | `/girar` | Gira a imagem em 90°, 180° ou 270°. | `/rotate 90` |
| `/flip` | `/espelhar` | Inverte a imagem verticalmente ou horizontalmente. | `/flip` ou `/mirror` |
| `/info` | `/dados` | Exibe dados técnicos da mídia anexada (resolução, duração, tamanho). | `/info` |
| `/profile` | `/perfil` | Mostra seu plano atual (Free ou VIP), figurinhas criadas hoje e limite restante. | `/profile` |
| `/ranking` | `/top` | Exibe o ranking dos usuários que mais criaram figurinhas no bot. | `/ranking` |
| `/pix` | `/doar` | Gera chave PIX Copia-e-Cola e QR Code para apoio voluntário ou ativação VIP. | `/pix` |
| `/ping` | — | Testa a conexão do bot; responde `pong` com o tempo de resposta. | `/ping` |
| `/help` | `/ajuda` | Envia o menu explicativo com a lista de comandos disponíveis. | `/help` |

---

## 💎 Sistema VIP e Doações PIX

O bot possui um sistema de monetização e sustentabilidade integrado via PIX:

- **Usuários Free:** Possuem um limite diário configurável de figurinhas por dia (ex: 20 figurinhas/dia).
- **Usuários VIP:** Têm limite diário ilimitado, prioridade na fila de conversão e acesso a estilos exclusivos.
- **Ativação Automática por Comprovante:** Quando o usuário envia um comprovante de transferência bancária via PIX, o sistema analisa a imagem ou texto, verifica o valor e ativa o status VIP automaticamente.

---

## 🛡️ Comandos Administrativos (Apenas Administrador)

Estes comandos só funcionam quando enviados pelo número configurado como `ADMIN_NUMBER`:

| Comando | Descrição |
| :--- | :--- |
| `/mode [auto\|interactive]` | Altera o modo global de operação do bot entre conversão automática ou menu por enquete. |
| `/vip add [número] [dias]` | Concede status VIP manualmente para um número por determinada quantidade de dias. |
| `/vip remove [número]` | Remove o status VIP de um usuário. |
| `/approve [id_comprovante]` | Aprova manualmente um comprovante PIX pendente de revisão. |
| `/status` | Exibe status completo do sistema: uptime, uso de memória RAM, fila de jobs e estatísticas. |

---

## 🚫 Regra Geral de Grupos

> **Atenção:** Nenhum comando é processado ou respondido dentro de grupos de WhatsApp. O bot foi projetado para atuar estritamente em conversas privadas (1x1), garantindo privacidade e evitando poluição em conversas coletivas.
