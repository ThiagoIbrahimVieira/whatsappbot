import { whatsappClient } from '../whatsapp/client.js';
import { botState } from '../control/bot-state.js';
import { accessControl } from '../control/access-control.js';
import { activityStore } from '../control/activity-store.js';
import { jobQueue } from '../queue/job-queue.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
function sendJson(res, statusCode, data) {
    const json = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(json);
}
async function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1e6) {
                req.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body)
                return resolve({});
            try {
                resolve(JSON.parse(body));
            }
            catch {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}
export async function handleApiRequest(req, res, urlPath) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        res.end();
        return true;
    }
    // GET /api/status
    if (urlPath === '/api/status' && req.method === 'GET') {
        const isConnected = whatsappClient.isConnected();
        const isBotActive = botState.isBotActive();
        const stats = jobQueue.getStats();
        const settings = botState.getSettings();
        const contacts = accessControl.getContacts();
        const hours = Math.floor(stats.uptimeSeconds / 3600);
        const minutes = Math.floor((stats.uptimeSeconds % 3600) / 60);
        const uptimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        const sock = whatsappClient.getSocket();
        const rawPhone = (sock?.user?.id || '').split(':')[0].split('@')[0] || config.PAIRING_NUMBER || 'WhatsApp Bot';
        const formattedPhone = rawPhone.startsWith('55')
            ? `+${rawPhone.slice(0, 2)} ${rawPhone.slice(2, 4)} ***** ${rawPhone.slice(-4)}`
            : rawPhone;
        const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const authInfo = whatsappClient.getAuthInfo();
        const response = {
            connected: isConnected,
            whatsappStatus: isConnected ? 'Connected' : 'Disconnected',
            pairingCode: authInfo.pairingCode,
            qrCode: authInfo.qr,
            botActive: isBotActive,
            botStatus: isBotActive ? 'active' : 'paused',
            accessMode: accessControl.getAccessMode(),
            uptime: uptimeStr,
            uptimeSeconds: stats.uptimeSeconds,
            phoneNumber: formattedPhone,
            metrics: {
                stickersToday: stats.total,
                successful: stats.completed,
                queued: stats.queued + stats.processing,
                failed: stats.failed,
            },
            systemInfo: {
                whatsappStatus: isConnected ? 'Connected' : 'Disconnected',
                phoneNumber: formattedPhone,
                uptime: uptimeStr,
                runtime: `Node.js ${process.version}`,
                engine: 'Baileys Multi-Device (v7.0)',
                imageLibrary: 'Sharp v0.33',
                videoLibrary: 'FFmpeg (libwebp)',
                version: 'v1.0.0',
                memoryUsage: `${memoryMb} MB`,
                avgLatency: '18 ms',
                lastPing: 'Agora',
            },
            quickSettings: {
                images: settings.autoImage,
                videos: settings.autoVideo,
                gifs: settings.autoGif,
                commands: settings.commandsEnabled,
                autoCropSquare: settings.autoCropSquare,
                keepQuality: settings.keepQuality,
                replyWithAuthor: settings.replyWithAuthor,
                packName: settings.packName,
                authorName: settings.authorName,
            },
            allowedCount: contacts.length,
        };
        sendJson(res, 200, response);
        return true;
    }
    // POST /api/bot/reset-auth
    if (urlPath === '/api/bot/reset-auth' && req.method === 'POST') {
        whatsappClient.resetAuth().catch((err) => {
            logger.error({ err: err?.message }, 'Erro ao resetar autenticação do WhatsApp');
        });
        sendJson(res, 200, {
            success: true,
            message: 'Sessão limpa com sucesso. Um novo código ou QR Code está sendo gerado!',
        });
        return true;
    }
    // POST /api/bot/toggle
    if (urlPath === '/api/bot/toggle' && req.method === 'POST') {
        const body = await readBody(req);
        const newActive = typeof body.active === 'boolean' ? body.active : !botState.isBotActive();
        botState.setBotActive(newActive);
        sendJson(res, 200, {
            active: newActive,
            message: newActive ? 'Bot ativado com sucesso' : 'Bot pausado com sucesso',
        });
        return true;
    }
    // POST /api/bot/settings
    if (urlPath === '/api/bot/settings' && req.method === 'POST') {
        const body = await readBody(req);
        const updates = {};
        if (typeof body.images === 'boolean')
            updates.autoImage = body.images;
        if (typeof body.videos === 'boolean')
            updates.autoVideo = body.videos;
        if (typeof body.gifs === 'boolean')
            updates.autoGif = body.gifs;
        if (typeof body.commands === 'boolean')
            updates.commandsEnabled = body.commands;
        if (typeof body.autoCropSquare === 'boolean')
            updates.autoCropSquare = body.autoCropSquare;
        if (typeof body.keepQuality === 'boolean')
            updates.keepQuality = body.keepQuality;
        if (typeof body.replyWithAuthor === 'boolean')
            updates.replyWithAuthor = body.replyWithAuthor;
        if (typeof body.packName === 'string')
            updates.packName = body.packName;
        if (typeof body.authorName === 'string')
            updates.authorName = body.authorName;
        const saved = botState.updateSettings(updates);
        sendJson(res, 200, {
            settings: {
                images: saved.autoImage,
                videos: saved.autoVideo,
                gifs: saved.autoGif,
                commands: saved.commandsEnabled,
                autoCropSquare: saved.autoCropSquare,
                keepQuality: saved.keepQuality,
                replyWithAuthor: saved.replyWithAuthor,
                packName: saved.packName,
                authorName: saved.authorName,
            },
        });
        return true;
    }
    // GET /api/whitelist
    if (urlPath === '/api/whitelist' && req.method === 'GET') {
        const contacts = accessControl.getContacts();
        sendJson(res, 200, { contacts });
        return true;
    }
    // POST /api/whitelist/add
    if (urlPath === '/api/whitelist/add' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.phone) {
            sendJson(res, 400, { error: 'Telefone é obrigatório' });
            return true;
        }
        const contact = accessControl.addContact(body.name || '', body.phone);
        sendJson(res, 201, { contact });
        return true;
    }
    // POST /api/whitelist/remove
    if (urlPath === '/api/whitelist/remove' && req.method === 'POST') {
        const body = await readBody(req);
        const target = body.id || body.phone;
        if (!target) {
            sendJson(res, 400, { error: 'ID ou telefone é obrigatório' });
            return true;
        }
        const removed = accessControl.removeContact(target);
        sendJson(res, 200, { success: removed });
        return true;
    }
    // POST /api/access-mode
    if (urlPath === '/api/access-mode' && req.method === 'POST') {
        const body = await readBody(req);
        const mode = body.mode;
        if (mode !== 'self' && mode !== 'whitelist' && mode !== 'all') {
            sendJson(res, 400, { error: 'Modo de acesso inválido. Use self, whitelist ou all.' });
            return true;
        }
        accessControl.setAccessMode(mode);
        sendJson(res, 200, { mode });
        return true;
    }
    // GET /api/recent
    if (urlPath === '/api/recent' && req.method === 'GET') {
        const activities = activityStore.getActivities();
        sendJson(res, 200, { activities });
        return true;
    }
    // POST /api/recent/clear
    if (urlPath === '/api/recent/clear' && req.method === 'POST') {
        activityStore.clear();
        sendJson(res, 200, { success: true });
        return true;
    }
    return false;
}
//# sourceMappingURL=api.js.map