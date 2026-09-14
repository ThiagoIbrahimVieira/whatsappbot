import type { IncomingMessage, ServerResponse } from 'node:http';
import { whatsappClient } from '../whatsapp/client.js';
import { botState, type ProcessingMode, type QualityPreset } from '../control/bot-state.js';
import { accessControl } from '../control/access-control.js';
import { activityStore } from '../control/activity-store.js';
import { jobQueue } from '../queue/job-queue.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { libraryManager } from '../storage/library-manager.js';
import { packManager } from '../storage/pack-manager.js';
import { historyStore } from '../storage/history-store.js';
import { statisticsManager, type StatPeriod } from '../control/statistics-manager.js';
import { systemMonitor } from '../control/system-monitor.js';
import { automationManager } from '../control/automation-manager.js';
import { PRESET_CONFIGS } from '../media/presets.js';
import { imageProcessor } from '../media/image-processor.js';
import { createJobDir, removeJobDir } from '../utils/files.js';

function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(json);
}

function sendBuffer(res: ServerResponse, contentType: string, buffer: Buffer): void {
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': buffer.length,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(buffer);
}

async function readBody(req: IncomingMessage, maxBytes = 20 * 1024 * 1024): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let currentLen = 0;

    req.on('data', (chunk) => {
      currentLen += chunk.length;
      if (currentLen > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  rawUrlPath: string
): Promise<boolean> {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  const [urlPath, queryString] = rawUrlPath.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  // =========================================================================
  // 1. STATUS & CORE BOT CONTROLS
  // =========================================================================
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
    const rawPhone =
      (sock?.user?.id || '').split(':')[0].split('@')[0] || config.PAIRING_NUMBER || 'WhatsApp Bot';
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
      qrSvg: authInfo.qrSvg,
      pairingNumberConfigured: authInfo.pairingNumberConfigured,
      botActive: isBotActive,
      botStatus: isBotActive ? 'active' : 'paused',
      processingMode: settings.processingMode,
      qualityPreset: settings.qualityPreset,
      partyMode: settings.partyMode,
      autoOffMinutes: settings.autoOffMinutes,
      autoOffRemainingSeconds: automationManager.getAutoOffRemainingSeconds(),
      schedule: {
        enabled: settings.scheduleEnabled,
        start: settings.scheduleStart,
        end: settings.scheduleEnd,
      },
      developerMode: settings.developerMode,
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
        freemiumEnabled: settings.freemiumEnabled,
        dailyFreeLimit: settings.dailyFreeLimit,
        vipPriceText: settings.vipPriceText,
        pixKey: settings.pixKey,
      },
      allowedCount: contacts.length,
    };

    sendJson(res, 200, response);
    return true;
  }

  // POST /api/bot/reset-auth
  if (urlPath === '/api/bot/reset-auth' && req.method === 'POST') {
    whatsappClient.resetAuth().catch((err: any) => {
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

  // POST /api/processing-mode
  if (urlPath === '/api/processing-mode' && req.method === 'POST') {
    const body = await readBody(req);
    const mode = body.mode as ProcessingMode;
    if (mode !== 'interactive' && mode !== 'automatic') {
      sendJson(res, 400, { error: 'Modo inválido. Use "interactive" ou "automatic".' });
      return true;
    }
    botState.setProcessingMode(mode);
    sendJson(res, 200, { success: true, processingMode: mode });
    return true;
  }

  // POST /api/bot/settings
  if (urlPath === '/api/bot/settings' && req.method === 'POST') {
    const body = await readBody(req);
    const updates: any = {};
    if (typeof body.images === 'boolean') updates.autoImage = body.images;
    if (typeof body.videos === 'boolean') updates.autoVideo = body.videos;
    if (typeof body.gifs === 'boolean') updates.autoGif = body.gifs;
    if (typeof body.commands === 'boolean') updates.commandsEnabled = body.commands;
    if (typeof body.autoCropSquare === 'boolean') updates.autoCropSquare = body.autoCropSquare;
    if (typeof body.keepQuality === 'boolean') updates.keepQuality = body.keepQuality;
    if (typeof body.replyWithAuthor === 'boolean') updates.replyWithAuthor = body.replyWithAuthor;
    if (typeof body.packName === 'string') updates.packName = body.packName;
    if (typeof body.authorName === 'string') updates.authorName = body.authorName;
    if (typeof body.developerMode === 'boolean') updates.developerMode = body.developerMode;
    if (typeof body.freemiumEnabled === 'boolean') updates.freemiumEnabled = body.freemiumEnabled;
    if (typeof body.dailyFreeLimit === 'number') updates.dailyFreeLimit = body.dailyFreeLimit;
    if (typeof body.vipPriceText === 'string') updates.vipPriceText = body.vipPriceText;
    if (typeof body.pixKey === 'string') updates.pixKey = body.pixKey;

    const saved = botState.updateSettings(updates);
    sendJson(res, 200, { settings: saved });
    return true;
  }

  // =========================================================================
  // 2. ACCESS CONTROL & WHITELIST
  // =========================================================================
  if (urlPath === '/api/whitelist' && req.method === 'GET') {
    const contacts = accessControl.getContacts();
    sendJson(res, 200, { contacts });
    return true;
  }

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

  if (urlPath === '/api/access-mode' && req.method === 'POST') {
    const body = await readBody(req);
    let mode = body.mode;
    if (mode === 'only_me') mode = 'self';
    if (mode === 'everyone') mode = 'all';

    if (mode !== 'self' && mode !== 'whitelist' && mode !== 'all') {
      sendJson(res, 400, { error: 'Modo de acesso inválido. Use self, whitelist ou all.' });
      return true;
    }
    accessControl.setAccessMode(mode);
    sendJson(res, 200, { mode });
    return true;
  }

  // POST /api/bot/request-pairing
  if (urlPath === '/api/bot/request-pairing' && req.method === 'POST') {
    const body = await readBody(req);
    try {
      const code = await whatsappClient.requestPairingForNumber(body.phoneNumber || '');
      sendJson(res, 200, { success: true, pairingCode: code });
    } catch (err: any) {
      sendJson(res, 400, { success: false, error: err.message || 'Erro ao gerar código de pareamento' });
    }
    return true;
  }

  // =========================================================================
  // 3. ACTIVITY FEED & HISTORY
  // =========================================================================
  if (urlPath === '/api/activity' || urlPath === '/api/recent') {
    if (req.method === 'GET') {
      const activities = activityStore.getActivities();
      sendJson(res, 200, { activities });
      return true;
    }
    if (req.method === 'POST' && (urlPath.endsWith('/clear') || req.url?.includes('clear'))) {
      activityStore.clear();
      sendJson(res, 200, { success: true });
      return true;
    }
  }

  if (urlPath === '/api/history' && req.method === 'GET') {
    const limit = Number(queryParams.get('limit')) || 50;
    const history = historyStore.getHistory(limit);
    sendJson(res, 200, { history });
    return true;
  }

  // =========================================================================
  // 4. STATISTICS & RANKING (FASE H)
  // =========================================================================
  if (urlPath === '/api/statistics' && req.method === 'GET') {
    const period = (queryParams.get('period') || 'allTime') as StatPeriod;
    const analytics = statisticsManager.getAnalytics(period);
    sendJson(res, 200, { analytics });
    return true;
  }

  if (urlPath === '/api/ranking' && req.method === 'GET') {
    const period = (queryParams.get('period') || 'allTime') as StatPeriod;
    const limit = Number(queryParams.get('limit')) || 10;
    const ranking = statisticsManager.getRanking(period, limit);
    sendJson(res, 200, { ranking });
    return true;
  }

  if (urlPath === '/api/user-profile' && req.method === 'GET') {
    const phone = queryParams.get('phone') || '';
    if (!phone) {
      sendJson(res, 400, { error: 'Parâmetro phone é obrigatório' });
      return true;
    }
    const profile = statisticsManager.getUserStats(phone);
    sendJson(res, 200, { profile });
    return true;
  }

  // =========================================================================
  // 5. LIBRARY & FAVORITES (FASE F & G)
  // =========================================================================
  if (urlPath === '/api/library' && req.method === 'GET') {
    const favoritesOnly = queryParams.get('favorites') === 'true';
    const packId = queryParams.get('packId') || undefined;
    const items = libraryManager.getLibrary({ favoritesOnly, packId });
    sendJson(res, 200, { items });
    return true;
  }

  // Servir imagem binária da biblioteca com proteção contra path traversal
  if (urlPath.startsWith('/api/library/image/') && req.method === 'GET') {
    const id = urlPath.replace('/api/library/image/', '').replace(/[^a-zA-Z0-9_-]/g, '');
    const buffer = await libraryManager.getStickerBuffer(id);
    if (!buffer) {
      sendJson(res, 404, { error: 'Sticker não encontrado' });
      return true;
    }
    sendBuffer(res, 'image/webp', buffer);
    return true;
  }

  if (urlPath === '/api/library/favorite' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.id) {
      sendJson(res, 400, { error: 'ID do sticker é obrigatório' });
      return true;
    }
    const isFav = libraryManager.toggleFavorite(body.id);
    sendJson(res, 200, { success: true, id: body.id, isFavorite: isFav });
    return true;
  }

  if (urlPath === '/api/library/favorite' && req.method === 'DELETE') {
    const body = await readBody(req);
    if (!body.id) {
      sendJson(res, 400, { error: 'ID do sticker é obrigatório' });
      return true;
    }
    libraryManager.setFavorite(body.id, false);
    sendJson(res, 200, { success: true, id: body.id, isFavorite: false });
    return true;
  }

  // =========================================================================
  // 6. PACKS (FASE G)
  // =========================================================================
  if (urlPath === '/api/packs' && req.method === 'GET') {
    const packs = packManager.listPacks();
    sendJson(res, 200, { packs });
    return true;
  }

  if (urlPath === '/api/packs' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.name) {
      sendJson(res, 400, { error: 'Nome do pacote é obrigatório' });
      return true;
    }
    const pack = packManager.createPack(body.name, body.description);
    sendJson(res, 201, { pack });
    return true;
  }

  // =========================================================================
  // 7. PRESETS & AUTOMATIONS (FASE I, L, M, O)
  // =========================================================================
  if (urlPath === '/api/presets' && req.method === 'GET') {
    sendJson(res, 200, {
      current: botState.getSettings().qualityPreset,
      presets: PRESET_CONFIGS,
    });
    return true;
  }

  if (urlPath === '/api/presets' && req.method === 'POST') {
    const body = await readBody(req);
    const preset = body.preset as QualityPreset;
    if (!PRESET_CONFIGS[preset]) {
      sendJson(res, 400, { error: 'Preset desconhecido' });
      return true;
    }
    botState.updateSettings({ qualityPreset: preset });
    sendJson(res, 200, { success: true, currentPreset: preset });
    return true;
  }

  if (urlPath === '/api/automation' && req.method === 'POST') {
    const body = await readBody(req);

    if (typeof body.autoOffMinutes === 'number') {
      automationManager.setAutoOff(body.autoOffMinutes);
    }
    if (typeof body.partyMode === 'boolean') {
      automationManager.setPartyMode(body.partyMode);
    }
    if (typeof body.scheduleEnabled === 'boolean' || body.scheduleStart || body.scheduleEnd) {
      botState.updateSettings({
        scheduleEnabled: typeof body.scheduleEnabled === 'boolean' ? body.scheduleEnabled : undefined,
        scheduleStart: typeof body.scheduleStart === 'string' ? body.scheduleStart : undefined,
        scheduleEnd: typeof body.scheduleEnd === 'string' ? body.scheduleEnd : undefined,
      });
      automationManager.evaluateSchedule();
    }

    sendJson(res, 200, {
      success: true,
      autoOffMinutes: botState.getSettings().autoOffMinutes,
      autoOffRemainingSeconds: automationManager.getAutoOffRemainingSeconds(),
      partyMode: botState.getSettings().partyMode,
      schedule: {
        enabled: botState.getSettings().scheduleEnabled,
        start: botState.getSettings().scheduleStart,
        end: botState.getSettings().scheduleEnd,
      },
    });
    return true;
  }

  // =========================================================================
  // 8. SYSTEM MONITOR & TELEMETRY (FASE K)
  // =========================================================================
  if (urlPath === '/api/system' && req.method === 'GET') {
    const telemetry = systemMonitor.getTelemetry();
    sendJson(res, 200, { telemetry });
    return true;
  }

  if (urlPath === '/api/system/debug-logs' && req.method === 'GET') {
    const logs = systemMonitor.getDebugLogs(30);
    sendJson(res, 200, { logs });
    return true;
  }

  // =========================================================================
  // 9. DASHBOARD STICKER EDITOR (FASE J)
  // =========================================================================
  if (urlPath === '/api/editor/process' && req.method === 'POST') {
    const body = await readBody(req, 20 * 1024 * 1024); // até 20MB
    const base64Data = body.imageBase64 || body.image;

    if (!base64Data || typeof base64Data !== 'string') {
      sendJson(res, 400, { error: 'Imagem base64 não fornecida ou inválida' });
      return true;
    }

    // Remove cabeçalho de Data URL (ex: data:image/png;base64,...)
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    if (imageBuffer.length > 15 * 1024 * 1024) {
      sendJson(res, 400, { error: 'A imagem enviada excede o limite máximo de 15 MB' });
      return true;
    }

    const jobDir = await createJobDir(`editor_${Date.now()}`);
    try {
      const options = body.options || {};
      const result = await imageProcessor.processImage(imageBuffer, jobDir, {
        rotate: options.rotate ? Number(options.rotate) : undefined,
        flip: Boolean(options.flip),
        mirror: Boolean(options.mirror),
        crop: options.crop,
        outline: options.outline,
        shadow: options.shadow,
        memeText: options.memeText,
        topText: options.topText,
        bottomText: options.bottomText,
        quality: options.quality ? Number(options.quality) : undefined,
      });

      // Se solicitado, salva direto na biblioteca
      let libraryItem = null;
      if (body.saveToLibrary) {
        libraryItem = await libraryManager.saveSticker(result.outputBuffer, {
          mediaType: 'IMAGE',
          isAnimated: false,
          originUser: 'Dashboard Editor',
          operation: 'editor',
          isFavorite: Boolean(body.favorite),
        });
      }

      sendJson(res, 200, {
        success: true,
        sizeBytes: result.sizeBytes,
        width: result.width,
        height: result.height,
        processingTimeMs: result.processingTimeMs,
        base64Webp: `data:image/webp;base64,${result.outputBuffer.toString('base64')}`,
        libraryItem,
      });
      return true;
    } catch (err: any) {
      logger.error({ err }, 'Erro no processamento do Editor do Dashboard');
      sendJson(res, 500, { success: false, error: err.message || 'Falha ao processar imagem no editor' });
      return true;
    } finally {
      await removeJobDir(jobDir);
    }
  }

  return false;
}
