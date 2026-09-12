import { request } from './client';
import type { AccessMode, WhitelistContact } from '../types';

export type BackendAccessMode = 'self' | 'whitelist' | 'all';

export function toBackendMode(mode: AccessMode): BackendAccessMode {
  switch (mode) {
    case 'only_me':
      return 'self';
    case 'everyone':
      return 'all';
    case 'whitelist':
    default:
      return 'whitelist';
  }
}

export function toUiMode(mode: BackendAccessMode): AccessMode {
  switch (mode) {
    case 'self':
      return 'only_me';
    case 'all':
      return 'everyone';
    case 'whitelist':
    default:
      return 'whitelist';
  }
}

export const accessApi = {
  getWhitelist: async (): Promise<WhitelistContact[]> => {
    const res = await request<{ contacts: WhitelistContact[] }>('/whitelist');
    return res.contacts || [];
  },

  addContact: async (name: string, phone: string): Promise<WhitelistContact> => {
    const res = await request<{ contact: WhitelistContact }>('/whitelist/add', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    });
    return res.contact;
  },

  removeContact: async (idOrPhone: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/whitelist/remove', {
      method: 'POST',
      body: JSON.stringify({ id: idOrPhone }),
    });
  },

  setAccessMode: async (uiMode: AccessMode): Promise<{ mode: BackendAccessMode }> => {
    const backendMode = toBackendMode(uiMode);
    return request<{ mode: BackendAccessMode }>('/access-mode', {
      method: 'POST',
      body: JSON.stringify({ mode: backendMode }),
    });
  },
};
