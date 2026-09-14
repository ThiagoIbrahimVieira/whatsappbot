import React from 'react';
import { 
  Power, 
  Sparkles, 
  Smartphone, 
  QrCode, 
  Radio, 
  Menu,
  ShieldCheck,
  Zap
} from 'lucide-react';
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
  phoneNumber,
  uptime,
  onToggleBotStatus,
  onOpenQrModal,
  onOpenMobileDrawer,
}) => {
  const isBotActive = botStatus === 'active';

  const viewTitles: Record<NavView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'WhatsApp Auto Sticker',
      subtitle: 'Control your sticker automation and live conversion queue.',
    },
    activity: {
      title: 'Live Activity Stream',
      subtitle: 'Real-time telemetry and sticker conversion logs.',
    },
    access: {
      title: 'Access Control',
      subtitle: 'Choose who can use your sticker automation bot.',
    },
    settings: {
      title: 'System & Engine Settings',
      subtitle: 'Fine-tune Baileys, Sharp image pipeline, and trigger commands.',
    },
    ranking: {
      title: 'Ranking & Conquistas',
      subtitle: 'Top criadores e recordes de figurinhas enviadas.',
    },
  };

  const { title, subtitle } = viewTitles[currentView];

  return (
    <header 
      id="app-main-header"
      className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Brand on mobile or Title on desktop */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={onOpenMobileDrawer}
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Mark */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                TT
              </div>
              <span className="font-bold text-sm text-slate-900">Auto Sticker</span>
            </div>

            {/* Desktop Title & Subtitle */}
            <div className="hidden md:block">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {title}
                </h1>

                {/* WhatsApp Status Pill */}
                <div 
                  onClick={onOpenQrModal}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 cursor-pointer hover:bg-emerald-100 transition-colors"
                  title="Click to view WhatsApp session status"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{whatsappStatus}</span>
                  <span className="text-[11px] text-emerald-600/70">· {uptime}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Mobile WhatsApp connected indicator badge */}
          <div className="md:hidden flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected
            </span>
          </div>
        </div>

        {/* Right Side Controls: Master Switch */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
          {/* MASTER SWITCH: BOT ACTIVE [ON] / BOT PAUSED [OFF] */}
          <div className="flex items-center gap-2">
            <button
              id="master-bot-switch"
              onClick={onToggleBotStatus}
              aria-label={isBotActive ? 'Pausar Bot' : 'Ativar Bot'}
              className={`relative flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs active:scale-95 cursor-pointer ${
                isBotActive
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white ring-2 ring-emerald-500/20'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700 ring-2 ring-slate-200/40'
              }`}
            >
              <Power className={`w-4 h-4 transition-transform ${isBotActive ? 'rotate-0' : 'opacity-70'}`} />
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-wider font-extrabold text-xs">
                  {isBotActive ? 'BOT ATIVO' : 'BOT PAUSADO'}
                </span>
                <span 
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${
                    isBotActive ? 'bg-white/20 text-white' : 'bg-slate-300/80 text-slate-700'
                  }`}
                >
                  {isBotActive ? 'ON' : 'OFF'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Header: Title & Subtitle for Small screens */}
      <div className="md:hidden mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>
    </header>
  );
};
