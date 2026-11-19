import React from 'react';
import { LayoutDashboard, Trophy, Activity, ShieldCheck, Sliders } from 'lucide-react';
import { NavView } from '../types';

interface MobileBottomNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
}) => {
  const tabs = [
    { id: 'dashboard' as NavView, label: 'Painel',     icon: LayoutDashboard },
    { id: 'ranking'   as NavView, label: 'Ranking',    icon: Trophy },
    { id: 'activity'  as NavView, label: 'Atividade',  icon: Activity },
    { id: 'access'    as NavView, label: 'Acesso',     icon: ShieldCheck },
    { id: 'settings'  as NavView, label: 'Ajustes',    icon: Sliders },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-3 py-2 flex items-center justify-around select-none"
      style={{
        background: 'rgba(9, 9, 11, 0.90)',
        borderTop: '1px solid var(--border-hairline)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;

        return (
          <button
            key={tab.id}
            id={`mobile-tab-${tab.id}`}
            onClick={() => onSelectView(tab.id)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all"
            style={{
              color: isActive ? 'var(--accent-emerald)' : 'var(--ink-muted)',
            }}
          >
            <div
              className="p-1 rounded-lg transition-colors"
              style={{
                background: isActive ? 'rgba(16,185,129,0.15)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
