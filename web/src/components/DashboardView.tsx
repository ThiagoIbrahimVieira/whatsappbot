import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Smartphone,
  ShieldCheck,
  ArrowUpRight,
  Settings2,
  FileImage,
  Video,
  Film,
  QrCode,
  TrendingUp,
  ChevronRight,
  Zap,
  Activity,
} from 'lucide-react';
import { MetricsData, SystemInfo, ActivityItem, QuickSettings, AccessMode, NavView } from '../types';

interface DashboardViewProps {
  metrics: MetricsData;
  systemInfo: SystemInfo;
  recentActivities: ActivityItem[];
  quickSettings: QuickSettings;
  accessMode: AccessMode;
  allowedCount: number;
  onToggleSetting: (key: keyof QuickSettings) => void;
  onNavigate: (view: NavView) => void;
  onOpenQrModal: () => void;
  onOpenSimulateModal?: () => void;
}

/* ─── Reusable Switch ─────────────────────────────────── */
const Switch: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`pill-switch ${checked ? 'pill-switch-on' : 'pill-switch-off'}`}
  >
    <span className="pill-switch-thumb" />
  </button>
);

/* ─── Status Badge ────────────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
    Processed: {
      bg: 'var(--accent-emerald-dim)',
      color: 'var(--accent-emerald)',
      border: 'rgba(16,185,129,0.22)',
      label: 'Processado',
    },
    Unauthorized: {
      bg: 'var(--accent-gold-dim)',
      color: 'var(--accent-gold)',
      border: 'rgba(245,158,11,0.22)',
      label: 'Não autorizado',
    },
    Failed: {
      bg: 'var(--accent-rose-dim)',
      color: 'var(--accent-rose)',
      border: 'rgba(244,63,94,0.22)',
      label: 'Falhou',
    },
    Queued: {
      bg: 'rgba(255,255,255,0.06)',
      color: 'var(--ink-secondary)',
      border: 'var(--border-hairline)',
      label: 'Na fila',
    },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {s.label}
    </span>
  );
};

/* ─── Media Icon ─────────────────────────────────────── */
const MediaIcon: React.FC<{ type: string }> = ({ type }) => {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    IMAGE: { icon: FileImage, color: 'var(--accent-blue)' },
    VIDEO: { icon: Video,     color: '#A78BFA' },
    GIF:   { icon: Film,      color: 'var(--accent-gold)' },
  };
  const item = map[type] ?? map['IMAGE'];
  const Icon = item.icon;
  return <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />;
};

/* ─── Metric Card ────────────────────────────────────── */
const MetricCard: React.FC<{
  label: string;
  value: number | string;
  sub?: React.ReactNode;
  accent: string;
  accentDim: string;
  icon: React.ElementType;
}> = ({ label, value, sub, accent, accentDim, icon: Icon }) => (
  <div
    className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </span>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: accentDim }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: 'var(--ink-primary)' }}>
        {value}
      </span>
      {sub && <span className="text-[11px]" style={{ color: accent }}>{sub}</span>}
    </div>
  </div>
);

/* ─── Hourly bar data ────────────────────────────────── */
const hourlyData = [
  { hour: '09h', count: 4, height: '35%' },
  { hour: '10h', count: 7, height: '55%' },
  { hour: '11h', count: 12, height: '85%' },
  { hour: '12h', count: 6, height: '45%' },
  { hour: '13h', count: 9, height: '70%' },
  { hour: '14h', count: 14, height: '100%', highlight: true },
  { hour: '15h', count: 3, height: '25%' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  systemInfo,
  recentActivities,
  quickSettings,
  accessMode,
  allowedCount,
  onToggleSetting,
  onNavigate,
  onOpenQrModal,
}) => {
  const successRate = ((metrics.successful / (metrics.stickersToday || 1)) * 100).toFixed(0);
  const isConnected = systemInfo.whatsappStatus === 'Connected';

  return (
    <div id="dashboard-view" className="space-y-5 max-w-7xl mx-auto pb-20 animate-fade-in">

      {/* ── 1. Metric Cards Row ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Stickers Hoje"
          value={metrics.stickersToday}
          sub={<><TrendingUp className="w-3 h-3 inline mr-0.5" />+14%</>}
          accent="var(--accent-emerald)"
          accentDim="var(--accent-emerald-dim)"
          icon={Sparkles}
        />
        <MetricCard
          label="Convertidos"
          value={metrics.successful}
          sub={`${successRate}% rate`}
          accent="var(--accent-emerald)"
          accentDim="var(--accent-emerald-dim)"
          icon={CheckCircle2}
        />
        <MetricCard
          label="Na Fila"
          value={metrics.queued}
          sub="In buffer"
          accent="var(--accent-cyan)"
          accentDim="var(--accent-cyan-dim)"
          icon={Clock}
        />
        <MetricCard
          label="Falhos"
          value={metrics.failed}
          sub="Excedeu limite"
          accent="var(--accent-rose)"
          accentDim="var(--accent-rose-dim)"
          icon={AlertCircle}
        />
      </div>

      {/* ── 2. Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left + Center (8 cols) */}
        <div className="lg:col-span-8 space-y-5">

          {/* WhatsApp Gateway Card */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              boxShadow: 'var(--specular)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: isConnected ? 'rgba(16,185,129,0.14)' : 'rgba(244,63,94,0.14)',
                    border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                    boxShadow: isConnected ? '0 0 16px rgba(16,185,129,0.12)' : 'none',
                  }}
                >
                  <Smartphone className="w-5 h-5" style={{ color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                      WhatsApp Gateway
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        background: isConnected ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                        border: `1px solid ${isConnected ? 'rgba(16,185,129,0.22)' : 'rgba(244,63,94,0.22)'}`,
                        color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    <span>
                      Conta:{' '}
                      <span className="font-mono font-semibold" style={{ color: 'var(--ink-secondary)' }}>
                        {systemInfo.phoneNumber}
                      </span>
                    </span>
                    <span>
                      Uptime:{' '}
                      <span className="font-semibold" style={{ color: 'var(--ink-secondary)' }}>
                        {systemInfo.uptime}
                      </span>
                    </span>
                    <span>
                      Latência:{' '}
                      <span className="font-mono font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                        {systemInfo.avgLatency}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={onOpenQrModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR Session
                </button>
              </div>
            </div>

            {/* Throughput bar chart */}
            <div
              className="mt-5 pt-4"
              style={{ borderTop: '1px solid var(--border-hairline)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                  Throughput por Hora — Hoje
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--ink-disabled)' }}>
                  Pico: 14h (14 stickers)
                </span>
              </div>

              <div className="h-14 flex items-end justify-between gap-1.5">
                {hourlyData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full rounded-md flex items-end justify-center"
                      style={{ height: '44px', background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div
                        style={{
                          height: item.height,
                          width: '100%',
                          borderRadius: '4px',
                          background: item.highlight ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.12)',
                          transition: 'all 150ms ease',
                          boxShadow: item.highlight ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                        }}
                        title={`${item.count} stickers às ${item.hour}`}
                      />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: 'var(--ink-disabled)' }}>
                      {item.hour}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              boxShadow: 'var(--specular)',
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                    Atividade Recente
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                    Stream de metadados de sticker requests
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('activity')}
                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                style={{ color: 'var(--accent-emerald)' }}
              >
                Ver todos
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y" style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}>
              {recentActivities.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs" style={{ color: 'var(--ink-disabled)' }}>Nenhuma atividade ainda.</p>
                </div>
              ) : (
                recentActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="py-3 px-5 flex items-center justify-between gap-3 text-xs transition-colors"
                    style={{ borderBottom: '1px solid var(--border-hairline)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="font-mono text-[11px] shrink-0 font-medium tabular-nums"
                        style={{ color: 'var(--ink-disabled)' }}
                      >
                        {activity.timestamp}
                      </span>

                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                          {activity.senderName}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--border-hairline)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          <MediaIcon type={activity.mediaType} />
                          {activity.mediaType}
                        </span>
                        {activity.commandUsed && (
                          <span
                            className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ink-muted)' }}
                          >
                            {activity.commandUsed}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activity.processingTimeMs !== undefined && activity.processingTimeMs > 0 && (
                        <span className="hidden sm:inline font-mono text-[11px] tabular-nums" style={{ color: 'var(--ink-disabled)' }}>
                          {activity.processingTimeMs}ms
                        </span>
                      )}
                      <StatusBadge status={activity.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-5">

          {/* Access Mode Card */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              boxShadow: 'var(--specular)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                Modo de Acesso
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-emerald-dim)' }}
              >
                <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold capitalize" style={{ color: 'var(--ink-primary)' }}>
                  {accessMode.replace('_', ' ')}
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--accent-emerald-dim)',
                    color: 'var(--accent-emerald)',
                    border: '1px solid rgba(16,185,129,0.20)',
                  }}
                >
                  {allowedCount} liberados
                </span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--ink-muted)' }}>
                {accessMode === 'whitelist' && 'Apenas contatos aprovados podem gerar stickers.'}
                {accessMode === 'only_me' && 'Modo pessoal: apenas o seu número tem acesso.'}
                {accessMode === 'everyone' && 'Modo público: qualquer pessoa pode usar o bot.'}
              </p>
            </div>

            <button
              onClick={() => onNavigate('access')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--ink-secondary)',
              }}
            >
              <span>Gerenciar whitelist</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--ink-disabled)' }} />
            </button>
          </div>

          {/* Quick Settings Card */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              boxShadow: 'var(--specular)',
            }}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                  Config. Rápidas
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                  Regras de conversão de mídia
                </p>
              </div>
              <button
                onClick={() => onNavigate('settings')}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--ink-disabled)' }}
                title="Todas as configurações"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: 'images' as const,   label: 'Imagens',  sub: 'Converte fotos em stickers WebP.' },
                { key: 'videos' as const,   label: 'Vídeos',   sub: 'MP4 até 10s → WebP animado.' },
                { key: 'gifs' as const,     label: 'GIFs',     sub: 'Loops GIF → WebP animado.' },
                { key: 'commands' as const, label: 'Comandos', sub: 'Gatilhos !s, !sticker, !crop.' },
              ].map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold block" style={{ color: 'var(--ink-primary)' }}>
                      {label}
                    </span>
                    <span className="text-[11px] leading-snug block mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      {sub}
                    </span>
                  </div>
                  <Switch
                    checked={quickSettings[key] as boolean}
                    onChange={() => onToggleSetting(key)}
                    label={`Toggle ${label}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Stack Telemetry */}
          <div
            className="rounded-2xl p-4 text-xs space-y-3"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-disabled)' }}>
                Stack Telemetry
              </span>
              <span
                className="text-[10px] font-semibold flex items-center gap-1"
                style={{ color: 'var(--accent-emerald)' }}
              >
                <Zap className="w-3 h-3" />
                Healthy
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { label: 'Engine', value: 'Baileys' },
                { label: 'Image',  value: 'Sharp' },
                { label: 'Video',  value: 'FFmpeg' },
                { label: 'Memória', value: systemInfo.memoryUsage },
              ].map(({ label, value }) => (
                <div key={label} style={{ color: 'var(--ink-muted)' }}>
                  {label}:{' '}
                  <span className="font-mono" style={{ color: 'var(--ink-secondary)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
