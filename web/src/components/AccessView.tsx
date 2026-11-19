import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Lock,
  Search,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AccessMode, WhitelistContact } from '../types';

interface AccessViewProps {
  accessMode: AccessMode;
  onSelectAccessMode: (mode: AccessMode) => void;
  contacts: WhitelistContact[];
  onRemoveContact: (id: string) => void;
  onOpenAddPersonModal: () => void;
}

export const AccessView: React.FC<AccessViewProps> = ({
  accessMode,
  onSelectAccessMode,
  contacts,
  onRemoveContact,
  onOpenAddPersonModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const modeOptions: Array<{
    id: AccessMode;
    title: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }> = [
    {
      id: 'only_me',
      title: 'Apenas Eu',
      description: 'Apenas a sua conta de WhatsApp pessoal tem permissão para criar figurinhas.',
      icon: Lock,
      badge: 'Privacidade Máxima',
    },
    {
      id: 'whitelist',
      title: 'Whitelist',
      description: 'Apenas contatos aprovados na sua lista podem utilizar o bot.',
      icon: UserCheck,
      badge: 'Recomendado',
    },
    {
      id: 'everyone',
      title: 'Todos',
      description: 'Qualquer pessoa pode interagir com o bot em conversas privadas.',
      icon: Users,
      badge: 'Acesso Público',
    },
  ];

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contacts, searchQuery]);

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-hairline)',
    boxShadow: 'var(--specular)',
  };

  return (
    <div id="access-view" className="space-y-6 max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
          Controle de Acesso
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          Escolha quem pode utilizar a automação de figurinhas e gerencie sua whitelist de contatos confiáveis.
        </p>
      </div>

      {/* 3 ACCESS MODE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = accessMode === opt.id;

          return (
            <div
              key={opt.id}
              id={`access-mode-${opt.id}`}
              onClick={() => onSelectAccessMode(opt.id)}
              className="cursor-pointer relative p-5 rounded-2xl transition-all duration-200"
              style={
                isSelected
                  ? {
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.30)',
                      boxShadow: '0 0 20px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }
                  : {
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      boxShadow: 'var(--specular)',
                    }
              }
            >
              {/* Checkmark indicator */}
              <div className="flex items-start justify-between">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={
                    isSelected
                      ? { background: 'var(--accent-emerald)', color: '#09090B' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'var(--ink-muted)' }
                  }
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1.5">
                  {opt.badge && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={
                        isSelected
                          ? { background: 'rgba(16,185,129,0.18)', color: 'var(--accent-emerald)' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'var(--ink-disabled)' }
                      }
                    >
                      {opt.badge}
                    </span>
                  )}
                  <div
                    className="w-5 h-5 rounded-full border flex items-center justify-center transition-all"
                    style={
                      isSelected
                        ? { borderColor: 'var(--accent-emerald)', background: 'var(--accent-emerald)', color: '#09090B' }
                        : { borderColor: 'rgba(255,255,255,0.15)', background: 'transparent' }
                    }
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3
                  className="text-sm font-bold"
                  style={{ color: isSelected ? 'var(--accent-emerald)' : 'var(--ink-primary)' }}
                >
                  {opt.title}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  {opt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ALLOWED PEOPLE SECTION (WHITELIST) */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3"
          style={{ borderBottom: '1px solid var(--border-hairline)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                Pessoas Liberadas
              </h3>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--accent-emerald-dim)',
                  color: 'var(--accent-emerald)',
                  border: '1px solid rgba(16,185,129,0.22)',
                }}
              >
                {contacts.length}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              Contatos com permissão VIP permanente (figurinhas ilimitadas, contornando o limite diário gratuito).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search
                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ink-disabled)' }}
              />
              <input
                type="text"
                placeholder="Buscar contato..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            {/* Add Person Button */}
            <button
              id="btn-add-person"
              onClick={onOpenAddPersonModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              style={{
                background: 'rgba(16,185,129,0.18)',
                border: '1px solid rgba(16,185,129,0.30)',
                color: 'var(--accent-emerald)',
                boxShadow: '0 0 12px rgba(16,185,129,0.12)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar pessoa</span>
            </button>
          </div>
        </div>

        {/* Informational banner if accessMode is not whitelist */}
        {accessMode !== 'whitelist' && (
          <div
            className="p-3 rounded-xl flex items-center gap-2.5 text-xs"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.20)',
              color: 'var(--accent-gold)',
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Aviso: O modo atual é <strong>{accessMode.replace('_', ' ')}</strong>. Contatos nesta lista são reconhecidos como VIPs permanentes sob o modo Freemium.
            </span>
          </div>
        )}

        {/* Contacts List / Table */}
        {filteredContacts.length === 0 ? (
          <div className="py-10 text-center text-xs" style={{ color: 'var(--ink-disabled)' }}>
            Nenhum contato encontrado. Clique em <strong>Adicionar pessoa</strong> para autorizar alguém.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="py-3 flex items-center justify-between gap-3 text-xs px-2 rounded-xl transition-colors"
                style={{ borderBottom: '1px solid var(--border-hairline)' }}
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-xs flex items-center gap-1.5" style={{ color: 'var(--ink-primary)' }}>
                      <span>{contact.name}</span>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: 'var(--accent-gold-dim)',
                          border: '1px solid rgba(245,158,11,0.22)',
                          color: 'var(--accent-gold)',
                        }}
                      >
                        👑 VIP Ilimitado
                      </span>
                    </div>
                    <div className="text-[11px] font-mono flex items-center gap-2 mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                      <span>{contact.phone}</span>
                      <span className="hidden sm:inline opacity-30">•</span>
                      <span className="hidden sm:inline opacity-60">
                        Adicionado em {contact.addedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Stats & Remove Button */}
                <div className="flex items-center gap-3 shrink-0">
                  {contact.totalConverted !== undefined && (
                    <span
                      className="hidden md:inline-block text-[11px] px-2 py-0.5 rounded-md font-mono"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      {contact.totalConverted} figurinhas
                    </span>
                  )}

                  <button
                    onClick={() => onRemoveContact(contact.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: 'rgba(244,63,94,0.08)',
                      color: 'var(--accent-rose)',
                      border: '1px solid rgba(244,63,94,0.18)',
                    }}
                    title="Remover permissão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
