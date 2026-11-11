import { type WASocket } from '@whiskeysockets/baileys';
export declare class MessageRouter {
    private readonly botStartedAtSeconds;
    /**
     * Ponto central de entrada para todos os eventos de novas mensagens do Baileys.
     */
    handleMessage(sock: WASocket, rawMessage: any): Promise<void>;
    /**
     * Processa a resposta do usuário dentro de um fluxo interativo ativo.
     */
    private handleInteractiveReply;
    /**
     * Cria o job e o envia para a fila de processamento em memória.
     */
    private queueMediaProcessing;
    /**
     * Processa eventos de voto em enquetes interativas recebidos via messages.upsert
     */
    handlePollVoteUpsert(sock: WASocket, rawMessage: any, pollUpdate: any): Promise<void>;
    /**
     * Processa eventos de voto em enquetes interativas (botões de 1 toque do WhatsApp)
     */
    handlePollUpdate(sock: WASocket, update: any): Promise<void>;
    /**
     * Executa a ação correspondente ao voto/toque registrado em qualquer enquete interativa.
     */
    private executePollAction;
}
export declare const messageRouter: MessageRouter;
