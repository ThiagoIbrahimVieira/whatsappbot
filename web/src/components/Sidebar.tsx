import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  ShieldCheck, 
  Sliders, 
  Trophy,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Radio
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
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ranking' as NavView, label: 'Ranking', icon: Trophy, badge: 'Top' },
    { id: 'activity' as NavView, label: 'Activity', icon: Activity, badge: 'Live' },
    { id: 'access' as NavView, label: 'Access', icon: ShieldCheck },
    { id: 'settings' as NavView, label: 'Settings', icon: Sliders },
  ];

  return (
    <aside 
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0 z-20 select-none"
    >
      {/* Brand Header */}
      <div className="p-6 pb-5 flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-bold tracking-tighter shadow-sm overflow-hidden group">
          {/* Subtle dual-T sticker geometry */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-400 opacity-20" />
          <span className="relative text-base tracking-normal font-black font-mono">TT</span>
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-slate-900 truncate">
              WhatsApp Auto Sticker
            </span>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Personal bot v1.0
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="px-3 py-2 flex-1 space-y-1">
        <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500 text-white font-semibold shadow-sm shadow-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`} 
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span 
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* WhatsApp Status Card in Sidebar bottom */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span>WhatsApp</span>
                <span className="text-[10px] text-emerald-800 font-medium">● Connected</span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 leading-none mt-0.5">
                {phoneNumber}
              </p>
            </div>
          </div>
          <button 
            onClick={onOpenQrModal}
            title="View QR Code / Connection"
            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 border border-transparent hover:border-slate-200 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Uptime: <strong className="text-slate-700 font-medium">{uptime}</strong></span>
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-500" />
            Active
          </span>
        </div>
      </div>

      {/* Profile & Bot Version */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">
            TB
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-900 leading-tight">Admin (You)</span>
            <span className="text-[11px] text-slate-600">Master Session</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span 
            className={`w-2 h-2 rounded-full ${
              botStatus === 'active' 
                ? 'bg-emerald-500 ring-2 ring-emerald-100' 
                : botStatus === 'paused'
                ? 'bg-amber-500 ring-2 ring-amber-100'
                : 'bg-rose-500 ring-2 ring-rose-100'
            }`}
            title={`Bot state: ${botStatus}`}
          />
        </div>
      </div>
    </aside>
  );
};
