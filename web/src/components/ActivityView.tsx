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
  ArrowUpDown,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { ActivityItem, ActivityStatus, MediaType } from '../types';

interface ActivityViewProps {
  activities: ActivityItem[];
  onOpenSimulateModal?: () => void;
  onClearActivities?: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  onClearActivities,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Processed' | 'Ignored' | 'Failed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'All', label: 'All Events' },
    { id: 'Processed', label: 'Processed' },
    { id: 'Ignored', label: 'Ignored / Blocked' },
    { id: 'Failed', label: 'Failed' },
  ] as const;

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Status filter
      if (selectedFilter === 'Processed' && act.status !== 'Processed') return false;
      if (selectedFilter === 'Ignored' && act.status !== 'Unauthorized') return false;
      if (selectedFilter === 'Failed' && act.status !== 'Failed') return false;

      // Query filter
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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <FileImage className="w-3 h-3" />
            IMAGE
          </span>
        );
      case 'VIDEO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
            <Video className="w-3 h-3" />
            VIDEO
          </span>
        );
      case 'GIF':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            <Film className="w-3 h-3" />
            GIF
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'Processed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Processed
          </span>
        );
      case 'Unauthorized':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            Unauthorized
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Failed
          </span>
        );
      case 'Queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Queued
          </span>
        );
    }
  };

  return (
    <div id="activity-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Activity Log</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time telemetry of incoming WhatsApp media and conversion events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSimulateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulate Message
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sender, phone, command..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Events List (Clean Modern SaaS Table on Desktop, Cards on Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No activity events found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no messages matching the current filter criteria or search query.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 px-5 py-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wider bg-slate-50/70">
              <div className="col-span-2">Time</div>
              <div className="col-span-4">Sender & Contact</div>
              <div className="col-span-2">Media Format</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Telemetry</div>
            </div>

            {/* List Rows */}
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-4 md:px-5 md:py-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 items-start md:items-center hover:bg-slate-50/70 transition-colors"
              >
                {/* Time */}
                <div className="md:col-span-2 flex items-center justify-between md:block">
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {act.timestamp}
                  </span>
                  <span className="md:hidden">
                    {getStatusBadge(act.status)}
                  </span>
                </div>

                {/* Sender */}
                <div className="md:col-span-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {act.senderName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900">
                      {act.senderName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600">
                      {act.senderPhone}
                    </div>
                  </div>
                </div>

                {/* Media Type & Command */}
                <div className="md:col-span-2 flex items-center gap-1.5 my-1 md:my-0">
                  {getMediaBadge(act.mediaType)}
                  {act.commandUsed && (
                    <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {act.commandUsed}
                    </span>
                  )}
                </div>

                {/* Status (Desktop) */}
                <div className="hidden md:block md:col-span-2">
                  {getStatusBadge(act.status)}
                </div>

                {/* Telemetry / Notes */}
                <div className="md:col-span-2 flex flex-col md:items-end text-[11px] text-slate-500">
                  {act.status === 'Processed' && (
                    <>
                      <span className="font-mono text-slate-700 font-medium">
                        {act.processingTimeMs}ms · {act.sizeKb}kb WebP
                      </span>
                      <span className="text-[10px] text-emerald-600">
                        Converted to sticker
                      </span>
                    </>
                  )}
                  {act.status === 'Unauthorized' && (
                    <span className="text-[11px] text-amber-600 font-medium">
                      {act.failureReason || 'Not in Whitelist'}
                    </span>
                  )}
                  {act.status === 'Failed' && (
                    <span className="text-[11px] text-rose-600 font-medium">
                      {act.failureReason || 'Decoding error'}
                    </span>
                  )}
                  {act.status === 'Queued' && (
                    <span className="text-[11px] text-slate-500">
                      Awaiting Sharp pipeline
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
