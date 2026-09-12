import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handleApiRequest } from './api.js';
import { logger } from '../utils/logger.js';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export class WebServer {
  private server: http.Server | null = null;
  private port: number = 3000;
  private host: string = '0.0.0.0';
  private staticDir: string;

  constructor() {
    this.staticDir = path.resolve(process.cwd(), 'web', 'dist');
  }

  public async start(port = 3000, host = '0.0.0.0'): Promise<number> {
    this.port = port;
    this.host = host;

    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        try {
          const rawUrl = req.url || '/';
          const [splitUrl] = rawUrl.split('?');
          const urlPath = splitUrl.length > 1 ? splitUrl.replace(/\/+$/, '') : splitUrl;

          // 1. API Endpoints
          if (urlPath.startsWith('/api')) {
            const handled = await handleApiRequest(req, res, urlPath);
            if (handled) return;

            logger.warn({ method: req.method, urlPath }, 'Endpoint da API não encontrado');
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Endpoint não encontrado: ${req.method} ${urlPath}` }));
            return;
          }

          // 2. Arquivos estáticos do Frontend (web/dist/)
          if (req.method === 'GET' || req.method === 'HEAD') {
            let relativePath = urlPath === '/' ? 'index.html' : urlPath.slice(1);
            let filePath = path.normalize(path.join(this.staticDir, relativePath));

            // Prevenção de Path Traversal
            if (!filePath.startsWith(this.staticDir)) {
              res.writeHead(403, { 'Content-Type': 'text/plain' });
              res.end('Acesso proibido');
              return;
            }

            // Se o arquivo não existir fisicamente, fallback para index.html (SPA routing)
            if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
              filePath = path.join(this.staticDir, 'index.html');
            }

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const contentType = MIME_TYPES[ext] || 'application/octet-stream';

              res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
              });

              if (req.method === 'HEAD') {
                res.end();
                return;
              }

              const stream = fs.createReadStream(filePath);
              stream.pipe(res);
              return;
            }
          }

          // 3. Fallback se web/dist ainda não foi compilado
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="utf-8">
              <title>WhatsApp Auto Sticker Dashboard</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 480px; }
                h1 { color: #10b981; margin-top: 0; }
                a { color: #38bdf8; }
                code { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>🟢 WhatsApp Auto Sticker API Ativa</h1>
                <p>O servidor backend está rodando perfeitamente na porta ${this.port}.</p>
                <p>Para abrir a interface completa React, compile o frontend com <code>npm run web:build</code> ou use <code>npm run web:dev</code> para desenvolvimento com recarregamento ao vivo.</p>
                <p><a href="/api/status">Visualizar API JSON /api/status</a></p>
              </div>
            </body>
            </html>
          `);
        } catch (err: any) {
          logger.error({ err }, 'Erro no processamento da requisição HTTP');
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno no servidor HTTP' }));
          }
        }
      });

      this.server.on('error', (err: any) => {
        logger.error({ err }, 'Erro no servidor HTTP');
        reject(err);
      });

      this.server.listen(this.port, this.host, () => {
        logger.info(
          { port: this.port, host: this.host },
          `🌐 Servidor Web e API REST iniciados em http://${this.host === '0.0.0.0' ? 'localhost' : this.host}:${this.port}`
        );
        resolve(this.port);
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise((resolve) => {
      this.server?.close(() => {
        logger.info('Servidor Web e API REST finalizados.');
        this.server = null;
        resolve();
      });
    });
  }

  public getPort(): number {
    return this.port;
  }
}

export const webServer = new WebServer();
