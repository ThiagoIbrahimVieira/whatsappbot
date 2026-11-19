import React from 'react';
import { Power, QrCode, Menu, Zap } from 'lucide-react';
import { BotStatus, NavView } from '../types';

interface HeaderProps {
  currentView: NavView;
  botStatus: BotStatus;
  whatsappStatus: 'Connected' | 'Reconnecting' | 'Disconnected';
  phoneNumber: string;
  uptime: string;
  onToggleBotStatus: () => void;
  onOpenSimulateModal?: () => void;
  onOpenQrModal: () => void;
  onToggleMobilePreview?: () => void;
  isMobilePreviewActive?: boolean;
  onOpenMobileDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  botStatus,
  whatsappStatus,
  uptime,
  onToggleBotStatus,
  onOpenQrModal,
  onOpenMobileDrawer,
}) => {
  const isBotActive = botStatus === 'active';
  const isConnected = whatsappStatus === 'Connected';

  const viewTitles: Record<NavView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'WhatsApp Auto Sticker',
      subtitle: 'Automação de figurinhas e fila de conversão em tempo real.',
    },
    activity: {
      title: 'Stream de Atividade',
      subtitle: 'Telemetria e logs de conversão em tempo real.',
    },
    access: {
      title: 'Controle de Acesso',
      subtitle: 'Defina quem pode usar o bot de figurinhas.',
    },
    settings: {
      title: 'Configurações do Sistema',
      subtitle: 'Ajuste Baileys, pipeline Sharp e comandos de gatilho.',
    },
    ranking: {
      title: 'Ranking e Conquistas',
      subtitle: 'Principais criadores e registros de figurinhas enviadas.',
    },
  };

  const { title, subtitle } = viewTitles[currentView];

  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-20 px-4 sm:px-6 py-3"
      style={{
        background: 'rgba(9, 9, 11, 0.85)',
        borderBottom: '1px solid var(--border-hairline)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 -ml-1 rounded-lg transition-colors"
            style={{ color: 'var(--ink-secondary)' }}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile brand */}
          <div
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg font-mono font-bold text-xs"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.22)',
              color: 'var(--accent-emerald)',
            }}
          >
            TT
          </div>

          {/* Desktop title area */}
          <div className="hidden md:flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight truncate" style={{ color: 'var(--ink-primary)' }}>
                {title}
              </h1>

              {/* WhatsApp connection pill */}
              <button
                onClick={onOpenQrModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors"
                style={{
                  background: isConnected ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.10)',
                  border: `1px solid ${isConnected ? 'rgba(16,185,129,0.22)' : 'rgba(244,63,94,0.22)'}`,
                  color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                }}
                title="Ver sessão do WhatsApp"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                    style={{ background: 'currentColor' }}
                  />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'currentColor' }} />
                </span>
                <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
                <span className="opacity-60">· {uptime}</span>
              </button>
            </div>

            <p className="text-[11px] hidden sm:block mt-0.5 truncate" style={{ color: 'var(--ink-muted)' }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Master Bot Switch */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile connected pill */}
          <span
            className="md:hidden inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{
              background: isConnected ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.10)',
              border: `1px solid ${isConnected ? 'rgba(16,185,129,0.20)' : 'rgba(244,63,94,0.20)'}`,
              color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
            {isConnected ? 'ON' : 'OFF'}
          </span>

          {/* Master Switch button */}
          <button
            id="master-bot-switch"
            onClick={onToggleBotStatus}
            aria-label={isBotActive ? 'Pausar Bot' : 'Ativar Bot'}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
            style={
              isBotActive
                ? {
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.30)',
                    color: 'var(--accent-emerald)',
                    boxShadow: '0 0 20px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--ink-secondary)',
                  }
            }
          >
            <Power
              className="w-3.5 h-3.5"
              style={{ filter: isBotActive ? 'drop-shadow(0 0 4px var(--accent-emerald))' : 'none' }}
            />
            <span className="uppercase tracking-wider font-extrabold hidden sm:inline">
              {isBotActive ? 'BOT ATIVO' : 'BOT PAUSADO'}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest"
              style={{
                background: isBotActive ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)',
                color: isBotActive ? 'var(--accent-emerald)' : 'var(--ink-disabled)',
              }}
            >
              {isBotActive ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile sub-header */}
      <div
        className="md:hidden mt-2.5 pt-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border-hairline)' }}
      >
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
            {title}
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
};
