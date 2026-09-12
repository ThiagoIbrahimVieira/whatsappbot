import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  Activity, 
  ShieldCheck, 
  Sliders, 
  Smartphone, 
  QrCode,
  Power
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
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'activity' as NavView, label: 'Activity Logs', icon: Activity },
    { id: 'access' as NavView, label: 'Access Control', icon: ShieldCheck },
    { id: 'settings' as NavView, label: 'Settings & Engine', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col shadow-2xl z-10">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
              TT
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block leading-tight">
                Auto Sticker
              </span>
              <span className="text-[11px] text-slate-600">Personal Bot</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Switch on Drawer */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Master Bot State
          </div>
          <button
            onClick={() => {
              onToggleBotStatus();
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all ${
              isBotActive
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Power className="w-4 h-4" />
              <span>{isBotActive ? 'BOT ACTIVE' : 'BOT PAUSED'}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-black/10 uppercase tracking-widest text-[10px]">
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* WhatsApp info & QR button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block leading-tight">{phoneNumber}</span>
                <span className="text-[10px] text-slate-500">Uptime {uptime}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenQrModal();
              }}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
