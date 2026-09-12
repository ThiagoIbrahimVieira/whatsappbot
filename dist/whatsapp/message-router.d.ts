import type { WASocket } from '@whiskeysockets/baileys';
export declare class MessageRouter {
    private readonly botStartedAtSeconds;
    /**
     * Ponto central de entrada para todos os eventos de novas mensagens do Baileys.
     */
    handleMessage(sock: WASocket, rawMessage: any): Promise<void>;
    /**
     * Cria o job e o envia para a fila de processamento em memória.
     */
    private queueMediaProcessing;
}
export declare const messageRouter: MessageRouter;
