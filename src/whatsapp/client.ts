import { whatsAppConnection } from './connection.js';

export const whatsappClient = {
  start: () => whatsAppConnection.connect(),
  stop: () => whatsAppConnection.disconnect(),
  isConnected: () => whatsAppConnection.getStatus(),
  getSocket: () => whatsAppConnection.getSocket(),
};
