import path from 'node:path';
import { logger } from '../utils/logger.js';
import { recentMessages, messageContentStore } from '../utils/cache.js';
import { atomicWriteFileSync, safeReadJsonSync } from '../utils/atomic-write.js';
import { receiptManager } from '../control/receipt-manager.js';
export const pendingStickersStore = new Map();
// Limpeza automática de stickers temporários não confirmados a cada 5 minutos (TTL 15 min)
setInterval(() => {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000;
    for (const [id, data] of pendingStickersStore.entries()) {
        if (now - data.createdAt > maxAge) {
            pendingStickersStore.delete(id);
        }
    }
}, 5 * 60 * 1000).unref?.();
const POLLS_FILE = path.join(process.cwd(), 'data', 'active-polls.json');
function loadPersistedPolls() {
    const map = new Map();
    const list = safeReadJsonSync(POLLS_FILE, []);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias de retenção
    for (const item of list) {
        const id = item?.id || item?.metadata?.pollId;
        if (id && item?.createdAt && now - item.createdAt < maxAge) {
            map.set(id, {
                ...item,
                status: item.status || 'PENDING',
                expiresAt: item.expiresAt || (item.createdAt + 24 * 60 * 60 * 1000),
            });
        }
    }
    return map;
}
export const activePolls = loadPersistedPolls();
export function persistActivePolls(map = activePolls) {
    try {
        const list = [];
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        for (const [id, record] of map.entries()) {
            if (now - record.createdAt < maxAge) {
                list.push({ ...record, id });
            }
        }
        atomicWriteFileSync(POLLS_FILE, JSON.stringify(list, null, 2));
    }
    catch (err) {
        logger.warn({ err: err?.message }, 'Erro ao persistir activePolls em disco');
    }
}
/**
 * Resolve o optionId semântico a partir do texto selecionado na enquete.
 */
export function resolveSemanticPollOption(pollRecord, selectedText) {
    if (!pollRecord) {
        return { id: selectedText, title: selectedText };
    }
    if (pollRecord.options && pollRecord.options.length > 0) {
        const exact = pollRecord.options.find((o) => o.title === selectedText);
        if (exact)
            return exact;
        const byId = pollRecord.options.find((o) => o.id === selectedText);
        if (byId)
            return byId;
        const lower = (selectedText || '').toLowerCase();
        const partial = pollRecord.options.find((o) => o.title.toLowerCase().includes(lower));
        if (partial)
            return partial;
    }
    return { id: selectedText, title: selectedText };
}
/**
 * Envia uma enquete nativa interativa do WhatsApp.
 * Suporta tanto options semânticas ({ id, title }) quanto values simples para retrocompatibilidade.
 */
export async function sendInteractivePoll(sock, chatId, params) {
    if (!sock)
        return null;
    try {
        const optionsList = params.options && params.options.length > 0
            ? params.options
            : (params.values || []).map((v) => ({ id: v, title: v }));
        const valuesToSend = optionsList.map((o) => o.title);
        if (valuesToSend.length === 0)
            return null;
        const sent = await sock.sendMessage(chatId, {
            poll: {
                name: params.title,
                values: valuesToSend,
                selectableCount: 1,
            },
        });
        if (sent?.key?.id) {
            recentMessages.add(sent.key.id);
            if (sent.message) {
                messageContentStore.set(sent.key.id, sent.message);
            }
            const secret = sent.message?.messageContextInfo?.messageSecret;
            const pollEncKeyBase64 = secret
                ? (Buffer.isBuffer(secret) ? secret : Buffer.from(secret, typeof secret === 'string' ? 'base64' : undefined)).toString('base64')
                : undefined;
            const now = Date.now();
            const defaultTtl = params.type === 'media' ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
            const expiresAt = now + (params.expiresInMs || defaultTtl);
            activePolls.set(sent.key.id, {
                id: sent.key.id,
                chatId,
                type: params.type,
                title: params.title,
                values: valuesToSend,
                options: optionsList,
                status: 'PENDING',
                createdAt: now,
                expiresAt,
                metadata: params.metadata,
                pollEncKeyBase64,
            });
            persistActivePolls(activePolls);
        }
        return sent;
    }
    catch (err) {
        logger.error({ err: err?.message }, 'Erro ao enviar enquete interativa');
        return null;
    }
}
/**
 * Envia uma mensagem com botões interativos ou texto estruturado formatado.
 */
export async function sendInteractiveMessage(sock, chatId, options) {
    if (!sock)
        return null;
    const textToSend = options.fallbackText || options.text;
    try {
        const sent = await sock.sendMessage(chatId, { text: textToSend });
        if (sent?.key?.id) {
            recentMessages.add(sent.key.id);
            if (sent.message) {
                messageContentStore.set(sent.key.id, sent.message);
            }
        }
        return sent;
    }
    catch (err) {
        logger.error({ err: err?.message }, 'Erro ao enviar mensagem');
        return null;
    }
}
/**
 * Envia o fluxo completo de pagamento Pix:
 * 1. Imagem PNG do QR Code com legenda explicativa (registrada no cache para evitar auto-resposta).
 * 2. Mensagem com código Pix Copia e Cola e a chave aleatória com bloco de cópia rápida.
 */
export async function sendPixPaymentMessages(sock, chatId, options) {
    if (!sock)
        return;
    // Registra que este chat gerou uma cobrança Pix e o bot aguarda o comprovante
    receiptManager.registerPendingPayment(chatId, {
        planName: options.planName,
        amountText: options.amountText,
    });
    // 1. Envia a imagem do QR Code
    const imageCaption = `⚡ *PIX — ATIVAÇÃO VIP*\n\n` +
        `📦 *Plano:* ${options.planName}\n` +
        `💰 *Valor:* ${options.amountText}\n\n` +
        `📲 *Escaneie o QR Code acima* no aplicativo do seu banco ou copie o código Pix na mensagem logo abaixo:`;
    try {
        const sentImage = await sock.sendMessage(chatId, {
            image: options.qrBuffer,
            caption: imageCaption,
            mimetype: 'image/png',
        });
        if (sentImage?.key?.id) {
            recentMessages.add(sentImage.key.id);
            if (sentImage.message) {
                messageContentStore.set(sentImage.key.id, sentImage.message);
            }
        }
    }
    catch (err) {
        logger.error({ err: err?.message }, 'Erro ao enviar imagem do QR Code Pix');
        const sentFallback = await sock.sendMessage(chatId, { text: imageCaption });
        if (sentFallback?.key?.id) {
            recentMessages.add(sentFallback.key.id);
            if (sentFallback.message) {
                messageContentStore.set(sentFallback.key.id, sentFallback.message);
            }
        }
    }
    // 2. Envia o código Pix Copia e Cola ISOLADO em uma única mensagem para copiar com 1 toque
    try {
        const sentPayload = await sock.sendMessage(chatId, { text: options.pixPayload });
        if (sentPayload?.key?.id) {
            recentMessages.add(sentPayload.key.id);
            if (sentPayload.message) {
                messageContentStore.set(sentPayload.key.id, sentPayload.message);
            }
        }
    }
    catch (err) {
        logger.error({ err: err?.message }, 'Erro ao enviar código Pix Copia e Cola');
    }
    // 3. Envia instrução explicativa e aviso da chave avulsa / doação
    const helpText = `📋 *O código acima é o Pix Copia e Cola com o valor exato de ${options.amountText} preenchido automaticamente!*\n` +
        `👉 Toque e segure no código acima para copiar, abra seu banco e escolha *Pix Copia e Cola*.\n\n` +
        `🔑 *Chave Pix Aleatória (Pagamento ou Doação ☕):*\n` +
        `Prefere transferir pela chave aleatória ou quer me pagar um café (doação espontânea de qualquer valor para apoiar o bot)?\n` +
        `A chave está isolada na mensagem logo abaixo para facilitar a cópia:`;
    try {
        const sentHelp = await sock.sendMessage(chatId, { text: helpText });
        if (sentHelp?.key?.id) {
            recentMessages.add(sentHelp.key.id);
            if (sentHelp.message) {
                messageContentStore.set(sentHelp.key.id, sentHelp.message);
            }
        }
    }
    catch (err) {
        logger.error({ err: err?.message }, 'Erro ao enviar instruções do Pix');
    }
    // 4. Envia a chave Pix aleatória isolada para cópia limpa
    try {
        const sentKey = await sock.sendMessage(chatId, { text: options.pixKey });
        if (sentKey?.key?.id) {
            recentMessages.add(sentKey.key.id);
            if (sentKey.message) {
                messageContentStore.set(sentKey.key.id, sentKey.message);
            }
        }
    }
    catch (err) {
        logger.error({ err: err?.message }, 'Erro ao enviar chave Pix');
    }
    // 5. Aviso de envio do comprovante e prazo de ativação
    const receiptText = `📸 *Assim que pagar, envie o comprovante aqui!*\n\n` +
        `⏳ *Prazo de ativação:* de *5 a 10 horas* após o envio do comprovante para verificação e liberação manual do VIP.\n\n` +
        `☕ *Fez Uma doação ou pagou meu café?* Meu muito obrigado de coração por apoiar o projeto! ❤️`;
    try {
        const sentReceipt = await sock.sendMessage(chatId, { text: receiptText });
        if (sentReceipt?.key?.id) {
            recentMessages.add(sentReceipt.key.id);
            if (sentReceipt.message) {
                messageContentStore.set(sentReceipt.key.id, sentReceipt.message);
            }
        }
    }
    catch (err) {
        logger.error({ err: err?.message }, 'Erro ao enviar aviso de comprovante');
    }
}
//# sourceMappingURL=interactive-messages.js.map