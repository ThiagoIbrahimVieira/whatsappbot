/**
 * Escreve um arquivo em disco de forma atômica (salva primeiro como .tmp e renomeia).
 * Evita que o arquivo seja corrompido em caso de desligamento abrupto ou crash.
 */
export declare function atomicWriteFileSync(filePath: string, content: string): void;
/**
 * Lê e parseia um arquivo JSON de forma segura com fallback caso esteja ausente ou corrompido.
 */
export declare function safeReadJsonSync<T>(filePath: string, fallback: T): T;
