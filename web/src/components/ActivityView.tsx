import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileImage,
  Video,
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { ActivityItem, ActivityStatus, MediaType } from '../types';

interface ActivityViewProps {
  activities: ActivityItem[];
  onOpenSimulateModal?: () => void;
  onClearActivities?: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  onOpenSimulateModal,
  onClearActivities,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Processed' | 'Ignored' | 'Failed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'All', label: 'Todos os Eventos' },
    { id: 'Processed', label: 'Processados' },
    { id: 'Ignored', label: 'Ignorados / Bloqueados' },
    { id: 'Failed', label: 'Falhos' },
  ] as const;

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedFilter === 'Processed' && act.status !== 'Processed') return false;
      if (selectedFilter === 'Ignored' && act.status !== 'Unauthorized') return false;
      if (selectedFilter === 'Failed' && act.status !== 'Failed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = act.senderName.toLowerCase().includes(q);
        const matchesPhone = act.senderPhone.includes(q);
        const matchesType = act.mediaType.toLowerCase().includes(q);
        const matchesCommand = act.commandUsed?.toLowerCase().includes(q) || false;
        return matchesName || matchesPhone || matchesType || matchesCommand;
      }

      return true;
    });
  }, [activities, selectedFilter, searchQuery]);

  const getMediaBadge = (type: MediaType) => {
    switch (type) {
      case 'IMAGE':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
            style={{
              background: 'var(--accent-blue-dim)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(96,165,250,0.22)',
            }}
          >
            <FileImage className="w-3 h-3" />
            IMAGE
          </span>
        );
      case 'VIDEO':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
            style={{
              background: 'rgba(167,139,250,0.14)',
              color: '#A78BFA',
              border: '1px solid rgba(167,139,250,0.22)',
            }}
          >
            <Video className="w-3 h-3" />
            VIDEO
          </span>
        );
      case 'GIF':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
            style={{
              background: 'var(--accent-gold-dim)',
              color: 'var(--accent-gold)',
              border: '1px solid rgba(245,158,11,0.22)',
            }}
          >
            <Film className="w-3 h-3" />
            GIF
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ink-secondary)' }}
          >
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'Processed':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'var(--accent-emerald-dim)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <CheckCircle2 className="w-3 h-3" />
            Processado
          </span>
        );
      case 'Unauthorized':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'var(--accent-gold-dim)',
              color: 'var(--accent-gold)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <ShieldAlert className="w-3 h-3" />
            Não autorizado
          </span>
        );
      case 'Failed':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'var(--accent-rose-dim)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(244,63,94,0.25)',
            }}
          >
            <AlertCircle className="w-3 h-3" />
            Falhou
          </span>
        );
      case 'Queued':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--ink-secondary)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <Clock className="w-3 h-3" />
            Na fila
          </span>
        );
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-hairline)',
    boxShadow: 'var(--specular)',
  };

  return (
    <div id="activity-view" className="space-y-5 max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
            Stream de Atividade
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            Telemetria em tempo real de mídias recebidas e eventos de conversão no WhatsApp.
          </p>
        </div>

        {onClearActivities && (
          <div className="flex items-center gap-2">
            <button
              onClick={onClearActivities}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: 'rgba(244,63,94,0.10)',
                color: 'var(--accent-rose)',
                border: '1px solid rgba(244,63,94,0.20)',
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar logs
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                  style={
                    isActive
                      ? {
                          background: 'rgba(16,185,129,0.14)',
                          border: '1px solid rgba(16,185,129,0.22)',
                          color: 'var(--accent-emerald)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid transparent',
                          color: 'var(--ink-muted)',
                        }
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-disabled)' }}
            />
            <input
              type="text"
              placeholder="Buscar por remetente, telefone, comando..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--ink-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Events List */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--ink-disabled)' }}
            >
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-secondary)' }}>
              Nenhum evento de atividade encontrado
            </h3>
            <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--ink-muted)' }}>
              Não há mensagens que correspondam aos filtros atuais ou termos de busca.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table Header */}
            <div
              className="hidden md:grid grid-cols-12 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--ink-disabled)',
                borderBottom: '1px solid var(--border-hairline)',
              }}
            >
              <div className="col-span-2">Horário</div>
              <div className="col-span-4">Remetente & Contato</div>
              <div className="col-span-2">Formato</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Telemetria</div>
            </div>

            {/* List Rows */}
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {filteredActivities.map((act, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={act.id}
                    className="p-4 md:px-5 md:py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 items-start md:items-center transition-colors"
                    style={{
                      background: isEven ? 'rgba(255,255,255,0.012)' : 'transparent',
                      borderBottom: '1px solid var(--border-hairline)',
                    }}
                  >
                    {/* Time */}
                    <div className="md:col-span-2 flex items-center justify-between md:block">
                      <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: 'var(--ink-secondary)' }}>
                        {act.timestamp}
                      </span>
                      <span className="md:hidden">
                        {getStatusBadge(act.status)}
                      </span>
                    </div>

                    {/* Sender */}
                    <div className="md:col-span-4 flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-hairline)',
                          color: 'var(--ink-secondary)',
                        }}
                      >
                        {act.senderName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate" style={{ color: 'var(--ink-primary)' }}>
                          {act.senderName}
                        </div>
                        <div className="text-[11px] font-mono truncate" style={{ color: 'var(--ink-muted)' }}>
                          {act.senderPhone}
                        </div>
                      </div>
                    </div>

                    {/* Media Type & Command */}
                    <div className="md:col-span-2 flex items-center gap-1.5 my-1 md:my-0">
                      {getMediaBadge(act.mediaType)}
                      {act.commandUsed && (
                        <span
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-hairline)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          {act.commandUsed}
                        </span>
                      )}
                    </div>

                    {/* Status (Desktop) */}
                    <div className="hidden md:block md:col-span-2">
                      {getStatusBadge(act.status)}
                    </div>

                    {/* Telemetry / Notes */}
                    <div className="md:col-span-2 flex flex-col md:items-end text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                      {act.status === 'Processed' && (
                        <>
                          <span className="font-mono font-medium tabular-nums" style={{ color: 'var(--accent-cyan)' }}>
                            {act.processingTimeMs}ms · {act.sizeKb}kb
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--accent-emerald)' }}>
                            Sticker WebP 512px
                          </span>
                        </>
                      )}
                      {act.status === 'Unauthorized' && (
                        <span className="text-[11px] font-medium" style={{ color: 'var(--accent-gold)' }}>
                          {act.failureReason || 'Fora da Whitelist'}
                        </span>
                      )}
                      {act.status === 'Failed' && (
                        <span className="text-[11px] font-medium" style={{ color: 'var(--accent-rose)' }}>
                          {act.failureReason || 'Erro de decodificação'}
                        </span>
                      )}
                      {act.status === 'Queued' && (
                        <span className="text-[11px]" style={{ color: 'var(--ink-disabled)' }}>
                          Aguardando pipeline
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
