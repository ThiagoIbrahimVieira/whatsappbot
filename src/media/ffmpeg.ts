import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import { config } from '../config/config.js';
import { ProcessingError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

let cachedFFmpegPath: string | null = null;

/**
 * Resolve o caminho do executável FFmpeg.
 * Ordem de prioridade:
 * 1. config.FFMPEG_PATH definido no .env
 * 2. ffmpeg global disponível no PATH do sistema operacional
 * 3. ffmpeg-static instalado no projeto
 */
export async function getFFmpegPath(): Promise<string> {
  if (cachedFFmpegPath) {
    return cachedFFmpegPath;
  }

  // 1. Caminho explícito no .env
  if (config.FFMPEG_PATH) {
    try {
      await fs.access(config.FFMPEG_PATH);
      cachedFFmpegPath = config.FFMPEG_PATH;
      return cachedFFmpegPath;
    } catch {
      throw new ProcessingError(
        `O caminho do FFmpeg configurado em FFMPEG_PATH não foi encontrado: ${config.FFMPEG_PATH}`,
        '❌ O executável do FFmpeg não foi encontrado no caminho configurado.'
      );
    }
  }

  // 2. FFmpeg no PATH global do sistema
  try {
    const isWin = process.platform === 'win32';
    const checkCmd = isWin ? 'where.exe' : 'which';
    const { stdout } = await execFileAsync(checkCmd, ['ffmpeg']);
    const foundPath = stdout.trim().split(/\r?\n/)[0];
    if (foundPath) {
      cachedFFmpegPath = foundPath;
      return cachedFFmpegPath;
    }
  } catch {
    // Não encontrado no PATH do sistema, tenta o fallback
  }

  // 3. Fallback: ffmpeg-static instalado como dependência
  try {
    const ffmpegStatic = await import('ffmpeg-static');
    const staticPath = ffmpegStatic.default || (ffmpegStatic as any);
    if (staticPath && typeof staticPath === 'string') {
      await fs.access(staticPath);
      cachedFFmpegPath = staticPath;
      return cachedFFmpegPath;
    }
  } catch {
    // Falha ao carregar fallback estático
  }

  throw new ProcessingError(
    'FFmpeg não encontrado! Por favor, instale o FFmpeg no seu computador ou defina a variável FFMPEG_PATH no arquivo .env.',
    '❌ O processador de vídeos (FFmpeg) não está disponível no sistema.'
  );
}

/**
 * Executa o FFmpeg com argumentos separados via execFile (sem shell, prevenindo injeção de comandos).
 */
export async function runFFmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const ffmpegPath = await getFFmpegPath();

  try {
    // Executa sem shell para máxima segurança contra command injection
    return await execFileAsync(ffmpegPath, args, {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err: any) {
    const stderr = err?.stderr || '';
    logger.error({ err, stderr, args }, 'Falha na execução do FFmpeg');
    throw new ProcessingError(
      `Falha na execução do FFmpeg: ${err.message || stderr}`,
      '❌ Erro ao converter o vídeo para figurinha.'
    );
  }
}

export interface MediaProbeInfo {
  durationSeconds: number;
  width: number;
  height: number;
  hasAudio: boolean;
}

/**
 * Extrai informações básicas de duração e dimensões executando o FFmpeg de forma segura.
 */
export async function probeMediaWithFFmpeg(inputPath: string): Promise<MediaProbeInfo> {
  const ffmpegPath = await getFFmpegPath();

  try {
    // Usa o próprio ffmpeg com -i para extrair metadados via stderr sem dependências externas
    await execFileAsync(ffmpegPath, ['-i', inputPath], { windowsHide: true });
  } catch (err: any) {
    const output = (err?.stderr || '') + (err?.stdout || '');

    // Duração: Duration: 00:00:05.12,
    const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
    let durationSeconds = 0;
    if (durationMatch) {
      const hours = parseFloat(durationMatch[1]);
      const minutes = parseFloat(durationMatch[2]);
      const seconds = parseFloat(durationMatch[3]);
      durationSeconds = hours * 3600 + minutes * 60 + seconds;
    }

    // Resolução: Video: ..., 1280x720, ...
    const streamMatch = output.match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})/);
    const width = streamMatch ? parseInt(streamMatch[1], 10) : 512;
    const height = streamMatch ? parseInt(streamMatch[2], 10) : 512;

    const hasAudio = /Audio:/.test(output);

    return {
      durationSeconds,
      width,
      height,
      hasAudio,
    };
  }

  return {
    durationSeconds: 0,
    width: 512,
    height: 512,
    hasAudio: false,
  };
}
