import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { logger } from '../utils/logger.js';

let sharpModule: any = undefined;
async function getSharp() {
  if (sharpModule !== undefined) return sharpModule;
  try {
    const pkg = 'sharp';
    // @ts-ignore
    const s = await import(pkg);
    sharpModule = s.default || s;
  } catch {
    sharpModule = null;
  }
  return sharpModule;
}

const require = createRequire(import.meta.url);
const QRCode = require('qrcode-terminal/vendor/QRCode');

export interface QrOutputResult {
  pngPath: string;
  htmlPath: string;
}

/**
 * Gera um QR Code em imagem PNG de alta resolução e um arquivo HTML limpo
 * para fácil escaneamento no navegador ou visualizador de imagens do Windows.
 */
export async function generateQrArtifacts(qrString: string): Promise<QrOutputResult> {
  const qr = new QRCode(-1, 0); // nível L (Low error correction, ideal para telas digitais)
  qr.addData(qrString);
  qr.make();

  const count: number = qr.getModuleCount();
  const margin = 4; // Margem oficial (quiet zone) de 4 módulos
  const scale = 14; // 14px por módulo -> ~600x600px nítido
  const size = (count + margin * 2) * scale;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.modules[r][c]) {
        const x = (c + margin) * scale;
        const y = (r + margin) * scale;
        rects += `<rect x="${x}" y="${y}" width="${scale}" height="${scale}" fill="#000000"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${rects}
  </svg>`;

  const pngPath = path.resolve(process.cwd(), 'qrcode.png');
  const htmlPath = path.resolve(process.cwd(), 'qrcode.html');

  // 1. Gera arquivo PNG em alta resolução se sharp estiver disponível
  const sharp = await getSharp();
  if (sharp) {
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
  }

  // 2. Gera página HTML moderna para visualização em qualquer navegador
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Auto Sticker - Conectar Aparelho</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background: #0b141a;
      color: #e9edef;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }
    .card {
      background: #111b21;
      border: 1px solid #222e35;
      padding: 36px;
      border-radius: 16px;
      text-align: center;
      max-width: 520px;
      box-shadow: 0 16px 32px rgba(0,0,0,0.6);
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 22px;
      color: #00a884;
    }
    p {
      font-size: 15px;
      color: #8696a0;
      margin: 0 0 20px 0;
    }
    .qr-wrapper {
      background: #ffffff;
      padding: 16px;
      border-radius: 12px;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      margin-bottom: 24px;
    }
    .qr-wrapper img {
      display: block;
      width: 340px;
      height: 340px;
      image-rendering: pixelated;
    }
    .instructions {
      text-align: left;
      background: #202c33;
      padding: 16px 20px;
      border-radius: 10px;
      font-size: 14px;
      color: #d1d7db;
      line-height: 1.6;
    }
    .instructions ol {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    .instructions li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>📱 Conectar ao WhatsApp</h1>
    <p>Escaneie o QR Code abaixo para autenticar sua conta</p>
    
    <div class="qr-wrapper">
      <img src="qrcode.png?t=${Date.now()}" alt="QR Code WhatsApp" />
    </div>

    <div class="instructions">
      <strong>No seu celular:</strong>
      <ol>
        <li>Abra o <b>WhatsApp</b></li>
        <li>Toque em <b>Menu (⋮)</b> ou <b>Configurações</b></li>
        <li>Toque em <b>Aparelhos conectados</b></li>
        <li>Toque em <b>Conectar um aparelho</b> e aponte para a imagem acima</li>
      </ol>
    </div>
  </div>
</body>
</html>`;

  await fs.writeFile(htmlPath, htmlContent, 'utf-8');

  // 3. Tenta abrir a página no navegador padrão do Windows automaticamente
  try {
    if (process.platform === 'win32') {
      execFile('cmd.exe', ['/c', 'start', '', htmlPath], { windowsHide: true });
    }
  } catch {
    // Ignora se não for possível invocar janela do sistema operacional
  }

  logger.info({ pngPath, htmlPath }, 'Arquivos do QR Code gerados com sucesso');

  return { pngPath, htmlPath };
}
