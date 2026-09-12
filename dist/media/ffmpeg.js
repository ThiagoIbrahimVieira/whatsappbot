import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import { config } from '../config/config.js';
import { ProcessingError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
const execFileAsync = promisify(execFile);
let cachedFFmpegPath = null;
/**
 * Resolve o caminho do executável FFmpeg.
 * Ordem de prioridade:
 * 1. config.FFMPEG_PATH definido no .env
 * 2. ffmpeg global disponível no PATH do sistema operacional
 * 3. ffmpeg-static instalado no projeto
 */
export async function getFFmpegPath() {
    if (cachedFFmpegPath) {
        return cachedFFmpegPath;
    }
    // 1. Caminho explícito no .env
    if (config.FFMPEG_PATH) {
        try {
            await fs.access(config.FFMPEG_PATH);
            cachedFFmpegPath = config.FFMPEG_PATH;
            return cachedFFmpegPath;
        }
        catch {
            throw new ProcessingError(`O caminho do FFmpeg configurado em FFMPEG_PATH não foi encontrado: ${config.FFMPEG_PATH}`, '❌ O executável do FFmpeg não foi encontrado no caminho configurado.');
        }
    }
    // 2. Caminhos conhecidos comuns (incluindo Termux no Android e Linux padrão)
    const knownPaths = [
        '/data/data/com.termux/files/usr/bin/ffmpeg',
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/opt/homebrew/bin/ffmpeg',
    ];
    for (const p of knownPaths) {
        try {
            await fs.access(p);
            cachedFFmpegPath = p;
            return cachedFFmpegPath;
        }
        catch {
            // continua procurando
        }
    }
    // 3. Tenta invocar diretamente pelo PATH do sistema operacional (funciona no Windows e Linux/Termux)
    try {
        await execFileAsync('ffmpeg', ['-version']);
        cachedFFmpegPath = 'ffmpeg';
        return cachedFFmpegPath;
    }
    catch {
        // continua
    }
    // 4. Fallback por checagem de comando do sistema (where.exe ou which)
    try {
        const isWin = process.platform === 'win32';
        const checkCmd = isWin ? 'where.exe' : 'which';
        const { stdout } = await execFileAsync(checkCmd, ['ffmpeg']);
        const foundPath = stdout.trim().split(/\r?\n/)[0];
        if (foundPath) {
            cachedFFmpegPath = foundPath;
            return cachedFFmpegPath;
        }
    }
    catch {
        // Não encontrado no PATH do sistema, tenta o fallback
    }
    // 5. Fallback opcional: ffmpeg-static caso esteja disponível no ambiente
    try {
        const pkgName = 'ffmpeg-static';
        // @ts-ignore
        const ffmpegStatic = await import(pkgName);
        const staticPath = ffmpegStatic.default || ffmpegStatic;
        if (staticPath && typeof staticPath === 'string') {
            await fs.access(staticPath);
            cachedFFmpegPath = staticPath;
            return cachedFFmpegPath;
        }
    }
    catch {
        // Falha ao carregar fallback estático
    }
    throw new ProcessingError('FFmpeg não encontrado! Por favor, instale o FFmpeg no Termux rodando "pkg install ffmpeg -y" ou defina FFMPEG_PATH no arquivo .env.', '❌ O processador de vídeos (FFmpeg) não está disponível no sistema. Rode "pkg install ffmpeg -y" no Termux.');
}
/**
 * Executa o FFmpeg com argumentos separados via execFile (sem shell, prevenindo injeção de comandos).
 */
export async function runFFmpeg(args) {
    const ffmpegPath = await getFFmpegPath();
    try {
        // Executa sem shell para máxima segurança contra command injection
        return await execFileAsync(ffmpegPath, args, {
            windowsHide: true,
            maxBuffer: 10 * 1024 * 1024,
        });
    }
    catch (err) {
        const stderr = err?.stderr || '';
        logger.error({ err, stderr, args }, 'Falha na execução do FFmpeg');
        throw new ProcessingError(`Falha na execução do FFmpeg: ${err.message || stderr}`, '❌ Erro ao converter o vídeo para figurinha.');
    }
}
/**
 * Extrai informações básicas de duração e dimensões executando o FFmpeg de forma segura.
 */
export async function probeMediaWithFFmpeg(inputPath) {
    const ffmpegPath = await getFFmpegPath();
    try {
        // Usa o próprio ffmpeg com -i para extrair metadados via stderr sem dependências externas
        await execFileAsync(ffmpegPath, ['-i', inputPath], { windowsHide: true });
    }
    catch (err) {
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
//# sourceMappingURL=ffmpeg.js.map