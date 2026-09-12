/**
 * Utilitários para identificação de tipos de chat e remetentes no WhatsApp.
 */
/**
 * Retorna true se o JID pertencer a um grupo do WhatsApp (@g.us)
 */
export declare function isGroupChat(jid?: string | null): boolean;
/**
 * Retorna true se o JID pertencer a um status/broadcast
 */
export declare function isBroadcastChat(jid?: string | null): boolean;
/**
 * Retorna true se o JID pertencer a um canal/newsletter
 */
export declare function isNewsletterChat(jid?: string | null): boolean;
/**
 * Retorna true se o JID for uma conversa privada individual (1x1)
 */
export declare function isPrivateChat(jid?: string | null): boolean;
/**
 * Formata ou limpa um JID para exibição em logs sem expor informações sensíveis completas.
 */
export declare function sanitizeJidForLogs(jid?: string | null): string;
