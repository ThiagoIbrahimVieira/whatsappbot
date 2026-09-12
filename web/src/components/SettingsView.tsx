import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Cpu, 
  Shield, 
  Power, 
  Save, 
  Terminal, 
  CheckCircle2, 
  Info,
  Server,
  Code2,
  Image as ImageIcon
} from 'lucide-react';
import { BotStatus, QuickSettings, SystemInfo } from '../types';

interface SettingsViewProps {
  botStatus: BotStatus;
  onToggleBotStatus: () => void;
  quickSettings: QuickSettings;
  onUpdateSettings: (updates: Partial<QuickSettings>) => void;
  systemInfo: SystemInfo;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  botStatus,
  onToggleBotStatus,
  quickSettings,
  onUpdateSettings,
  systemInfo,
  onShowToast,
}) => {
  const isBotActive = botStatus === 'active';

  return (
    <div id="settings-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Configure bot automation rules, sticker metadata, and monitor system libraries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Bot & Automation Rules */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: BOT STATUS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Power className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bot Execution State</h3>
                  <p className="text-xs text-slate-600">Global kill switch for all inbound message listeners</p>
                </div>
              </div>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isBotActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isBotActive ? '● Active' : '● Paused'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Master Switch
                </span>
                <span className="text-xs text-slate-600 block">
                  When paused, the bot ignores all incoming media and commands without disconnecting from WhatsApp.
                </span>
              </div>

              <button
                onClick={() => {
                  onToggleBotStatus();
                  onShowToast(isBotActive ? 'Bot paused' : 'Bot activated');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isBotActive ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isBotActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 2: AUTOMATION & MEDIA RULES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Automation Media Pipeline</h3>
                <p className="text-xs text-slate-600">Select formats automatically converted to WebP stickers</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 space-y-3">
              {/* Images */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Images (JPEG, PNG, WebP)</span>
                  <span className="text-xs text-slate-600 block">
                    Converts photos directly into 512x512 WebP sticker format.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quickSettings.images}
                  onChange={(e) => {
                    onUpdateSettings({ images: e.target.checked });
                    onShowToast(`Image conversion ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Videos */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Videos (MP4, 3GP)</span>
                  <span className="text-xs text-slate-600 block">
                    Converts video clips into animated stickers using FFmpeg libwebp (max 10s).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quickSettings.videos}
                  onChange={(e) => {
                    onUpdateSettings({ videos: e.target.checked });
                    onShowToast(`Video conversion ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* GIFs */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">GIF Animations</span>
                  <span className="text-xs text-slate-600 block">
                    Extracts frames and encodes looping WebP sticker format.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quickSettings.gifs}
                  onChange={(e) => {
                    onUpdateSettings({ gifs: e.target.checked });
                    onShowToast(`GIF conversion ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Commands */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Command Triggers</span>
                  <span className="text-xs text-slate-600 block">
                    Listen to caption triggers like <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">!s</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">!sticker</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">!crop</code>.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={quickSettings.commands}
                  onChange={(e) => {
                    onUpdateSettings({ commands: e.target.checked });
                    onShowToast(`Command triggers ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: STICKER METADATA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sticker Metadata & Exif</h3>
                <p className="text-xs text-slate-600">The author and pack name stamped into generated stickers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Pack Name
                </label>
                <input
                  type="text"
                  value={quickSettings.packName}
                  onChange={(e) => onUpdateSettings({ packName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="e.g. My Sticker Pack"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Author / Publisher
                </label>
                <input
                  type="text"
                  value={quickSettings.authorName}
                  onChange={(e) => onUpdateSettings({ authorName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="e.g. Created with TT"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): System Information (Prompt Item 24) */}
        <div className="lg:col-span-4 space-y-6">
          {/* SYSTEM INFORMATION CARD (MANDATORY FROM PROMPT ITEM 24) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Server className="w-4 h-4 text-slate-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">System Information</h3>
                <p className="text-[11px] text-slate-600">Underlying bot engine & runtime</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">WhatsApp Gateway</span>
                <span className="font-semibold text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {systemInfo.whatsappStatus}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Runtime</span>
                <span className="font-mono font-medium text-slate-900">
                  {systemInfo.runtime}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Engine</span>
                <span className="font-mono font-medium text-slate-900">
                  {systemInfo.engine}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Image Library</span>
                <span className="font-mono font-medium text-slate-900">
                  {systemInfo.imageLibrary}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Video Library</span>
                <span className="font-mono font-medium text-slate-900">
                  {systemInfo.videoLibrary}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Version</span>
                <span className="font-mono font-semibold text-slate-900">
                  {systemInfo.version}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Memory Allocation</span>
                <span className="font-mono text-slate-700">
                  {systemInfo.memoryUsage}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Heartbeat Ping</span>
                <span className="font-mono text-slate-700">
                  {systemInfo.lastPing}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Safe Storage Note */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Zero Retention Policy</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              All incoming photos, videos, and converted stickers are processed strictly in RAM and ephemeral cache. Temporary files are wiped immediately after the sticker is dispatched back to WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
