import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Sparkles,
  RefreshCw,
  Search,
  TrendingUp,
  Award,
} from 'lucide-react';
import { UserRankEntry } from '../types';
import { rankingApi, RankingPeriod } from '../api/ranking';

interface RankingViewProps {
  onShowToast?: (msg: string) => void;
}

const levelsLegend = [
  { badge: '🌱', title: 'Iniciante',         range: '1–15' },
  { badge: '📦', title: 'Colecionador',       range: '16–50' },
  { badge: '🎨', title: 'Viciado em Sticker', range: '51–120' },
  { badge: '🏭', title: 'Fábrica de Memes',   range: '121–250' },
  { badge: '⚡', title: 'Mestre dos Stickers', range: '251–500' },
  { badge: '👑', title: 'Lenda do WhatsApp',   range: '500+' },
];

/* ─── Podium Pedestal ──────────────────────────────── */
interface PedestalProps {
  entry: UserRankEntry | undefined;
  position: 1 | 2 | 3;
  size?: 'lg' | 'md' | 'sm';
}

const positionConfig = {
  1: {
    glow: 'rgba(245,158,11,0.35)',
    ring: 'rgba(245,158,11,0.60)',
    avatarBg: 'linear-gradient(135deg, #F59E0B, #FBBF24, #D97706)',
    textColor: '#F59E0B',
    pedestalH: 'h-32 sm:h-36',
    pedestalBg: 'linear-gradient(to top, rgba(120,53,15,0.60), rgba(180,83,9,0.40), rgba(245,158,11,0.25))',
    pedestalBorder: 'rgba(245,158,11,0.40)',
    emoji: '🥇',
    label: '1º',
    avatarSize: 'w-20 h-20 sm:w-24 sm:h-24',
    innerTextColor: '#F59E0B',
    countColor: 'var(--accent-emerald)',
    countBg: 'rgba(16,185,129,0.12)',
    countBorder: 'rgba(16,185,129,0.25)',
  },
  2: {
    glow: 'rgba(148,163,184,0.25)',
    ring: 'rgba(148,163,184,0.50)',
    avatarBg: 'linear-gradient(135deg, #64748B, #94A3B8, #CBD5E1)',
    textColor: '#94A3B8',
    pedestalH: 'h-24 sm:h-28',
    pedestalBg: 'linear-gradient(to top, rgba(30,41,59,0.70), rgba(71,85,105,0.50))',
    pedestalBorder: 'rgba(148,163,184,0.30)',
    emoji: '🥈',
    label: '2º',
    avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
    innerTextColor: '#94A3B8',
    countColor: '#94A3B8',
    countBg: 'rgba(148,163,184,0.10)',
    countBorder: 'rgba(148,163,184,0.20)',
  },
  3: {
    glow: 'rgba(180,83,9,0.22)',
    ring: 'rgba(180,83,9,0.45)',
    avatarBg: 'linear-gradient(135deg, #92400E, #B45309, #D97706)',
    textColor: '#D97706',
    pedestalH: 'h-20 sm:h-24',
    pedestalBg: 'linear-gradient(to top, rgba(30,20,5,0.70), rgba(120,53,15,0.45))',
    pedestalBorder: 'rgba(180,83,9,0.30)',
    emoji: '🥉',
    label: '3º',
    avatarSize: 'w-14 h-14 sm:w-18 sm:h-18',
    innerTextColor: '#D97706',
    countColor: '#D97706',
    countBg: 'rgba(180,83,9,0.12)',
    countBorder: 'rgba(180,83,9,0.22)',
  },
};

const Pedestal: React.FC<PedestalProps> = ({ entry, position }) => {
  const cfg = positionConfig[position];
  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-end text-center opacity-20">
        <div
          className={`w-full ${cfg.pedestalH} rounded-t-xl flex items-center justify-center`}
          style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--border-hairline)' }}
        >
          <span className="text-2xl font-black" style={{ color: 'rgba(255,255,255,0.15)' }}>
            #{position}
          </span>
        </div>
      </div>
    );
  }

  const initials = entry.handle.replace('@', '').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center text-center">
      {/* Crown for 1st */}
      {position === 1 && (
        <Crown
          className="w-7 h-7 mb-1"
          style={{
            color: '#F59E0B',
            filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.70))',
          }}
        />
      )}

      {/* Avatar ring */}
      <div
        className="relative mb-3"
        style={{
          filter: `drop-shadow(0 0 12px ${cfg.glow})`,
        }}
      >
        <div
          className={`${cfg.avatarSize} rounded-full p-0.5 flex items-center justify-center`}
          style={{ background: cfg.avatarBg }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center font-black text-lg"
            style={{
              background: '#09090B',
              color: cfg.innerTextColor,
            }}
          >
            {initials}
          </div>
        </div>

        {/* Position badge */}
        <span
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[11px] font-black"
          style={{
            background: cfg.avatarBg,
            color: '#09090B',
            boxShadow: `0 0 8px ${cfg.glow}`,
          }}
        >
          {cfg.emoji} {cfg.label}
        </span>
      </div>

      {/* Handle */}
      <h3
        className="font-extrabold text-sm mt-3 truncate max-w-[100px] sm:max-w-[140px]"
        style={{ color: cfg.textColor }}
      >
        {entry.handle}
      </h3>
      <span className="text-[11px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
        {entry.levelBadge} {entry.levelTitle}
      </span>

      {/* Count */}
      <div
        className="mt-2 text-sm font-black px-3 py-1 rounded-xl tabular-nums"
        style={{
          color: cfg.countColor,
          background: cfg.countBg,
          border: `1px solid ${cfg.countBorder}`,
        }}
      >
        {entry.count} figs
      </div>

      {/* Pedestal block */}
      <div
        className={`w-full ${cfg.pedestalH} rounded-t-xl mt-4 flex items-center justify-center`}
        style={{
          background: cfg.pedestalBg,
          borderTop: `2px solid ${cfg.pedestalBorder}`,
        }}
      >
        <span className="text-2xl sm:text-3xl font-black" style={{ color: `${cfg.textColor}30` }}>
          #{position}
        </span>
      </div>
    </div>
  );
};

/* ─── Main View ──────────────────────────────────────── */
export const RankingView: React.FC<RankingViewProps> = ({ onShowToast }) => {
  const [period, setPeriod] = useState<RankingPeriod>('allTime');
  const [ranking, setRanking] = useState<UserRankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRanking = async (p: RankingPeriod) => {
    setLoading(true);
    try {
      const data = await rankingApi.getRanking(p, 50);
      setRanking(data);
    } catch (err: any) {
      if (onShowToast) onShowToast(`❌ Erro ao carregar ranking: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRanking(period); }, [period]);

  const periods: { id: RankingPeriod; label: string }[] = [
    { id: 'today',   label: 'Hoje' },
    { id: '7days',   label: '7 Dias' },
    { id: '30days',  label: '30 Dias' },
    { id: 'allTime', label: 'Todos os Tempos' },
  ];

  const filteredRanking = useMemo(() => {
    if (!searchQuery.trim()) return ranking;
    const q = searchQuery.toLowerCase();
    return ranking.filter(
      (u) => u.handle.toLowerCase().includes(q) || u.levelTitle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [ranking, searchQuery]);

  const top1 = ranking[0];
  const top2 = ranking[1];
  const top3 = ranking[2];

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-hairline)',
    boxShadow: 'var(--specular)',
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-5xl mx-auto">

      {/* ── Header & Period Controls ────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl p-5" style={cardStyle}>
        <div>
          <div
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--accent-gold)' }}
          >
            <Trophy className="w-4 h-4" />
            <span>Gamificação & Conquistas</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
            🏆 Hall da Fama dos Criadores
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            Descubra quem são as maiores fábricas de stickers do WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period pill group */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-hairline)' }}
          >
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  period === p.id
                    ? {
                        background: 'rgba(16,185,129,0.14)',
                        border: '1px solid rgba(16,185,129,0.22)',
                        color: 'var(--accent-emerald)',
                      }
                    : {
                        color: 'var(--ink-muted)',
                        border: '1px solid transparent',
                      }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchRanking(period)}
            disabled={loading}
            className="p-2 rounded-xl transition-all disabled:opacity-40"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--ink-secondary)',
            }}
            title="Atualizar ranking"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: loading ? 'var(--accent-emerald)' : undefined }} />
          </button>
        </div>
      </div>

      {/* ── Podium Section ──────────────────────────────── */}
      {ranking.length > 0 ? (
        <div
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0D1117 0%, #0A0C10 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Ambient glows */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245,158,11,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 25% 80%, rgba(148,163,184,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 75% 80%, rgba(180,83,9,0.06) 0%, transparent 60%)',
            }}
          />

          {/* Title badge */}
          <div className="relative text-center mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.22)',
                color: '#FBBF24',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Pódio dos Campeões
            </span>
          </div>

          {/* Three pedestals — order: 2nd | 1st | 3rd */}
          <div className="relative grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto">
            <Pedestal entry={top2} position={2} />
            <Pedestal entry={top1} position={1} />
            <Pedestal entry={top3} position={3} />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl p-12 text-center" style={cardStyle}>
          <Trophy className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--ink-disabled)' }} />
          <h3 className="text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
            Nenhum sticker registrado ainda
          </h3>
          <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--ink-muted)' }}>
            Envie fotos, vídeos ou crie memes no WhatsApp para inaugurar o pódio!
          </p>
        </div>
      )}

      {/* ── Level Legend ────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
              Patentes e Requisitos
            </h2>
          </div>
          <span className="text-xs" style={{ color: 'var(--ink-disabled)' }}>
            Evolução de Criador
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {levelsLegend.map((lvl) => (
            <div
              key={lvl.title}
              className="flex flex-col items-center text-center p-3 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <span className="text-2xl mb-1">{lvl.badge}</span>
              <span className="text-[11px] font-bold leading-tight" style={{ color: 'var(--ink-secondary)' }}>
                {lvl.title}
              </span>
              <span className="text-[10px] font-semibold mt-1" style={{ color: 'var(--accent-emerald)' }}>
                {lvl.range} figs
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leaderboard Table ───────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {/* Table header */}
        <div
          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderBottom: '1px solid var(--border-hairline)' }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
              Classificação Geral
            </h2>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--ink-secondary)',
              }}
            >
              {filteredRanking.length} criadores
            </span>
          </div>

          <div className="relative w-full sm:w-56">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-disabled)' }}
            />
            <input
              type="text"
              placeholder="Buscar @handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl transition-all outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--ink-primary)',
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  color: 'var(--ink-disabled)',
                  borderBottom: '1px solid var(--border-hairline)',
                }}
              >
                <th className="py-3 px-4 w-16 text-center">Pos.</th>
                <th className="py-3 px-4">Criador</th>
                <th className="py-3 px-4 hidden sm:table-cell">Patente</th>
                <th className="py-3 px-4 text-right">Figurinhas</th>
              </tr>
            </thead>
            <tbody>
              {filteredRanking.map((user, idx) => {
                const isTop1 = user.rank === 1;
                const isTop2 = user.rank === 2;
                const isTop3 = user.rank === 3;
                const isEven = idx % 2 === 0;

                const rankBadge = isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : null;

                return (
                  <tr
                    key={user.handle + user.rank}
                    className="transition-colors"
                    style={{
                      background: isEven ? 'rgba(255,255,255,0.015)' : 'transparent',
                      borderBottom: '1px solid var(--border-hairline)',
                    }}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      {rankBadge ? (
                        <span className="text-base">{rankBadge}</span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold tabular-nums"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--ink-muted)',
                          }}
                        >
                          {user.rank}
                        </span>
                      )}
                    </td>

                    {/* Creator */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0"
                          style={{
                            background: isTop1
                              ? 'rgba(245,158,11,0.15)'
                              : isTop2
                              ? 'rgba(148,163,184,0.12)'
                              : isTop3
                              ? 'rgba(180,83,9,0.12)'
                              : 'rgba(255,255,255,0.06)',
                            color: isTop1
                              ? '#F59E0B'
                              : isTop2
                              ? '#94A3B8'
                              : isTop3
                              ? '#D97706'
                              : 'var(--ink-secondary)',
                            border: '1px solid var(--border-hairline)',
                          }}
                        >
                          {user.handle.replace('@', '').slice(0, 2)}
                        </div>
                        <div>
                          <span className="text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>
                            {user.handle}
                            {isTop1 && (
                              <Crown
                                className="w-3 h-3 inline ml-1 fill-current"
                                style={{ color: '#F59E0B', verticalAlign: 'middle' }}
                              />
                            )}
                          </span>
                          <span className="block text-[10px]" style={{ color: 'var(--ink-disabled)' }}>
                            WhatsApp Creator
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: 'var(--accent-emerald-dim)',
                          border: '1px solid rgba(16,185,129,0.20)',
                          color: 'var(--accent-emerald)',
                        }}
                      >
                        <span>{user.levelBadge}</span>
                        <span>{user.levelTitle}</span>
                      </span>
                    </td>

                    {/* Count */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className="font-mono font-black text-sm tabular-nums"
                        style={{
                          color: isTop1 ? '#F59E0B' : isTop2 ? '#94A3B8' : isTop3 ? '#D97706' : 'var(--ink-primary)',
                        }}
                      >
                        {user.count.toLocaleString()}
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--ink-disabled)' }}>
                        figs
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredRanking.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-xs" style={{ color: 'var(--ink-disabled)' }}>
                    {searchQuery ? 'Nenhum criador encontrado.' : 'Nenhum sticker neste período.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
