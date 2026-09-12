import React, { useState, useEffect, useCallback } from 'react';
import { api, toUiMode } from './api';
import type { 
  NavView, 
  BotStatus, 
  AccessMode, 
  MetricsData, 
  SystemInfo, 
  QuickSettings, 
  ActivityItem, 
  WhitelistContact 
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { DashboardView } from './components/DashboardView';
import { ActivityView } from './components/ActivityView';
import { AccessView } from './components/AccessView';
import { SettingsView } from './components/SettingsView';
import { AddPersonModal } from './components/AddPersonModal';
import { QrCodeModal } from './components/QrCodeModal';
import { Toast } from './components/Toast';

const DEFAULT_METRICS: MetricsData = {
  stickersToday: 0,
  successful: 0,
  queued: 0,
  failed: 0,
};

const DEFAULT_SYSTEM_INFO: SystemInfo = {
  whatsappStatus: 'Disconnected',
  phoneNumber: 'Conectando...',
  uptime: '0m',
  runtime: 'Node.js',
  engine: 'Baileys Multi-Device',
  imageLibrary: 'Sharp v0.33',
  videoLibrary: 'FFmpeg (libwebp)',
  version: 'v1.0.0',
  memoryUsage: '0 MB',
  avgLatency: '0 ms',
  lastPing: 'Agora',
};

const DEFAULT_SETTINGS: QuickSettings = {
  images: true,
  videos: true,
  gifs: true,
  commands: true,
  autoCropSquare: true,
  keepQuality: true,
  replyWithAuthor: true,
  packName: 'Auto Sticker Bot',
  authorName: 'Thiago Ibrahim',
};

export default function App() {
  // Navigation & Core States
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [botStatus, setBotStatus] = useState<BotStatus>('active');
  const [accessMode, setAccessMode] = useState<AccessMode>('whitelist');
  
  // Real Backend Data States
  const [metrics, setMetrics] = useState<MetricsData>(DEFAULT_METRICS);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
  const [quickSettings, setQuickSettings] = useState<QuickSettings>(DEFAULT_SETTINGS);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [contacts, setContacts] = useState<WhitelistContact[]>([]);

  // Modals & UI controls
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Polling dos dados reais do backend
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, recentRes, whitelistRes] = await Promise.all([
        api.bot.getStatus(),
        api.activity.getRecent(),
        api.access.getWhitelist(),
      ]);

      setBotStatus(statusRes.botStatus);
      setAccessMode(toUiMode(statusRes.accessMode));
      setMetrics(statusRes.metrics);
      setSystemInfo(statusRes.systemInfo);
      setQuickSettings(statusRes.quickSettings);
      setActivities(recentRes);
      setContacts(whitelistRes);
    } catch (err: any) {
      console.warn('Erro na sincronização periódica com a API:', err?.message || err);
    }
  }, []);

  // Inicia polling com intervalo de 3.5 segundos
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3500);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Alternador mestre do Bot
  const handleToggleBotStatus = async () => {
    try {
      const willBeActive = botStatus !== 'active';
      showToast(willBeActive ? 'Ativando Bot...' : 'Pausando Bot...');
      
      const res = await api.bot.toggle(willBeActive);
      setBotStatus(res.active ? 'active' : 'paused');
      showToast(res.active ? '🟢 Bot Ativo — Mídias recebidas serão convertidas' : '⏸️ Bot Pausado — Novas mensagens serão ignoradas');
      
      // Sincroniza imediatamente
      fetchData();
    } catch (err: any) {
      showToast(`❌ Erro ao alterar status: ${err.message}`);
    }
  };

  // Alternador de configurações individuais
  const handleToggleSetting = async (key: keyof QuickSettings) => {
    try {
      const updatedValue = !quickSettings[key];
      const updatedObj = { ...quickSettings, [key]: updatedValue };
      setQuickSettings(updatedObj);

      await api.bot.updateSettings({ [key]: updatedValue });
      showToast(`Configuração ${String(key).toUpperCase()} ${updatedValue ? 'habilitada' : 'desabilitada'}`);
    } catch (err: any) {
      showToast(`❌ Erro ao atualizar configuração: ${err.message}`);
      fetchData();
    }
  };

  const handleUpdateSettings = async (updates: Partial<QuickSettings>) => {
    try {
      setQuickSettings((prev) => ({ ...prev, ...updates }));
      await api.bot.updateSettings(updates);
      showToast('Configurações salvas com sucesso');
    } catch (err: any) {
      showToast(`❌ Erro ao salvar: ${err.message}`);
      fetchData();
    }
  };

  // Mudança do modo de acesso
  const handleSelectAccessMode = async (mode: AccessMode) => {
    try {
      setAccessMode(mode);
      await api.access.setAccessMode(mode);
      showToast(`Modo de acesso definido para: ${mode.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      showToast(`❌ Erro ao alterar modo de acesso: ${err.message}`);
      fetchData();
    }
  };

  // Adicionar pessoa à Whitelist
  const handleAddContact = async (newContact: Omit<WhitelistContact, 'id' | 'addedDate'>) => {
    try {
      const added = await api.access.addContact(newContact.name, newContact.phone);
      setContacts((prev) => [added, ...prev.filter((c) => c.id !== added.id)]);
      showToast(`Contato ${added.name} liberado com sucesso!`);
    } catch (err: any) {
      showToast(`❌ Erro ao liberar contato: ${err.message}`);
    }
  };

  // Remover pessoa da Whitelist
  const handleRemoveContact = async (id: string) => {
    try {
      const contactToRemove = contacts.find((c) => c.id === id);
      await api.access.removeContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (contactToRemove) {
        showToast(`Contato ${contactToRemove.name} removido da lista.`);
      }
    } catch (err: any) {
      showToast(`❌ Erro ao remover contato: ${err.message}`);
    }
  };

  const handleClearActivities = async () => {
    try {
      await api.activity.clear();
      setActivities([]);
      showToast('Histórico de atividades limpo.');
    } catch (err: any) {
      showToast(`❌ Erro ao limpar histórico: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
      {/* 1. Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        botStatus={botStatus}
        whatsappStatus={systemInfo.whatsappStatus}
        phoneNumber={systemInfo.phoneNumber}
        uptime={systemInfo.uptime}
        onOpenQrModal={() => setIsQrModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Sticky Header com Master Switch real */}
        <Header
          currentView={currentView}
          botStatus={botStatus}
          whatsappStatus={systemInfo.whatsappStatus}
          phoneNumber={systemInfo.phoneNumber}
          uptime={systemInfo.uptime}
          onToggleBotStatus={handleToggleBotStatus}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-8">
          {currentView === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              systemInfo={systemInfo}
              recentActivities={activities}
              quickSettings={quickSettings}
              accessMode={accessMode}
              allowedCount={contacts.length}
              onToggleSetting={handleToggleSetting}
              onNavigate={setCurrentView}
              onOpenQrModal={() => setIsQrModalOpen(true)}
            />
          )}

          {currentView === 'activity' && (
            <ActivityView
              activities={activities}
              onClearActivities={handleClearActivities}
            />
          )}

          {currentView === 'access' && (
            <AccessView
              accessMode={accessMode}
              onSelectAccessMode={handleSelectAccessMode}
              contacts={contacts}
              onRemoveContact={handleRemoveContact}
              onOpenAddPersonModal={() => setIsAddPersonOpen(true)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              botStatus={botStatus}
              onToggleBotStatus={handleToggleBotStatus}
              quickSettings={quickSettings}
              onUpdateSettings={handleUpdateSettings}
              systemInfo={systemInfo}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* 3. Mobile Navigation Bottom Bar */}
      <MobileBottomNav
        currentView={currentView}
        onSelectView={setCurrentView}
      />

      {/* 4. Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentView={currentView}
        onSelectView={setCurrentView}
        botStatus={botStatus}
        onToggleBotStatus={handleToggleBotStatus}
        phoneNumber={systemInfo.phoneNumber}
        uptime={systemInfo.uptime}
        onOpenQrModal={() => setIsQrModalOpen(true)}
      />

      {/* 5. Modals */}
      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        onAddContact={handleAddContact}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        systemInfo={systemInfo}
      />

      {/* 6. Micro-interaction Toast */}
      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}
