import { type WASocket } from '@whiskeysockets/baileys';
export interface WhatsAppConnectionState {
    socket: WASocket | null;
    isConnected: boolean;
}
export declare class WhatsAppConnection {
    private sock;
    private isConnected;
    private reconnectAttempts;
    private isManualShutdown;
    /**
     * Inicia ou restabelece a conexão com os servidores do WhatsApp.
     */
    connect(): Promise<WASocket>;
    /**
     * Encerramento controlado da conexão
     */
    disconnect(): Promise<void>;
    getSocket(): WASocket | null;
    getStatus(): boolean;
}
export declare const whatsAppConnection: WhatsAppConnection;
