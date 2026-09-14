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
  Terminal,
  RefreshCw,
  QrCode,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Info
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
  onOpenSimulateModal,
}) => {
  // Activity bar chart data (inspired by reference image composition)
  const hourlyData = [
    { hour: '09h', count: 4, height: '35%' },
    { hour: '10h', count: 7, height: '55%' },
    { hour: '11h', count: 12, height: '85%' },
    { hour: '12h', count: 6, height: '45%' },
    { hour: '13h', count: 9, height: '70%' },
    { hour: '14h', count: 14, height: '100%', highlight: true },
    { hour: '15h', count: 3, height: '25%' },
  ];

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <FileImage className="w-3.5 h-3.5 text-blue-600" />;
      case 'VIDEO':
        return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'GIF':
        return <Film className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <FileImage className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Processed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Processed
          </span>
        );
      case 'Unauthorized':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Unauthorized
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Failed
          </span>
        );
      case 'Queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Queued
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="dashboard-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TOP METRICS ROW: 4 Compact Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stickers Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Stickers Today
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.stickersToday}
            </span>
            <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +14%
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Generated past 24h</p>
        </div>

        {/* Successful */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Successful
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.successful}
            </span>
            <span className="text-[11px] font-medium text-slate-600">
              {((metrics.successful / (metrics.stickersToday || 1)) * 100).toFixed(0)}% rate
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Converted into WebP</p>
        </div>

        {/* Queued */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Queued
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.queued}
            </span>
            <span className="text-[11px] font-medium text-blue-800">
              In buffer
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Sharp/FFmpeg workers</p>
        </div>

        {/* Failed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Failed
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.failed}
            </span>
            <span className="text-[11px] font-medium text-rose-800">
              1 video length
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">Exceeded size/duration</p>
        </div>
      </div>

      {/* 2. PRIMARY CONTENT GRID: Status + Activity + Access + Quick Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT & CENTER COLUMN (8 cols): Status Card + Conversion Throughput + Recent Activity */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* SPECIAL WHATSAPP STATUS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">WhatsApp Gateway</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Connected
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                    <span>Account: <strong className="font-mono text-slate-800 font-semibold">{systemInfo.phoneNumber}</strong></span>
                    <span>Uptime: <strong className="text-slate-800 font-medium">{systemInfo.uptime}</strong></span>
                    <span>Latency: <strong className="text-slate-800 font-medium">{systemInfo.avgLatency}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={onOpenQrModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR Session
                </button>
                <button
                  onClick={onOpenSimulateModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Simulate
                </button>
              </div>
            </div>

            {/* Mini Telemetry Bar (inspired by reference visual proportions) */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-slate-600">
                  Today's Throughput by Hour
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Peak: 14h (14 stickers)
                </div>
              </div>

              <div className="h-16 flex items-end justify-between gap-2 px-1 pt-2">
                {hourlyData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full bg-slate-100 rounded-md h-12 flex items-end justify-center p-0.5">
                      <div 
                        style={{ height: item.height }}
                        className={`w-full rounded-sm transition-all ${
                          item.highlight 
                            ? 'bg-emerald-500 group-hover:bg-emerald-600' 
                            : 'bg-slate-300 group-hover:bg-emerald-400'
                        }`}
                        title={`${item.count} stickers at ${item.hour}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">
                      {item.hour}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY SECTION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                <p className="text-xs text-slate-600">Live metadata stream of incoming sticker requests</p>
              </div>
              <button
                onClick={() => onNavigate('activity')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900 transition-colors"
              >
                View all logs
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Activity Metadata List */}
            <div className="divide-y divide-slate-100 mt-1">
              {recentActivities.slice(0, 5).map((activity) => (
                <div 
                  key={activity.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 px-1 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Timestamp */}
                    <span className="font-mono text-slate-600 text-[11px] shrink-0 font-medium">
                      {activity.timestamp}
                    </span>

                    {/* Sender & Type */}
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-900 truncate">
                        {activity.senderName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700">
                        {getMediaIcon(activity.mediaType)}
                        {activity.mediaType}
                      </span>
                      {activity.commandUsed && (
                        <span className="hidden sm:inline font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                          {activity.commandUsed}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge & metrics */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {activity.processingTimeMs !== undefined && activity.processingTimeMs > 0 && (
                      <span className="hidden sm:inline font-mono text-[10px] text-slate-600">
                        {activity.processingTimeMs}ms
                      </span>
                    )}
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Access Card + Quick Settings + Engine Info */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* ACCESS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Access Mode
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-extrabold text-slate-900 capitalize">
                  {accessMode.replace('_', ' ')}
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {allowedCount} allowed
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {accessMode === 'whitelist' && 'Only approved contacts in your list can generate stickers.'}
                {accessMode === 'only_me' && 'Strict personal mode: Only your WhatsApp number is allowed.'}
                {accessMode === 'everyone' && 'Public mode: Anyone who messages your bot can make stickers.'}
              </p>
            </div>

            <button
              onClick={() => onNavigate('access')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 transition-colors"
            >
              <span>Manage access whitelist</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* QUICK SETTINGS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quick Settings</h3>
                <p className="text-xs text-slate-600">Toggle media conversion rules</p>
              </div>
              <button 
                onClick={() => onNavigate('settings')}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="All settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Images */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Images</span>
                  <span className="text-[11px] text-slate-600 leading-snug block">
                    Automatically convert incoming photos to stickers.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={quickSettings.images}
                  onClick={() => onToggleSetting('images')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    quickSettings.images ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      quickSettings.images ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Videos */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Videos</span>
                  <span className="text-[11px] text-slate-600 leading-snug block">
                    Convert MP4 clips (up to 10s) into animated WebP.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={quickSettings.videos}
                  onClick={() => onToggleSetting('videos')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    quickSettings.videos ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      quickSettings.videos ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* GIFs */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">GIFs</span>
                  <span className="text-[11px] text-slate-600 leading-snug block">
                    Convert animated GIF loops automatically.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={quickSettings.gifs}
                  onClick={() => onToggleSetting('gifs')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    quickSettings.gifs ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      quickSettings.gifs ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Commands */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Commands</span>
                  <span className="text-[11px] text-slate-600 leading-snug block">
                    Support prefix triggers (!s, !sticker, !crop).
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={quickSettings.commands}
                  onClick={() => onToggleSetting('commands')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    quickSettings.commands ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      quickSettings.commands ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ENGINE QUICK BADGE */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Stack Telemetry</span>
              <span className="text-emerald-700">Healthy</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Engine: <span className="font-mono text-slate-800">{systemInfo.engine.split(' ')[0]}</span></div>
              <div>Image: <span className="font-mono text-slate-800">Sharp</span></div>
              <div>Video: <span className="font-mono text-slate-800">FFmpeg</span></div>
              <div>Memory: <span className="font-mono text-slate-800">{systemInfo.memoryUsage}</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
