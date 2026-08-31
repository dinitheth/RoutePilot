import React, { useState, useEffect } from 'react';
import {
  X,
  Navigation,
  ExternalLink,
  MapPin,
  Clock,
  Building2,
  Compass,
  RotateCw,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { ItineraryStop } from '../types';

interface Location3DPopviewModalProps {
  stop: ItineraryStop | null;
  stops: ItineraryStop[];
  onClose: () => void;
  onSelectStop: (stop: ItineraryStop) => void;
  onFlyToStop?: (stop: ItineraryStop) => void;
}

export const Location3DPopviewModal: React.FC<Location3DPopviewModalProps> = ({
  stop,
  stops,
  onClose,
  onSelectStop,
  onFlyToStop,
}) => {
  const [pitch, setPitch] = useState<number>(55);
  const [heading, setHeading] = useState<number>(35);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(true);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'3d-model' | 'satellite-view' | 'logistics'>('3d-model');

  // Auto orbit animation
  useEffect(() => {
    if (!isAutoSpinning) return;
    const interval = setInterval(() => {
      setHeading((prev) => (prev + 0.75) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isAutoSpinning]);

  if (!stop) return null;

  const currentIndex = stops.findIndex((s) => s.stopNumber === stop.stopNumber);
  const prevStop = currentIndex > 0 ? stops[currentIndex - 1] : null;
  const nextStop = currentIndex < stops.length - 1 ? stops[currentIndex + 1] : null;

  const handleCopyCoords = () => {
    if (stop.lat && stop.lng) {
      navigator.clipboard.writeText(`${stop.lat.toFixed(6)}, ${stop.lng.toFixed(6)}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#121214] border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <span className="h-7 w-7 rounded-full bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center shadow">
              {stop.stopNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  3D Popview Inspector
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-zinc-400">Stop {stop.stopNumber} of {stops.length}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-100">{stop.placeName}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Next Stop Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => prevStop && onSelectStop(prevStop)}
                disabled={!prevStop}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                title="Previous Stop"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-mono px-2 text-zinc-400">
                #{stop.stopNumber}
              </span>
              <button
                onClick={() => nextStop && onSelectStop(nextStop)}
                disabled={!nextStop}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                title="Next Stop"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Interactive 3D Perspective Viewport */}
          <div className="lg:col-span-7 p-5 bg-gradient-to-b from-zinc-950 via-[#0d0d0f] to-[#121214] border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col justify-between min-h-[380px]">
            {/* View Mode Switcher */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setActiveTab('3d-model')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === '3d-model'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  3D Popview
                </button>
                <button
                  onClick={() => setActiveTab('satellite-view')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'satellite-view'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Aerial Simulation
                </button>
              </div>

              <button
                onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isAutoSpinning
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <RotateCw className={`h-3 w-3 ${isAutoSpinning ? 'animate-spin' : ''}`} />
                <span>{isAutoSpinning ? 'Orbiting' : 'Orbit Paused'}</span>
              </button>
            </div>

            {/* 3D Popview Canvas Stage */}
            <div className="relative flex-1 rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden flex items-center justify-center p-6 min-h-[260px] shadow-inner">
              {/* Background 3D Ground Grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, #34d399 1px, transparent 1px), linear-gradient(to bottom, #34d399 1px, transparent 1px)`,
                  backgroundSize: '32px 32px',
                  transform: `perspective(600px) rotateX(${pitch}deg) rotateZ(${heading}deg) scale(1.4)`,
                  transformOrigin: 'center center',
                }}
              />

              {/* 3D Volumetric Location Simulation */}
              <div
                className="relative z-10 transition-transform duration-75 flex items-center justify-center"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `perspective(800px) rotateX(${pitch}deg) rotateZ(${heading}deg)`,
                }}
              >
                {/* Ground Footprint Ring */}
                <div className="w-44 h-44 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center animate-pulse">
                  <div className="w-32 h-32 rounded-full border border-dashed border-emerald-400/60" />
                </div>

                {/* 3D Building Mockup Prism */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(30px)',
                  }}
                >
                  {/* Building Block */}
                  <div
                    className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border-2 border-emerald-400/80 shadow-2xl flex flex-col items-center justify-center text-center p-2 text-zinc-100"
                    style={{
                      boxShadow: '0 25px 45px -10px rgba(0, 0, 0, 0.9), 0 0 25px 2px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Building2 className="h-6 w-6 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">
                      {stop.placeName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400">Stop #{stop.stopNumber}</span>
                  </div>

                  {/* 3D Hovering Pin Badge */}
                  <div
                    className="absolute -top-12 z-30"
                    style={{
                      transform: 'translateZ(40px) rotateX(-50deg)',
                    }}
                  >
                    <div className="px-2.5 py-1 rounded-full bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg flex items-center gap-1 border border-white">
                      <MapPin className="h-3 w-3 fill-zinc-950" />
                      <span>{stop.stopNumber}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coordinates HUD Overlay */}
              <div className="absolute bottom-3 left-3 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                <Compass className="h-3 w-3 text-emerald-400" />
                <span>
                  {stop.lat?.toFixed(5)}°N, {stop.lng?.toFixed(5)}°E
                </span>
                <button
                  onClick={handleCopyCoords}
                  className="hover:text-emerald-400 transition-colors ml-1"
                  title="Copy Lat/Lng"
                >
                  {copiedCoords ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              {/* HUD Elevation & Pitch */}
              <div className="absolute bottom-3 right-3 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <span>P: {Math.round(pitch)}° • H: {Math.round(heading)}°</span>
              </div>
            </div>

            {/* 3D Control Sliders */}
            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>3D Pitch Angle</span>
                  <span className="font-mono">{Math.round(pitch)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="75"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>3D Azimuth / Orbit</span>
                  <span className="font-mono">{Math.round(heading)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={heading}
                  onChange={(e) => {
                    setIsAutoSpinning(false);
                    setHeading(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Location Intelligence & Operational Details */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Location Card */}
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-zinc-500 font-semibold">
                  Verified Destination
                </span>
                <h4 className="text-lg font-bold text-zinc-100 mt-0.5">{stop.placeName}</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{stop.address}</p>
              </div>

              {/* Timing Strip */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Target Arrival</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {stop.arrivalTime || '10:15 AM'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Allocated Dwell</div>
                  <div className="text-sm font-bold font-mono text-zinc-200 mt-0.5">
                    {stop.durationMinutes > 0 ? `${stop.durationMinutes} minutes` : 'Waypoint'}
                  </div>
                </div>
              </div>

              {/* Operational & Access Intel */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Access & Ground Intel</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 text-xs text-zinc-300">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {stop.notes || 'Autonomous waypoint verified via Google Maps Platform Places & Routes intelligence.'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60">
                    <span>Parking / Drop-off zone:</span>
                    <span className="text-emerald-400 font-medium">Front curb clearance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              {onFlyToStop && (
                <button
                  onClick={() => {
                    onFlyToStop(stop);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Fly Map Camera to Stop</span>
                </button>
              )}

              {stop.googleMapsUri && (
                <a
                  href={stop.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs border border-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open in Real Google Maps</span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
