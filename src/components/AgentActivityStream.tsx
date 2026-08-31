import React, { useRef, useEffect } from 'react';
import {
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  Wrench,
  Search,
  Route,
  Database,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { MissionEvent } from '../types';

interface AgentActivityStreamProps {
  events: MissionEvent[];
  isLoading: boolean;
}

export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({
  events,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (type: MissionEvent['type'], toolName?: string) => {
    if (toolName === 'search_places') return <Search className="h-3.5 w-3.5 text-cyan-400" />;
    if (toolName === 'get_route') return <Route className="h-3.5 w-3.5 text-blue-400" />;
    if (toolName === 'mission_parser') return <Compass className="h-3.5 w-3.5 text-amber-400" />;

    switch (type) {
      case 'MISSION_CREATED':
      case 'MISSION_ANALYSIS_STARTED':
        return <Compass className="h-3.5 w-3.5 text-blue-400" />;
      case 'PLACE_SEARCH_STARTED':
      case 'CANDIDATE_FOUND':
        return <Search className="h-3.5 w-3.5 text-cyan-400" />;
      case 'ROUTE_CALCULATED':
        return <Route className="h-3.5 w-3.5 text-purple-400" />;
      case 'PLAN_CREATED':
      case 'PLAN_VERSION_CREATED':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case 'MISSION_REPLAN_STARTED':
      case 'PLACE_BECAME_UNAVAILABLE':
      case 'CONSTRAINT_CHANGED':
        return <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />;
      case 'MISSION_BLOCKED':
        return <AlertCircle className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <Zap className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-3.5">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-zinc-300" />
          <h3 className="text-sm font-bold text-zinc-100 font-mono">Agent Activity Telemetry</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Google ADK Stream</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 font-mono text-xs"
      >
        {events.map((evt) => {
          const timeStr = new Date(evt.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={evt.id}
              className="flex items-start gap-3 p-3 rounded-2xl bg-[#09090B] border border-zinc-800/90 hover:border-zinc-700 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{getEventIcon(evt.type, evt.toolName)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 mb-1">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider">{evt.type}</span>
                  <span>{timeStr}</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {evt.message}
                </p>

                {evt.toolName && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                      tool: {evt.toolName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
            <Compass className="h-4 w-4 animate-spin text-zinc-100" />
            <span>RoutePilot ADK Agent reasoning and executing tool calls...</span>
          </div>
        )}

        {events.length === 0 && !isLoading && (
          <div className="text-center py-8 text-xs text-zinc-500 font-sans">
            Launch a mission to monitor real-time ADK tool calls, state transitions, and background events.
          </div>
        )}
      </div>
    </div>
  );
};
