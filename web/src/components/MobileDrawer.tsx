import React from 'react';
import {
  X,
  LayoutDashboard,
  Activity,
  ShieldCheck,
  Sliders,
  Trophy,
  Smartphone,
  QrCode,
  Power,
} from 'lucide-react';
import { NavView, BotStatus } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  botStatus: BotStatus;
  onToggleBotStatus: () => void;
  phoneNumber: string;
  uptime: string;
  onOpenQrModal: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  botStatus,
  onToggleBotStatus,
  phoneNumber,
  uptime,
  onOpenQrModal,
}) => {
  if (!isOpen) return null;

  const isBotActive = botStatus === 'active';

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Painel de controle', icon: LayoutDashboard },
    { id: 'ranking'   as NavView, label: 'Classificação & Pódio', icon: Trophy },
    { id: 'activity'  as NavView, label: 'Logs de Atividade',   icon: Activity },
    { id: 'access'    as NavView, label: 'Controle de Acesso',  icon: ShieldCheck },
    { id: 'settings'  as NavView, label: 'Configurações',      icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{ background: 'rgba(0, 0, 0, 0.70)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="relative w-72 max-w-[80vw] h-full flex flex-col z-10 shadow-2xl"
        style={{
          background: 'rgba(10, 12, 20, 0.95)',
          borderRight: '1px solid var(--border-hairline)',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        }}
      >
        {/* Drawer Header */}
        <div
          className="p-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-hairline)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.30)',
                color: 'var(--accent-emerald)',
              }}
            >
              TT
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight" style={{ color: 'var(--ink-primary)' }}>
                Auto Sticker
              </span>
              <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                Bot Pessoal
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Switch on Drawer */}
        <div
          className="p-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ink-disabled)' }}>
            Estado Mestre do Bot
          </div>
          <button
            onClick={() => { onToggleBotStatus(); }}
            className="w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
            style={
              isBotActive
                ? {
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.30)',
                    color: 'var(--accent-emerald)',
                    boxShadow: '0 0 16px rgba(16,185,129,0.12)',
                  }
                : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--ink-secondary)',
                  }
            }
          >
            <div className="flex items-center gap-2">
              <Power className="w-4 h-4" />
              <span>{isBotActive ? 'BOT ATIVO' : 'BOT PAUSADO'}</span>
            </div>
            <span
              className="px-2 py-0.5 rounded uppercase tracking-widest text-[9px] font-mono"
              style={{
                background: isBotActive ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)',
                color: isBotActive ? 'var(--accent-emerald)' : 'var(--ink-disabled)',
              }}
            >
              {isBotActive ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors"
                style={
                  isActive
                    ? {
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.22)',
                        color: 'var(--accent-emerald)',
                        fontWeight: 600,
                      }
                    : {
                        color: 'var(--ink-secondary)',
                        background: 'transparent',
                        border: '1px solid transparent',
                      }
                }
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: isActive ? 'var(--accent-emerald)' : 'var(--ink-muted)' }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* WhatsApp info & QR button */}
        <div
          className="p-4 space-y-2"
          style={{
            borderTop: '1px solid var(--border-hairline)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
              <div className="text-xs">
                <span className="font-semibold block leading-tight font-mono" style={{ color: 'var(--ink-primary)' }}>
                  {phoneNumber}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                  Uptime {uptime}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenQrModal();
              }}
              className="p-2 rounded-lg transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--ink-secondary)',
              }}
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
