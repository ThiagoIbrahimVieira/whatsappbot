/**
 * Utilitários para identificação de tipos de chat e remetentes no WhatsApp.
 */

/**
 * Retorna true se o JID pertencer a um grupo do WhatsApp (@g.us)
 */
export function isGroupChat(jid?: string | null): boolean {
  if (!jid) return false;
  return jid.endsWith('@g.us');
}

/**
 * Retorna true se o JID pertencer a um status/broadcast
 */
export function isBroadcastChat(jid?: string | null): boolean {
  if (!jid) return false;
  return jid === 'status@broadcast' || jid.endsWith('@broadcast');
}

/**
 * Retorna true se o JID pertencer a um canal/newsletter
 */
export function isNewsletterChat(jid?: string | null): boolean {
  if (!jid) return false;
  return jid.endsWith('@newsletter');
}

/**
 * Retorna true se o JID for uma conversa privada individual (1x1)
 */
export function isPrivateChat(jid?: string | null): boolean {
  if (!jid) return false;
  return jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid');
}

/**
 * Formata ou limpa um JID para exibição em logs sem expor informações sensíveis completas.
 */
export function sanitizeJidForLogs(jid?: string | null): string {
  if (!jid) return 'unknown';
  if (isGroupChat(jid)) return `group:${jid.split('@')[0].slice(0, 6)}...`;
  if (isBroadcastChat(jid)) return 'broadcast';
  if (isNewsletterChat(jid)) return 'newsletter';
  // Exibe apenas os últimos 4 dígitos do número privado
  const number = jid.split('@')[0];
  return `user:...${number.slice(-4)}`;
}
