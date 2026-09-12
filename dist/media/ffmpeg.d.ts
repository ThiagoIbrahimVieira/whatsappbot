/**
 * Resolve o caminho do executável FFmpeg.
 * Ordem de prioridade:
 * 1. config.FFMPEG_PATH definido no .env
 * 2. ffmpeg global disponível no PATH do sistema operacional
 * 3. ffmpeg-static instalado no projeto
 */
export declare function getFFmpegPath(): Promise<string>;
/**
 * Executa o FFmpeg com argumentos separados via execFile (sem shell, prevenindo injeção de comandos).
 */
export declare function runFFmpeg(args: string[]): Promise<{
    stdout: string;
    stderr: string;
}>;
export interface MediaProbeInfo {
    durationSeconds: number;
    width: number;
    height: number;
    hasAudio: boolean;
}
/**
 * Extrai informações básicas de duração e dimensões executando o FFmpeg de forma segura.
 */
export declare function probeMediaWithFFmpeg(inputPath: string): Promise<MediaProbeInfo>;
