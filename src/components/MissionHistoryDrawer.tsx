import React from 'react';
import { History, X, Clock, CheckCircle2, ChevronRight, GitCommit } from 'lucide-react';
import { Mission } from '../types';

interface MissionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  currentMission: Mission | null;
  onSelectMission: (mission: Mission) => void;
}

export const MissionHistoryDrawer: React.FC<MissionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  missions,
  currentMission,
  onSelectMission,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121214] border-l border-zinc-800 h-full p-6 shadow-2xl flex flex-col gap-5 text-zinc-100 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Mission History</h3>
              <p className="text-xs text-zinc-400">Persisted in Google Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Mission Version History if available */}
        {currentMission && currentMission.versions.length > 1 && (
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <GitCommit className="h-3.5 w-3.5 text-emerald-400" />
              <span>Current Mission Versions ({currentMission.versions.length})</span>
            </span>
            <div className="space-y-2 pt-1">
              {currentMission.versions.map((ver) => (
                <div
                  key={`ver_${ver.version}`}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
                    <span className="font-semibold text-emerald-400">Plan v{ver.version}</span>
                    <span>{new Date(ver.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">{ver.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List of Previous Missions */}
        <div className="space-y-3 flex-1">
          <span className="text-xs font-semibold text-zinc-400 block">
            Recent Missions ({missions.length})
          </span>

          {missions.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No saved missions yet. Start a new mission to begin.
            </div>
          ) : (
            missions.map((m) => {
              const isCurrent = m.id === currentMission?.id;
              const timeStr = new Date(m.createdAt).toLocaleString();
              const stopCount = m.currentPlan?.stops?.length || 0;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMission(m);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isCurrent
                      ? 'bg-zinc-800/90 border-emerald-500/50 shadow-md'
                      : 'bg-zinc-900/40 hover:bg-zinc-900/90 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200 truncate max-w-[240px]">
                      {m.title || 'Mission'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{timeStr}</span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {m.userPrompt}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{stopCount} stops planned</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
