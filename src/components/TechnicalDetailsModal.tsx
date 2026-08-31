import React from 'react';
import {
  X,
  Cpu,
  Workflow,
  MapPin,
  Database,
  Cloud,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface TechnicalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalDetailsModal: React.FC<TechnicalDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Architecture & Technical Stack</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              RoutePilot Autonomous Multi-Stop Mission Engine
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-zinc-300">
          {/* Architectural Overview */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <h3 className="font-semibold text-zinc-200 text-sm">System Overview</h3>
            <p className="text-zinc-400 leading-relaxed">
              RoutePilot is an autonomous agent for real-world errands and logistics. When given natural language objectives and constraints, RoutePilot coordinates research, geospatial place grounding, opening hours verification, and real-time route optimization without requiring manual waypoint configuration.
            </p>
          </div>

          {/* Technology Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Cpu className="h-4 w-4" />
                <span>Gemini 3.7 Flash + Maps Grounding</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Understands natural language constraints, decomposes multi-stop goals, and leverages the Gemini <code className="text-zinc-300 font-mono">googleMaps</code> tool for live place grounding.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Workflow className="h-4 w-4" />
                <span>Google ADK (Agent Development Kit)</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Coordinates multi-phase execution (Understand → Research → Optimize → Monitor) with autonomous replanning triggered by real-world friction.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <MapPin className="h-4 w-4" />
                <span>Google Maps Platform</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Places API (New) for verified operating hours, addresses, ratings, and Routes API for realistic transit times and traffic estimation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Database className="h-4 w-4" />
                <span>Google Cloud Firestore</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Durable document persistence for mission state, versioned itineraries, audit event telemetry, and background replanning history.
              </p>
            </div>
          </div>

          {/* Hackathon Category & Compliance */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 space-y-1.5">
            <div className="font-semibold text-xs flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Category: TASKMASTER (All Things Agentic Hackathon)</span>
            </div>
            <p className="text-[11px] text-emerald-400/80 leading-relaxed">
              Fully compliant with all agentic criteria: autonomous execution, multi-tool orchestration, live grounding, persistent state management, and real-world friction recovery.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
