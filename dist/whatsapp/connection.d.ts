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
    private currentPairingCode;
    private currentQr;
    getAuthInfo(): {
        isConnected: boolean;
        pairingCode: string | null;
        qr: string | null;
        qrSvg: string | null;
        pairingNumberConfigured: string | null;
    };
    requestPairingForNumber(phoneNumber: string): Promise<string>;
    resetAuth(): Promise<void>;
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
