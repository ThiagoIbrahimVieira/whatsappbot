export type BackendAccessMode = 'all' | 'whitelist' | 'self';
export interface WhitelistContact {
    id: string;
    name: string;
    phone: string;
    addedDate: string;
    avatarColor?: string;
    totalConverted?: number;
}
export declare class AccessControlManager {
    private accessMode;
    private contacts;
    constructor();
    private cleanPhone;
    private loadFromDisk;
    private saveToDisk;
    getAccessMode(): BackendAccessMode;
    setAccessMode(mode: BackendAccessMode): void;
    getContacts(): WhitelistContact[];
    addContact(name: string, phone: string): WhitelistContact;
    removeContact(idOrPhone: string): boolean;
    incrementConverted(phone: string): void;
    /**
     * Avalia se uma mensagem é permitida com base nas regras de acesso.
     */
    isAllowed(chatId: string, senderJid: string, isSelfChat: boolean): {
        allowed: boolean;
        reason?: string;
    };
}
export declare const accessControl: AccessControlManager;
