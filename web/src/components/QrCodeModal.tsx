import React from 'react';
import { X, Smartphone, CheckCircle2, RefreshCw } from 'lucide-react';
import { SystemInfo } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInfo: SystemInfo;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  systemInfo,
}) => {
  if (!isOpen) return null;

  const isConnected = systemInfo.whatsappStatus === 'Connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="fixed inset-0 transition-opacity"
        style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden z-10 shadow-2xl"
        style={{
          background: 'rgba(14, 17, 27, 0.95)',
          border: '1px solid var(--border-hairline)',
          backdropFilter: 'blur(24px) saturate(190%)',
          boxShadow: 'var(--specular), 0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-hairline)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--accent-emerald-dim)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16,185,129,0.22)',
              }}
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                Sessão WhatsApp
              </h3>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Gateway Web Baileys Multi-Device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-center">
          {/* Status Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isConnected ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)',
              color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
            <span>{isConnected ? 'Sessão Ativa & Conectada' : 'Aguardando Conexão'}</span>
          </div>

          {/* QR Container */}
          <div
            className="mx-auto w-48 h-48 rounded-2xl p-4 flex flex-col items-center justify-center relative group"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div
              className="w-36 h-36 rounded-xl p-3 flex flex-col justify-between"
              style={{ background: '#09090B', border: '2px solid rgba(255,255,255,0.12)' }}
            >
              <div className="flex justify-between">
                <div className="w-8 h-8 rounded-sm" style={{ background: 'var(--accent-emerald)' }} />
                <div className="w-8 h-8 rounded-sm" style={{ background: 'var(--accent-emerald)' }} />
              </div>
              <div className="flex items-center justify-center">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono font-bold"
                  style={{ background: 'rgba(16,185,129,0.20)', color: 'var(--accent-emerald)' }}
                >
                  TT
                </div>
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 rounded-sm" style={{ background: 'var(--accent-emerald)' }} />
                <div className="w-4 h-4 rounded-xs" style={{ background: 'var(--accent-cyan)' }} />
              </div>
            </div>

            {isConnected && (
              <div
                className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-xs font-medium"
                style={{
                  background: 'rgba(9, 9, 11, 0.85)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <CheckCircle2 className="w-8 h-8 mb-1" style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ color: 'var(--ink-primary)' }}>Conta Vinculada</span>
                <span className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                  {systemInfo.phoneNumber}
                </span>
              </div>
            )}
          </div>

          <div className="text-xs space-y-1" style={{ color: 'var(--ink-muted)' }}>
            <p>
              Conectado via protocolo <strong className="font-mono" style={{ color: 'var(--ink-secondary)' }}>Baileys Multi-Device</strong>
            </p>
            <p>
              Uptime: <strong style={{ color: 'var(--ink-secondary)' }}>{systemInfo.uptime}</strong> • Latência:{' '}
              <strong className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{systemInfo.avgLatency}</strong>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--ink-secondary)',
              }}
            >
              Fechar
            </button>
            <button
              onClick={() => {
                alert('Credenciais da sessão recarregadas.');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: 'var(--accent-emerald)',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recarregar Sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
