import { logger } from './logger.js';
import { generateQrPngBuffer, getQrSvg } from '../whatsapp/qr-generator.js';

export interface PixPayloadOptions {
  key: string;
  name: string;
  city: string;
  amount?: number;
  txid?: string;
  description?: string;
}

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

function formatField(id: string, value: string): string {
  const len = Buffer.byteLength(value, 'utf-8').toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Remove acentos e caracteres especiais para compatibilidade com o padrão EMV do Bacen.
 */
function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();
}

/**
 * Gera o payload oficial do Pix (BR Code / Pix Copia e Cola) de acordo com as especificações do Banco Central do Brasil.
 */
export function generatePixPayload(options: PixPayloadOptions): string {
  const cleanKey = options.key.trim();
  const rawName = normalizeText(options.name || 'THIAGO IBRAHIM').toUpperCase();
  const cleanName = rawName.slice(0, 25) || 'THIAGO IBRAHIM';
  const rawCity = normalizeText(options.city || 'SAO PAULO').toUpperCase();
  const cleanCity = rawCity.slice(0, 15) || 'SAO PAULO';
  // No Pix Estático, o padrão do Bacen para txid avulso é '***' para compatibilidade total com bancos
  const txid = options.txid && options.txid !== '***' ? options.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) : '***';

  // Informações da conta: No Pix Estático com chave, subtag 00 é 'br.gov.bcb.pix' e subtag 01 é a chave Pix
  // (A subtag 02 é reservada estritamente para URL do Pix Dinâmico no padrão Bacen)
  const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', cleanKey);

  let payload =
    formatField('00', '01') +
    formatField('26', merchantAccountInfo) +
    formatField('52', '0000') +
    formatField('53', '986');

  if (options.amount && options.amount > 0) {
    payload += formatField('54', Number(options.amount).toFixed(2));
  }

  payload +=
    formatField('58', 'BR') +
    formatField('59', cleanName) +
    formatField('60', cleanCity) +
    formatField('62', formatField('05', txid || '***')) +
    '6304';

  const checksum = crc16(payload);
  return payload + checksum;
}

/**
 * Renderiza o QR Code do Pix em um Buffer PNG de alta qualidade pronto para envio no WhatsApp.
 * Sempre retorna um Buffer PNG válido (nunca SVG XML), funcionando no Android/Termux e Windows.
 */
export async function generatePixQrBuffer(pixPayload: string): Promise<Buffer> {
  const sharp = await getSharp();
  if (sharp) {
    try {
      const svg = getQrSvg(pixPayload);
      return await sharp(Buffer.from(svg))
        .png({ quality: 95, compressionLevel: 9 })
        .toBuffer();
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Sharp falhou ao converter QR Code, usando gerador PNG nativo');
    }
  }

  // Gera PNG nativo com node:zlib sem dependências externas
  return generateQrPngBuffer(pixPayload, 12, 4);
}
