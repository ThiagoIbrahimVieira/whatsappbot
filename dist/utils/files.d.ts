/**
 * Garante que a pasta base de temporários existe.
 */
export declare function ensureTmpDir(): Promise<string>;
/**
 * Cria uma subpasta temporária isolada para um job específico.
 */
export declare function createJobDir(jobId: string): Promise<string>;
/**
 * Remove com segurança uma pasta temporária de job.
 */
export declare function removeJobDir(jobDir: string): Promise<void>;
/**
 * Limpa todos os temporários remanescentes (útil no bootstrap da aplicação).
 */
export declare function cleanAllTmp(): Promise<void>;
/**
 * Obtém o tamanho de um arquivo em bytes.
 */
export declare function getFileSize(filePath: string): Promise<number>;
