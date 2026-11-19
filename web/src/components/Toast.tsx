import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-6 z-50 animate-fade-in">
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium"
        style={{
          background: 'rgba(14, 17, 27, 0.95)',
          border: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
          color: 'var(--ink-primary)',
        }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-emerald)' }} />
        <span>{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 p-0.5 rounded transition-colors"
          style={{ color: 'var(--ink-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
