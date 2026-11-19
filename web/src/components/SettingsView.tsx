import React from 'react';
import {
  Sparkles,
  Shield,
  Power,
  Server,
  Image as ImageIcon,
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

/* ─── Reusable Pill Switch ─────────────────────────────────── */
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

export const SettingsView: React.FC<SettingsViewProps> = ({
  botStatus,
  onToggleBotStatus,
  quickSettings,
  onUpdateSettings,
  systemInfo,
  onShowToast,
}) => {
  const isBotActive = botStatus === 'active';

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-hairline)',
    boxShadow: 'var(--specular)',
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-hairline)',
    color: 'var(--ink-primary)',
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
          Configurações
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          Configure regras de automação do bot, metadados de figurinhas e monitore as bibliotecas do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Bot & Automation Rules */}
        <div className="lg:col-span-8 space-y-6">

          {/* SECTION 1: BOT STATUS */}
          <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ink-secondary)' }}
                >
                  <Power className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                    Estado de Execução do Bot
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Interruptor global para todos os ouvintes de mensagens recebidas
                  </p>
                </div>
              </div>

              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: isBotActive ? 'var(--accent-emerald-dim)' : 'var(--accent-gold-dim)',
                  color: isBotActive ? 'var(--accent-emerald)' : 'var(--accent-gold)',
                  border: `1px solid ${isBotActive ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                }}
              >
                {isBotActive ? '● Ativo' : '● Pausado'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block" style={{ color: 'var(--ink-primary)' }}>
                  Interruptor Mestre
                </span>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                  Quando pausado, o bot ignora todas as mídias e comandos sem desconectar do WhatsApp.
                </span>
              </div>

              <Switch
                checked={isBotActive}
                onChange={() => {
                  onToggleBotStatus();
                  onShowToast(isBotActive ? 'Bot pausado' : 'Bot ativado');
                }}
                label="Master Bot State"
              />
            </div>
          </div>

          {/* SECTION 2: AUTOMATION & MEDIA RULES */}
          <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
            <div
              className="flex items-center gap-2.5 pb-3"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                  Pipeline de Mídia Automatizado
                </h3>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Selecione os formatos que são convertidos automaticamente para stickers WebP
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'images' as const,
                  title: 'Imagens (JPEG, PNG, WebP)',
                  desc: 'Converte fotos diretamente para formato WebP 512×512 sem reencode duplo.',
                },
                {
                  key: 'videos' as const,
                  title: 'Vídeos (MP4, 3GP)',
                  desc: 'Converte clipes de vídeo em stickers animados usando FFmpeg libwebp (máx. 10s).',
                },
                {
                  key: 'gifs' as const,
                  title: 'Animações GIF',
                  desc: 'Extrai quadros e codifica loops em formato de sticker WebP animado.',
                },
                {
                  key: 'commands' as const,
                  title: 'Gatilhos de Comando',
                  desc: 'Ouve prefixos na legenda como !s, !sticker e !crop.',
                },
              ].map(({ key, title, desc }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold block" style={{ color: 'var(--ink-primary)' }}>
                      {title}
                    </span>
                    <span className="text-xs block mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      {desc}
                    </span>
                  </div>
                  <Switch
                    checked={quickSettings[key] as boolean}
                    onChange={() => {
                      const next = !quickSettings[key];
                      onUpdateSettings({ [key]: next });
                      onShowToast(`${title.split(' ')[0]} ${next ? 'habilitado' : 'desabilitado'}`);
                    }}
                    label={title}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: STICKER METADATA */}
          <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
            <div
              className="flex items-center gap-2.5 pb-3"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ink-secondary)' }}
              >
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                  Metadados e EXIF da Figurinha
                </h3>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Autor e nome do pacote gravados nos metadados WebP gerados
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-secondary)' }}>
                  Nome do Pacote (Pack Name)
                </label>
                <input
                  type="text"
                  value={quickSettings.packName}
                  onChange={(e) => onUpdateSettings({ packName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl outline-none"
                  style={inputStyle}
                  placeholder="ex: Thiago Ibrahim"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-secondary)' }}>
                  Autor / Publicador (Author Name)
                </label>
                <input
                  type="text"
                  value={quickSettings.authorName}
                  onChange={(e) => onUpdateSettings({ authorName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl outline-none"
                  style={inputStyle}
                  placeholder="ex: @t.ibrhx_"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: MONETIZAÇÃO & PLANO VIP */}
          <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ background: 'var(--accent-gold-dim)', color: 'var(--accent-gold)' }}
                >
                  💎
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                    Monetização & Limite Grátis (Freemium)
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Regras de cobrança, cota diária gratuita e recebimento via Pix
                  </p>
                </div>
              </div>

              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: quickSettings.freemiumEnabled !== false ? 'var(--accent-emerald-dim)' : 'rgba(255,255,255,0.06)',
                  color: quickSettings.freemiumEnabled !== false ? 'var(--accent-emerald)' : 'var(--ink-disabled)',
                  border: `1px solid ${quickSettings.freemiumEnabled !== false ? 'rgba(16,185,129,0.25)' : 'var(--border-hairline)'}`,
                }}
              >
                {quickSettings.freemiumEnabled !== false ? '● Ativo' : '○ Desativado'}
              </span>
            </div>

            {/* Toggle Freemium */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-xs font-semibold block" style={{ color: 'var(--ink-primary)' }}>
                  Ativar Cota Diária Gratuita
                </span>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                  Quando ativo, usuários fora da Whitelist recebem limite de figurinhas grátis por dia. Ao esgotar, recebem oferta do VIP no WhatsApp.
                </span>
              </div>

              <Switch
                checked={quickSettings.freemiumEnabled !== false}
                onChange={() => {
                  const newVal = quickSettings.freemiumEnabled === false;
                  onUpdateSettings({ freemiumEnabled: newVal });
                  onShowToast(newVal ? 'Modo Freemium ativado' : 'Modo Freemium desativado');
                }}
                label="Freemium Toggle"
              />
            </div>

            {/* Config inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-secondary)' }}>
                  Figurinhas Grátis / Dia
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quickSettings.dailyFreeLimit ?? 5}
                  onChange={(e) => onUpdateSettings({ dailyFreeLimit: Number(e.target.value) || 5 })}
                  className="w-full px-3 py-2 text-xs rounded-xl outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-secondary)' }}>
                  Valor da Assinatura VIP
                </label>
                <input
                  type="text"
                  value={quickSettings.vipPriceText ?? 'R$ 5,00/mês'}
                  onChange={(e) => onUpdateSettings({ vipPriceText: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl outline-none"
                  style={inputStyle}
                  placeholder="ex: R$ 5,00/mês"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-secondary)' }}>
                  Chave Pix para Recebimento
                </label>
                <input
                  type="text"
                  value={quickSettings.pixKey ?? '11919498217'}
                  onChange={(e) => onUpdateSettings({ pixKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl outline-none"
                  style={inputStyle}
                  placeholder="ex: celular ou CPF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): System Information */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
            <div
              className="flex items-center gap-2 pb-3"
              style={{ borderBottom: '1px solid var(--border-hairline)' }}
            >
              <Server className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                  Informações do Sistema
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  Motor de execução e ambiente
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Gateway WhatsApp', value: systemInfo.whatsappStatus, isStatus: true },
                { label: 'Runtime',          value: systemInfo.runtime,        mono: true },
                { label: 'Engine',           value: systemInfo.engine,         mono: true },
                { label: 'Biblioteca Imagem', value: systemInfo.imageLibrary,   mono: true },
                { label: 'Biblioteca Vídeo',  value: systemInfo.videoLibrary,   mono: true },
                { label: 'Versão',           value: systemInfo.version,        mono: true },
                { label: 'Memória Alocada',   value: systemInfo.memoryUsage,    mono: true },
                { label: 'Último Ping',       value: systemInfo.lastPing,       mono: true },
              ].map(({ label, value, mono, isStatus }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1"
                  style={{ borderBottom: '1px solid var(--border-hairline)' }}
                >
                  <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
                  {isStatus ? (
                    <span
                      className="font-semibold flex items-center gap-1.5"
                      style={{ color: value === 'Connected' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {value}
                    </span>
                  ) : (
                    <span
                      className={mono ? 'font-mono' : ''}
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Safe Storage Note */}
          <div
            className="rounded-2xl p-4 text-xs space-y-2"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--accent-emerald)' }}>
              <Shield className="w-3.5 h-3.5" />
              <span>Política de Zero Retenção</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Todas as fotos, vídeos e stickers convertidos são processados estritamente na memória RAM e em cache efêmero. Arquivos temporários são excluídos imediatamente após o envio de volta ao WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
