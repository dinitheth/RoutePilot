// Source: Google Maps Platform Code Assist
// Attribution ID: gmp_mcp_codeassist_v1_aistudio

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Layers,
  Maximize2,
  Minimize2,
  Building2,
  ShoppingBag,
  GraduationCap,
  Utensils,
  Flag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Mission, ItineraryStop } from '../types';

interface MapViewerProps {
  mission: Mission | null;
  selectedStop: ItineraryStop | null;
  onSelectStop: (stop: ItineraryStop) => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  mission,
  selectedStop,
  onSelectStop,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stops = mission?.currentPlan?.stops || [];
  const routeSegments = mission?.currentPlan?.routeSegments || [];

  // Determine bounding box of stops
  const lats = stops.map((s) => s.lat).filter(Boolean);
  const lngs = stops.map((s) => s.lng).filter(Boolean);
  const minLat = lats.length ? Math.min(...lats) : 6.85;
  const maxLat = lats.length ? Math.max(...lats) : 6.91;
  const minLng = lngs.length ? Math.min(...lngs) : 79.85;
  const maxLng = lngs.length ? Math.max(...lngs) : 79.91;

  // Custom Category Icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BANK':
        return <Building2 className="h-3.5 w-3.5" />;
      case 'SHOPPING':
        return <ShoppingBag className="h-3.5 w-3.5" />;
      case 'EDUCATION':
        return <GraduationCap className="h-3.5 w-3.5" />;
      case 'FOOD':
        return <Utensils className="h-3.5 w-3.5" />;
      case 'START':
      case 'END':
        return <Flag className="h-3.5 w-3.5" />;
      default:
        return <MapPin className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (category: string, isModified?: boolean) => {
    if (isModified) return 'from-amber-500 to-orange-500 text-white ring-amber-400';
    switch (category) {
      case 'START':
      case 'END':
        return 'from-cyan-500 to-blue-600 text-white ring-cyan-400';
      case 'BANK':
        return 'from-blue-600 to-indigo-600 text-white ring-blue-400';
      case 'SHOPPING':
        return 'from-purple-600 to-pink-600 text-white ring-purple-400';
      case 'EDUCATION':
        return 'from-emerald-600 to-teal-600 text-white ring-emerald-400';
      case 'FOOD':
        return 'from-amber-600 to-orange-600 text-white ring-amber-400';
      default:
        return 'from-slate-600 to-slate-700 text-white ring-slate-400';
    }
  };

  // Convert lat/lng to percentage X/Y on viewport
  const getCoordinatesPercent = (lat: number, lng: number) => {
    const latSpan = maxLat - minLat || 0.05;
    const lngSpan = maxLng - minLng || 0.05;

    // Padding margins
    const padding = 12;
    const x = padding + ((lng - minLng) / lngSpan) * (100 - padding * 2);
    // Invert Y because latitude goes North (up)
    const y = 100 - (padding + ((lat - minLat) / latSpan) * (100 - padding * 2));
    return { x: Math.min(92, Math.max(8, x)), y: Math.min(90, Math.max(10, y)) };
  };

  return (
    <div
      className={`relative bg-[#18181B] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
        isExpanded ? 'fixed inset-4 z-50 rounded-3xl' : 'h-[460px] lg:h-[540px]'
      }`}
    >
      {/* Map Control Bar in Bento Style */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#09090B]/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-zinc-800 pointer-events-auto shadow-lg">
          <Navigation className="h-4 w-4 text-zinc-300" />
          <div>
            <span className="text-xs font-bold text-zinc-100">Google Maps Grounding</span>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">
              {stops.length > 0 ? `${stops.length} Waypoints Optimized` : 'Waiting for mission...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {mission?.currentPlan && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#09090B]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">Plan v{mission.currentPlan.version}</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 rounded-full bg-[#09090B]/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-lg cursor-pointer"
            title={isExpanded ? 'Collapse Map' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Map Surface (Styled Dark Cartographic Grid with Live Stops & Vector Polyline Route Overlay) */}
      <div className="relative w-full h-full bg-[#09090B] overflow-hidden select-none">
        {/* Cartographic Grid Background Lines & Ambient Glow */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(#71717a 1px, transparent 1px), linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)`,
            backgroundSize: '32px 32px, 64px 64px, 64px 64px',
          }}
        />

        {/* Ambient Regional Water & Urban Corridor Highlights */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-950/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-zinc-800/20 blur-3xl pointer-events-none" />

        {/* Sri Lanka / Colombo Regional Landmarks Guide overlay */}
        <div className="absolute bottom-4 left-4 z-10 text-[10px] text-zinc-500 font-mono pointer-events-none flex flex-col gap-0.5">
          <span>REGION: Western Province, Sri Lanka (Colombo Metro Corridor)</span>
          <span>DATUM: WGS84 • PROJECTION: Spherical Mercator</span>
        </div>

        {/* SVG Route Paths & Vectors */}
        {stops.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Render sequenced route segments */}
            {stops.map((stop, idx) => {
              if (idx === stops.length - 1) return null;
              const nextStop = stops[idx + 1];
              const p1 = getCoordinatesPercent(stop.lat, stop.lng);
              const p2 = getCoordinatesPercent(nextStop.lat, nextStop.lng);

              return (
                <g key={`segment_${idx}`}>
                  {/* Outer glow stroke */}
                  <line
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke="#818cf8"
                    strokeWidth="5"
                    strokeOpacity="0.25"
                    filter="url(#glow)"
                  />
                  {/* Inner crisp line */}
                  <line
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke="url(#routeGradient)"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Interactive Waypoint Marker Pins */}
        {stops.map((stop) => {
          const coords = getCoordinatesPercent(stop.lat, stop.lng);
          const isSelected = selectedStop?.stopNumber === stop.stopNumber;

          return (
            <div
              key={`pin_${stop.stopNumber}`}
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-20 cursor-pointer group"
              onClick={() => onSelectStop(stop)}
            >
              {/* Pulsing Ripple if Selected */}
              {isSelected && (
                <span className="absolute -inset-2 rounded-full bg-indigo-500/30 animate-ping" />
              )}

              {/* Pin Bubble */}
              <div
                className={`relative flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-tr ${getCategoryColor(
                  stop.category,
                  stop.wasModifiedInReplan
                )} shadow-xl ring-2 transition-all transform group-hover:scale-115 ${
                  isSelected ? 'scale-125 ring-white' : 'ring-zinc-800 ring-opacity-90'
                }`}
              >
                <span className="text-[11px] font-extrabold">{stop.stopNumber}</span>
              </div>

              {/* Waypoint Label Tooltip */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl bg-[#18181B]/95 border border-zinc-700 text-zinc-100 shadow-2xl whitespace-nowrap pointer-events-none transition-all ${
                  isSelected ? 'opacity-100 scale-100 z-30' : 'opacity-85 group-hover:opacity-100'
                }`}
              >
                <div className="text-[10px] font-bold flex items-center gap-1.5">
                  {getCategoryIcon(stop.category)}
                  <span>{stop.placeName.length > 24 ? stop.placeName.substring(0, 24) + '...' : stop.placeName}</span>
                </div>
                <div className="text-[9px] text-zinc-400 font-mono flex items-center justify-between gap-3 mt-0.5">
                  <span>Arr: {stop.arrivalTime}</span>
                  <span className="text-zinc-200">{stop.durationMinutes > 0 ? `${stop.durationMinutes}m stop` : 'Start/End'}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State when no mission active */}
        {stops.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
            <div className="h-14 w-14 rounded-3xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3 shadow-xl">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200">Interactive Taskmaster Map</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
              Submit a mission objective or click a Quick Demo above to let RoutePilot research Google Maps Platform and plot optimized multi-stop routes.
            </p>
          </div>
        )}
      </div>

      {/* Selected Stop Details Bottom Bento Card */}
      {selectedStop && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-[#18181B]/95 backdrop-blur-md border border-zinc-700/90 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start gap-3.5">
            <div
              className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${getCategoryColor(
                selectedStop.category,
                selectedStop.wasModifiedInReplan
              )} flex items-center justify-center font-bold text-sm shrink-0 shadow-md`}
            >
              #{selectedStop.stopNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-zinc-100">{selectedStop.placeName}</h4>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                  {selectedStop.category}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    selectedStop.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {selectedStop.verificationStatus}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">{selectedStop.address}</p>
              <p className="text-xs text-zinc-300 font-medium mt-0.5">{selectedStop.instructions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-2.5 sm:pt-0">
            <div className="text-left sm:text-right font-mono text-xs">
              <div className="text-zinc-300">
                <span className="text-zinc-500">Arr:</span> {selectedStop.arrivalTime} • <span className="text-zinc-500">Dep:</span> {selectedStop.departureTime}
              </div>
              <div className="text-zinc-400 text-[11px] mt-0.5">
                {selectedStop.travelFromPrevMinutes > 0 && `${selectedStop.travelFromPrevMinutes}m travel (${selectedStop.travelDistanceKm}km)`}
                {selectedStop.costLKR > 0 && ` • Rs. ${selectedStop.costLKR.toLocaleString()}`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedStop.googleMapsUri && (
                <a
                  href={selectedStop.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors font-mono"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Maps</span>
                </a>
              )}

              <button
                onClick={() => onSelectStop(null as any)}
                className="text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
