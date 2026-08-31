import React from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Building2,
  ShoppingBag,
  GraduationCap,
  Utensils,
  Flag,
  ArrowDown,
  Car,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ItineraryStop, MissionPlan } from '../types';

interface MissionTimelineProps {
  plan: MissionPlan | null;
  selectedStop: ItineraryStop | null;
  onSelectStop: (stop: ItineraryStop) => void;
  onToggleComplete?: (stopNumber: number) => void;
}

export const MissionTimeline: React.FC<MissionTimelineProps> = ({
  plan,
  selectedStop,
  onSelectStop,
  onToggleComplete,
}) => {
  if (!plan || plan.stops.length === 0) {
    return (
      <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-3">
          <Clock className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-200">Executable Mission Timeline</h3>
        <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
          Once the agent completes research and route optimization, your chronological itinerary will appear here.
        </p>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BANK':
        return <Building2 className="h-3.5 w-3.5 text-blue-400" />;
      case 'SHOPPING':
        return <ShoppingBag className="h-3.5 w-3.5 text-purple-400" />;
      case 'EDUCATION':
        return <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />;
      case 'FOOD':
        return <Utensils className="h-3.5 w-3.5 text-amber-400" />;
      case 'START':
      case 'END':
        return <Flag className="h-3.5 w-3.5 text-zinc-300" />;
      default:
        return <MapPin className="h-3.5 w-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-300" />
            <span>Mission Timeline Itinerary</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
            <span>{plan.stops.length} sequenced stops • {plan.totalDistanceKm} km total travel</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
              <Sparkles className="h-2.5 w-2.5" />
              Maps Grounded
            </span>
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-zinc-500">Total: </span>
          <span className="font-bold text-zinc-100">{Math.round(plan.totalDurationMinutes)}m</span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-zinc-500 before:via-zinc-700 before:to-zinc-800">
        {plan.stops.map((stop, idx) => {
          const isSelected = selectedStop?.stopNumber === stop.stopNumber;

          return (
            <div
              key={`stop_${stop.stopNumber}`}
              className={`relative group cursor-pointer transition-all ${
                isSelected ? 'scale-[1.01]' : ''
              }`}
              onClick={() => onSelectStop(stop)}
            >
              {/* Timeline Dot */}
              <div
                className={`absolute -left-6 top-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-zinc-100 border-zinc-950 ring-4 ring-zinc-500/30'
                    : stop.isCompleted
                    ? 'bg-emerald-500 border-zinc-900 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                }`}
              >
                <span className="text-[9px] font-bold font-mono">{stop.stopNumber}</span>
              </div>

              {/* Stop Card */}
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  isSelected
                    ? 'bg-zinc-900 border-zinc-600 shadow-xl ring-1 ring-zinc-600'
                    : 'bg-[#09090B] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {/* Travel Connection Ribbon if not first stop */}
                {stop.travelFromPrevMinutes > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mb-2 pb-2 border-b border-zinc-800/80">
                    <Car className="h-3 w-3 text-zinc-300" />
                    <span>
                      {stop.travelFromPrevMinutes} min travel ({stop.travelDistanceKm} km)
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      {getCategoryIcon(stop.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors">
                          {stop.placeName}
                        </h4>
                        {stop.googleMapsUri && (
                          <a
                            href={stop.googleMapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-400 hover:text-emerald-400 transition-colors p-0.5"
                            title="Open in Google Maps"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate max-w-xs">{stop.address}</p>
                    </div>
                  </div>

                  {/* Timing & Badges */}
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-zinc-100">
                      {stop.arrivalTime}
                    </div>
                    {stop.durationMinutes > 0 && (
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {stop.durationMinutes}m stop
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Instructions & Cost */}
                <p className="text-xs text-zinc-300 mt-2 font-sans leading-relaxed">
                  {stop.instructions}
                </p>

                {/* Grounding Snippets if present */}
                {stop.groundingSources && stop.groundingSources.length > 0 && stop.groundingSources[0].snippet && (
                  <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80 font-sans italic line-clamp-2">
                    <span className="text-emerald-400 not-italic font-mono font-medium">Maps Grounding: </span>
                    "{stop.groundingSources[0].snippet}"
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono font-semibold text-[9px] ${
                        stop.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {stop.verificationStatus}
                    </span>

                    {stop.wasModifiedInReplan && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-semibold text-[9px]">
                        REPLANNED v{plan.version}
                      </span>
                    )}

                    {stop.googleMapsUri && (
                      <a
                        href={stop.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[9px] font-mono text-zinc-400 hover:text-emerald-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Google Maps
                      </a>
                    )}
                  </div>

                  {stop.costLKR > 0 && (
                    <span className="font-mono font-bold text-emerald-400">
                      Rs. {stop.costLKR.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
