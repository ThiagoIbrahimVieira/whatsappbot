import React from 'react';
import {
  LayoutDashboard,
  Activity,
  ShieldCheck,
  Sliders,
  Trophy,
  Smartphone,
  QrCode,
  Radio,
  Zap,
} from 'lucide-react';
import { NavView, BotStatus } from '../types';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  botStatus: BotStatus;
  whatsappStatus: 'Connected' | 'Reconnecting' | 'Disconnected';
  phoneNumber: string;
  uptime: string;
  onOpenQrModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  botStatus,
  whatsappStatus,
  phoneNumber,
  uptime,
  onOpenQrModal,
}) => {
  const navItems = [
    { id: 'dashboard' as NavView, label: 'Painel de controle', icon: LayoutDashboard },
    { id: 'ranking'   as NavView, label: 'Classificação',      icon: Trophy,          badge: 'Top' },
    { id: 'activity'  as NavView, label: 'Atividade',          icon: Activity,        badge: 'Ao vivo' },
    { id: 'access'    as NavView, label: 'Acesso',             icon: ShieldCheck },
    { id: 'settings'  as NavView, label: 'Configurações',      icon: Sliders },
  ];

  const isConnected = whatsappStatus === 'Connected';
  const isBotActive = botStatus === 'active';

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0 z-20 select-none"
      style={{
        background: 'rgba(10, 12, 20, 0.80)',
        borderRight: '1px solid var(--border-hairline)',
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Brand Header ─────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        {/* Logo mark */}
        <div
          className="relative flex items-center justify-center w-10 h-10 rounded-xl font-black font-mono text-sm shrink-0"
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.25)',
            color: 'var(--accent-emerald)',
            boxShadow: '0 0 16px rgba(16,185,129,0.15)',
          }}
        >
          TT
          {/* Pulsing online dot */}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ background: 'var(--accent-emerald)' }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: 'var(--accent-emerald)' }}
            />
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm tracking-tight truncate" style={{ color: 'var(--ink-primary)' }}>
            Auto Sticker
          </span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
            Bot pessoal v1.0
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <span
          className="block px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--ink-disabled)' }}
        >
          Menu
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onSelectView(item.id)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={
                isActive
                  ? {
                      background: 'rgba(16,185,129,0.14)',
                      border: '1px solid rgba(16,185,129,0.22)',
                      color: 'var(--accent-emerald)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: 'var(--ink-secondary)',
                    }
              }
            >
              <div className="flex items-center gap-3">
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: isActive ? 'var(--accent-emerald)' : 'var(--ink-muted)' }}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                  style={
                    isActive
                      ? { background: 'rgba(16,185,129,0.25)', color: 'var(--accent-emerald)' }
                      : { background: 'rgba(255,255,255,0.07)', color: 'var(--ink-muted)' }
                  }
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── WhatsApp Status Card ──────────────────── */}
      <div className="px-3 pb-3">
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-hairline)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Phone icon with status ring */}
              <div
                className="relative flex items-center justify-center w-8 h-8 rounded-xl"
                style={{
                  background: isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                  border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                }}
              >
                <Smartphone
                  className="w-3.5 h-3.5"
                  style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
                />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                    style={{ background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
                  />
                </span>
              </div>

              <div>
                <div
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: 'var(--ink-primary)' }}
                >
                  <span>WhatsApp</span>
                  <span
                    className="text-[9px] font-bold uppercase"
                    style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
                  >
                    ● {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <p className="text-[11px] font-mono mt-0.5 truncate max-w-[100px]" style={{ color: 'var(--ink-muted)' }}>
                  {phoneNumber}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenQrModal}
              title="Ver QR Code / conexão"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--ink-disabled)' }}
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className="pt-3 flex items-center justify-between text-[11px]"
            style={{ borderTop: '1px solid var(--border-hairline)', color: 'var(--ink-muted)' }}
          >
            <span>
              Uptime:{' '}
              <strong className="font-mono" style={{ color: 'var(--ink-secondary)' }}>
                {uptime}
              </strong>
            </span>
            <span className="flex items-center gap-1" style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--ink-disabled)' }}>
              <Radio className="w-3 h-3" />
              {isConnected ? 'Ativo' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Profile Footer ────────────────────────── */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border-hairline)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--ink-secondary)',
            }}
          >
            TB
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--ink-primary)' }}>
              Administrador (Você)
            </span>
            <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              Sessão Master
            </span>
          </div>
        </div>

        <span
          className="w-2 h-2 rounded-full"
          title={`Bot: ${botStatus}`}
          style={{
            background: isBotActive ? 'var(--accent-emerald)' : botStatus === 'paused' ? 'var(--accent-gold)' : 'var(--accent-rose)',
            boxShadow: isBotActive ? '0 0 6px var(--accent-emerald)' : 'none',
          }}
        />
      </div>
    </aside>
  );
};
