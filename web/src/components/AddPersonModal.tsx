import React, { useState } from 'react';
import { X, UserPlus, Phone, User } from 'lucide-react';
import { WhitelistContact } from '../types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Omit<WhitelistContact, 'id' | 'addedDate'>) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor informe o nome do contato');
      return;
    }
    if (!phone.trim()) {
      setError('Por favor informe o número de WhatsApp');
      return;
    }

    const avatarColors = [
      'bg-emerald-500/20 text-emerald-400',
      'bg-cyan-500/20 text-cyan-400',
      'bg-amber-500/20 text-amber-400',
      'bg-purple-500/20 text-purple-400',
    ];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      avatarColor: randomColor,
      totalConverted: 0,
    });

    setName('');
    setPhone('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden z-10 shadow-2xl"
        style={{
          background: 'rgba(14, 17, 27, 0.95)',
          border: '1px solid var(--border-hairline)',
          backdropFilter: 'blur(24px) saturate(190%)',
          boxShadow: 'var(--specular), 0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-hairline)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--accent-emerald-dim)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16,185,129,0.22)',
              }}
            >
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                Adicionar pessoa
              </h3>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Autorize um contato de WhatsApp a usar o bot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="p-2.5 rounded-xl text-xs font-medium"
              style={{
                background: 'rgba(244,63,94,0.12)',
                border: '1px solid rgba(244,63,94,0.25)',
                color: 'var(--accent-rose)',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-secondary)' }}>
              Nome do Contato
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-disabled)' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="ex: Lucas Oliveira"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--ink-primary)',
                }}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-secondary)' }}>
              Número de WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-disabled)' }} />
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError('');
                }}
                placeholder="+55 11 9****-****"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl font-mono outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--ink-disabled)' }}>
              Inclua o DDI e DDD (ex: +55 para Brasil).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--ink-secondary)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              style={{
                background: 'rgba(16,185,129,0.18)',
                border: '1px solid rgba(16,185,129,0.30)',
                color: 'var(--accent-emerald)',
                boxShadow: '0 0 16px rgba(16,185,129,0.15)',
              }}
            >
              Adicionar pessoa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
