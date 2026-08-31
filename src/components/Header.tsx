import React from 'react';
import { Compass, History, Info, Plus } from 'lucide-react';

interface HeaderProps {
  onNewMission: () => void;
  onOpenHistory: () => void;
  onOpenTechDetails: () => void;
  missionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewMission,
  onOpenHistory,
  onOpenTechDetails,
  missionCount,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-sm">
          <Compass className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-100 tracking-tight">RoutePilot</span>
            <span className="text-[11px] text-zinc-500 font-normal hidden sm:inline">
              Autonomous mission agent
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewMission}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Mission</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/80 transition-colors cursor-pointer"
          title="Mission History"
        >
          <History className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden sm:inline">History</span>
          {missionCount > 0 && (
            <span className="ml-0.5 text-[10px] font-mono text-zinc-400">({missionCount})</span>
          )}
        </button>

        <button
          onClick={onOpenTechDetails}
          className="p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/80 transition-colors cursor-pointer"
          title="Architecture & Technology Details"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
