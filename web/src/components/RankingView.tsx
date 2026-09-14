import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Sparkles, 
  Flame, 
  RefreshCw, 
  Search, 
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import { UserRankEntry } from '../types';
import { rankingApi, RankingPeriod } from '../api/ranking';

interface RankingViewProps {
  onShowToast?: (msg: string) => void;
}

export const RankingView: React.FC<RankingViewProps> = ({ onShowToast }) => {
  const [period, setPeriod] = useState<RankingPeriod>('allTime');
  const [ranking, setRanking] = useState<UserRankEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRanking = async (selectedPeriod: RankingPeriod) => {
    setLoading(true);
    try {
      const data = await rankingApi.getRanking(selectedPeriod, 50);
      setRanking(data);
    } catch (err: any) {
      if (onShowToast) onShowToast(`❌ Erro ao carregar ranking: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking(period);
  }, [period]);

  const periods: { id: RankingPeriod; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: '7days', label: '7 Dias' },
    { id: '30days', label: '30 Dias' },
    { id: 'allTime', label: 'Todos os Tempos' },
  ];

  const levelsLegend = [
    { badge: '🌱', title: 'Iniciante', range: '1-15' },
    { badge: '📦', title: 'Colecionador', range: '16-50' },
    { badge: '🎨', title: 'Viciado em Sticker', range: '51-120' },
    { badge: '🏭', title: 'Fábrica de Memes', range: '121-250' },
    { badge: '⚡', title: 'Mestre dos Stickers', range: '251-500' },
    { badge: '👑', title: 'Lenda do WhatsApp', range: '500+' },
  ];

  const filteredRanking = useMemo(() => {
    if (!searchQuery.trim()) return ranking;
    const q = searchQuery.toLowerCase();
    return ranking.filter(
      (u) =>
        u.handle.toLowerCase().includes(q) ||
        u.levelTitle.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );
  }, [ranking, searchQuery]);

  const top1 = ranking[0];
  const top2 = ranking[1];
  const top3 = ranking[2];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Gamificação & Conquistas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            🏆 Hall da Fama dos Criadores
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Descubra quem são as maiores fábricas de stickers do WhatsApp.
          </p>
        </div>

        {/* Period Pills & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchRanking(period)}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-50"
            title="Atualizar ranking"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Podium Section (Top 3) */}
      {ranking.length > 0 ? (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 left-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Pódio dos Campeões
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-6 pb-2">
            {/* 2nd Place (Silver) */}
            <div className="flex flex-col items-center text-center order-1">
              {top2 ? (
                <>
                  <div className="relative mb-2 group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-1 shadow-lg flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xl font-bold text-slate-200">
                        {top2.handle.slice(1, 3).toUpperCase()}
                      </div>
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-400 text-slate-950 text-[11px] font-black shadow-md flex items-center gap-0.5">
                      🥈 2º
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100 truncate max-w-[90px] sm:max-w-[130px] mt-2">
                    {top2.handle}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {top2.levelBadge} {top2.levelTitle}
                  </span>
                  <div className="mt-2 text-xs sm:text-sm font-extrabold text-amber-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {top2.count} figs
                  </div>
                  <div className="w-full bg-gradient-to-t from-slate-800 to-slate-700/80 h-24 sm:h-28 rounded-t-2xl mt-4 flex items-center justify-center border-t border-slate-600/50">
                    <span className="text-2xl sm:text-3xl font-black text-slate-400/50">#2</span>
                  </div>
                </>
              ) : (
                <div className="opacity-30 text-xs py-8">Vago</div>
              )}
            </div>

            {/* 1st Place (Gold / Champion) */}
            <div className="flex flex-col items-center text-center order-2 -mt-4">
              {top1 ? (
                <>
                  <div className="relative mb-2">
                    <Crown className="w-8 h-8 text-amber-400 animate-bounce mx-auto -mb-1 filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)]" />
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 p-1 shadow-2xl flex items-center justify-center ring-4 ring-amber-400/30">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-2xl font-black text-amber-300">
                        {top1.handle.slice(1, 3).toUpperCase()}
                      </div>
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black shadow-lg flex items-center gap-0.5">
                      🥇 1º
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white truncate max-w-[110px] sm:max-w-[160px] mt-2">
                    {top1.handle}
                  </h3>
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 justify-center">
                    {top1.levelBadge} {top1.levelTitle}
                  </span>
                  <div className="mt-2 text-sm sm:text-base font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                    {top1.count} figs
                  </div>
                  <div className="w-full bg-gradient-to-t from-amber-950/60 via-amber-900/40 to-amber-700/60 h-32 sm:h-36 rounded-t-2xl mt-4 flex items-center justify-center border-t-2 border-amber-400/50 shadow-inner">
                    <span className="text-3xl sm:text-4xl font-black text-amber-300/60">#1</span>
                  </div>
                </>
              ) : (
                <div className="opacity-30 text-xs py-8">Vago</div>
              )}
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex flex-col items-center text-center order-3">
              {top3 ? (
                <>
                  <div className="relative mb-2 group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-800 to-amber-600 p-1 shadow-lg flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xl font-bold text-amber-200">
                        {top3.handle.slice(1, 3).toUpperCase()}
                      </div>
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 text-[11px] font-black shadow-md flex items-center gap-0.5">
                      🥉 3º
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100 truncate max-w-[90px] sm:max-w-[130px] mt-2">
                    {top3.handle}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {top3.levelBadge} {top3.levelTitle}
                  </span>
                  <div className="mt-2 text-xs sm:text-sm font-extrabold text-amber-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {top3.count} figs
                  </div>
                  <div className="w-full bg-gradient-to-t from-slate-800 to-slate-700/80 h-20 sm:h-24 rounded-t-2xl mt-4 flex items-center justify-center border-t border-slate-600/50">
                    <span className="text-2xl sm:text-3xl font-black text-amber-700/50">#3</span>
                  </div>
                </>
              ) : (
                <div className="opacity-30 text-xs py-8">Vago</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum sticker registrado ainda</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Envie fotos, vídeos ou crie memes pelo WhatsApp para inaugurar o pódio e garantir o primeiro lugar!
          </p>
        </div>
      )}

      {/* Levels & Badges Legend */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">Patentes e Requisitos</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Evolução de Criador</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {levelsLegend.map((lvl) => (
            <div
              key={lvl.title}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
            >
              <span className="text-2xl mb-1">{lvl.badge}</span>
              <span className="font-bold text-xs text-slate-800 tracking-tight">{lvl.title}</span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1">
                {lvl.range} figs
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">Classificação Geral</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredRanking.length} criadores
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por @handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">Posição</th>
                <th className="py-3.5 px-4">Criador</th>
                <th className="py-3.5 px-4">Patente / Conquista</th>
                <th className="py-3.5 px-4 text-right">Figurinhas Criadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRanking.map((user) => {
                const isTop1 = user.rank === 1;
                const isTop2 = user.rank === 2;
                const isTop3 = user.rank === 3;

                return (
                  <tr
                    key={user.handle + user.rank}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-extrabold text-xs shadow-xs">
                          🥇
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs shadow-xs">
                          🥈
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-200/60 text-amber-900 font-extrabold text-xs shadow-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                          {user.rank}º
                        </span>
                      )}
                    </td>

                    {/* Creator Handle (NEVER expose phone) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                          {user.handle.slice(1, 3)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                            {user.handle}
                            {isTop1 && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            WhatsApp Creator
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Level Title & Badge */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100/80 text-emerald-800 text-xs font-semibold">
                        <span>{user.levelBadge}</span>
                        <span>{user.levelTitle}</span>
                      </span>
                    </td>

                    {/* Count */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {user.count.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">figs</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRanking.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    {searchQuery
                      ? 'Nenhum criador encontrado com essa busca.'
                      : 'Nenhum sticker criado neste período.'}
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
