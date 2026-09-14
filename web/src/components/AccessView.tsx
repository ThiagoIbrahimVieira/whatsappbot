import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Lock, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  Calendar,
  AlertCircle
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
      title: 'Only me',
      description: 'Only your personal WhatsApp account is allowed to create stickers.',
      icon: Lock,
      badge: 'Maximum Privacy',
    },
    {
      id: 'whitelist',
      title: 'Whitelist',
      description: 'Only approved contacts in your personal list can use the bot.',
      icon: UserCheck,
      badge: 'Recommended',
    },
    {
      id: 'everyone',
      title: 'Everyone',
      description: 'Anyone can use the bot in private chats and allowed groups.',
      icon: Users,
      badge: 'Open Access',
    },
  ];

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contacts, searchQuery]);

  return (
    <div id="access-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Control</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Choose who can use your sticker automation and manage your trusted contact whitelist.
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
              className={`cursor-pointer relative p-5 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
              }`}
            >
              {/* Checkmark indicator */}
              <div className="flex items-start justify-between">
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'bg-emerald-500 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1.5">
                  {opt.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {opt.badge}
                    </span>
                  )}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-900">{opt.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ALLOWED PEOPLE SECTION (WHITELIST) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Allowed people</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {contacts.length}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Contacts granted permanent VIP permission (unlimited stickers, bypassing daily limits).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Add Person Button */}
            <button
              id="btn-add-person"
              onClick={onOpenAddPersonModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add person</span>
            </button>
          </div>
        </div>

        {/* Informational banner if accessMode is not whitelist */}
        {accessMode !== 'whitelist' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Note: Current mode is <strong>{accessMode.replace('_', ' ')}</strong>. Contacts in this list are also recognized as permanent VIPs under Freemium mode.
            </span>
          </div>
        )}

        {/* Contacts List / Table */}
        {filteredContacts.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            No contacts found. Click <strong>Add person</strong> to authorize someone.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      contact.avatarColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>{contact.name}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                        👑 VIP Ilimitado
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2">
                      <span>{contact.phone}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="hidden sm:inline text-slate-500">
                        Added {contact.addedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Stats & Remove Button */}
                <div className="flex items-center gap-3 shrink-0">
                  {contact.totalConverted !== undefined && (
                    <span className="hidden md:inline-block text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {contact.totalConverted} stickers made
                    </span>
                  )}

                  <button
                    onClick={() => onRemoveContact(contact.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    title="Remove permission"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
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
