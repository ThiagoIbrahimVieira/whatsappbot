import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { webServer } from '../../src/server/web-server.js';

describe('Web Server & REST API Tests', () => {
  const TEST_PORT = 3199;

  beforeAll(async () => {
    await webServer.start(TEST_PORT, '127.0.0.1');
  });

  afterAll(async () => {
    await webServer.stop();
  });

  function apiRequest(path: string, options: http.RequestOptions = {}, bodyData: any = null): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: TEST_PORT,
          path,
          ...options,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode || 200, data: JSON.parse(data) });
            } catch {
              resolve({ status: res.statusCode || 200, data });
            }
          });
        }
      );

      req.on('error', reject);

      if (bodyData) {
        req.write(JSON.stringify(bodyData));
      }
      req.end();
    });
  }

  it('GET /api/status deve retornar informações de status e métricas do sistema', async () => {
    const res = await apiRequest('/api/status');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('connected');
    expect(res.data).toHaveProperty('botActive');
    expect(res.data).toHaveProperty('metrics');
    expect(res.data).toHaveProperty('systemInfo');
    expect(res.data.systemInfo).toHaveProperty('runtime');
  });

  it('POST /api/bot/toggle deve alternar o estado do bot', async () => {
    const resToggleOff = await apiRequest('/api/bot/toggle', { method: 'POST' }, { active: false });
    expect(resToggleOff.status).toBe(200);
    expect(resToggleOff.data.active).toBe(false);

    const resStatus = await apiRequest('/api/status');
    expect(resStatus.data.botActive).toBe(false);

    const resToggleOn = await apiRequest('/api/bot/toggle', { method: 'POST' }, { active: true });
    expect(resToggleOn.status).toBe(200);
    expect(resToggleOn.data.active).toBe(true);
  });

  it('POST /api/whitelist/add e GET /api/whitelist devem gerenciar contatos autorizados', async () => {
    const resAdd = await apiRequest('/api/whitelist/add', { method: 'POST' }, {
      name: 'Tester Web',
      phone: '5511988881234',
    });
    expect(resAdd.status).toBe(201);
    expect(resAdd.data.contact.name).toBe('Tester Web');

    const resList = await apiRequest('/api/whitelist');
    expect(resList.status).toBe(200);
    expect(resList.data.contacts.some((c: any) => c.phone.includes('5511988881234'))).toBe(true);

    const resRemove = await apiRequest('/api/whitelist/remove', { method: 'POST' }, {
      id: resAdd.data.contact.id,
    });
    expect(resRemove.status).toBe(200);
    expect(resRemove.data.success).toBe(true);
  });

  it('POST /api/access-mode deve alterar o modo de acesso', async () => {
    const resMode = await apiRequest('/api/access-mode', { method: 'POST' }, { mode: 'all' });
    expect(resMode.status).toBe(200);
    expect(resMode.data.mode).toBe('all');

    const resRestore = await apiRequest('/api/access-mode', { method: 'POST' }, { mode: 'whitelist' });
    expect(resRestore.status).toBe(200);
    expect(resRestore.data.mode).toBe('whitelist');
  });

  it('GET /api/recent deve retornar lista de atividades', async () => {
    const res = await apiRequest('/api/recent');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.activities)).toBe(true);
  });
});
