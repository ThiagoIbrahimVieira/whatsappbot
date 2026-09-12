import React from 'react';
import { X, Smartphone, CheckCircle2, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';
import { SystemInfo } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInfo: SystemInfo;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  systemInfo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Session</h3>
              <p className="text-xs text-slate-600">Baileys Multi-Device Web Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Session Active & Authenticated</span>
          </div>

          {/* QR Container (Simulated active session QR placeholder or linked status) */}
          <div className="mx-auto w-48 h-48 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col items-center justify-center relative group">
            {/* SVG QR Visual */}
            <div className="w-36 h-36 border-4 border-slate-800 rounded-xl p-2 bg-white flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-8 h-8 bg-slate-900 rounded-sm"></div>
                <div className="w-8 h-8 bg-slate-900 rounded-sm"></div>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                  TT
                </div>
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 bg-slate-900 rounded-sm"></div>
                <div className="w-4 h-4 bg-emerald-500 rounded-xs"></div>
              </div>
            </div>

            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-xs text-slate-700 font-medium">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-1" />
              <span>Already Linked</span>
              <span className="text-[11px] font-mono text-slate-500 mt-0.5">{systemInfo.phoneNumber}</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <p>
              Connected via <strong className="text-slate-700 font-mono">Baileys MD Protocol</strong>
            </p>
            <p>Uptime: <strong className="text-slate-700">{systemInfo.uptime}</strong> • Latency: <strong className="text-slate-700">{systemInfo.avgLatency}</strong></p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert('Session credentials refreshed successfully.');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
