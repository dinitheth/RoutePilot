import React, { useState } from 'react';
import {
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { Mission, ItineraryStop } from '../types';

interface AgentCommandPanelProps {
  mission: Mission | null;
  isLoading: boolean;
  onStartMission: (prompt: string) => void;
  onReplanMission: (eventDescription: string) => void;
  onNewMission: () => void;
  selectedStop: ItineraryStop | null;
  onSelectStop: (stop: ItineraryStop | null) => void;
}

export const AgentCommandPanel: React.FC<AgentCommandPanelProps> = ({
  mission,
  isLoading,
  onStartMission,
  onReplanMission,
  onNewMission,
  selectedStop,
  onSelectStop,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [replanText, setReplanText] = useState<string>('');
  const [isReplanOpen, setIsReplanOpen] = useState<boolean>(false);
  const [showOptionalControls, setShowOptionalControls] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>('Nugegoda, Western Province');
  const [startTime, setStartTime] = useState<string>('09:30');
  const [budget, setBudget] = useState<string>('5000');
  const [transport, setTransport] = useState<string>('DRIVE');

  const plan = mission?.currentPlan;
  const stops = plan?.stops || [];

  // Reset internal inputs when switching to new mission mode
  const handleTriggerNewMission = () => {
    setPrompt('');
    setReplanText('');
    setIsReplanOpen(false);
    setShowOptionalControls(false);
    onSelectStop(null);
    onNewMission();
  };

  // Example Prompt Presets for Quick Testing
  const presets = [
    {
      label: 'Colombo Multi-Errand',
      text: "I'm starting from Nugegoda at 9:30 AM. I have Rs. 5,000 and 4 hours. I need to visit a bank, buy a laptop charger, collect a document from campus, have lunch, and return home before 2 PM.",
    },
    {
      label: 'Express Banking & Tech',
      text: 'Start at Nugegoda at 10:00 AM. Visit Commercial Bank, buy a phone cable at Unity Plaza, and return home in 90 minutes.',
    },
    {
      label: 'University & Lunch',
      text: 'Depart from Nugegoda at 11:30 AM. Visit University of Sri Jayewardenepura, have lunch at a nearby restaurant, budget Rs. 3,000, finish by 2:00 PM.',
    },
  ];

  const handlePresetClick = (text: string) => {
    setPrompt(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onStartMission(prompt);
  };

  const handleReplanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replanText.trim() || isLoading) return;
    onReplanMission(replanText);
    setReplanText('');
    setIsReplanOpen(false);
  };

  // 1. INPUT MODE (When no active mission or user clicked New Mission)
  if (!mission || mission.status === 'CREATED' && !plan && !isLoading) {
    return (
      <div className="h-full flex flex-col justify-between p-5 sm:p-6 bg-[#121214] border-r border-zinc-800/80 overflow-y-auto">
        <div className="space-y-5">
          {/* Header text */}
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              RoutePilot
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-1">
              What do you need to get done?
            </h1>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Describe your errands, departure point, time limit, or budget in natural language.
            </p>
          </div>

          {/* Large Mission Input Textarea */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all p-3 shadow-inner">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I need to leave Nugegoda at 9:30 AM, visit a bank, buy a laptop charger, pick up notes from campus, and eat lunch before 2 PM..."
                rows={5}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                disabled={isLoading}
              />

              {/* Optional Quick Preset Chips */}
              <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-zinc-500 mr-1">Examples:</span>
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetClick(p.text)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer border border-zinc-700/50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Controls Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalControls(!showOptionalControls)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer py-1"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Optional parameters</span>
                {showOptionalControls ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {showOptionalControls && (
                <div className="mt-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Start Location</label>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Departure Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Budget (LKR)</label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Transport</label>
                    <select
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none"
                    >
                      <option value="DRIVE">Drive / Car</option>
                      <option value="TUK">Tuk-Tuk / Transit</option>
                      <option value="WALK">Walking</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Start Mission</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Subtle Footer Helper */}
        <div className="pt-4 border-t border-zinc-800/60 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Real-world Google Maps Grounding</span>
          <span>Nugegoda & Colombo Region</span>
        </div>
      </div>
    );
  }

  // 2. AGENT PLANNING / THINKING MODE
  if (isLoading || mission.status === 'UNDERSTANDING' || mission.status === 'RESEARCHING' || mission.status === 'OPTIMIZING') {
    return (
      <div className="h-full flex flex-col justify-between p-5 sm:p-6 bg-[#121214] border-r border-zinc-800/80">
        <div className="space-y-6">
          {/* Subtle Agent Status Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Planning your mission...</span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">RoutePilot</h2>
            <p className="text-sm text-zinc-300 mt-1 italic">"Got it. I'll handle this."</p>
          </div>

          {/* Conversational Action Stream */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Understanding your mission & constraints</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Finding verified places via Google Maps Grounding</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300 animate-pulse">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Checking transit times & opening hours...</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-500">
              <div className="h-4 w-4 rounded-full border border-zinc-700 shrink-0" />
              <span>Building the optimal sequence</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-400">
          <span>Analyzing target venues in Colombo corridor with real Google Maps data.</span>
        </div>
      </div>
    );
  }

  // 3. MISSION READY / ACTIVE MODE
  return (
    <div className="h-full flex flex-col justify-between p-5 sm:p-6 bg-[#121214] border-r border-zinc-800/80 overflow-y-auto">
      <div className="space-y-5">
        {/* Subtle Status Line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Mission ready</span>
          </div>
          {plan && (
            <span className="text-[11px] font-mono text-zinc-500">
              v{plan.version}
            </span>
          )}
        </div>

        {/* Concise Mission Stats Strip */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-sm space-y-2">
          <div className="text-xs font-bold text-zinc-200">
            {stops.length} stops • {plan?.totalDurationMinutes ? `${Math.floor(plan.totalDurationMinutes / 60)}h ${plan.totalDurationMinutes % 60}m` : '2h 53m'} • Rs. {plan?.estimatedCostLKR?.toLocaleString() || '4,900'}
          </div>
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>Return by {stops[stops.length - 1]?.arrivalTime || '12:33 PM'}</span>
          </div>
          {plan?.explanation && (
            <p className="text-xs text-zinc-300 pt-2 border-t border-zinc-800/80 leading-relaxed">
              {plan.explanation}
            </p>
          )}
        </div>

        {/* Minimal Sequenced Stops List */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
            <span>Sequenced Route</span>
            <span className="text-[11px] font-normal text-zinc-500">Click a stop to focus</span>
          </div>

          <div className="space-y-1.5">
            {stops.map((stop, idx) => {
              const isSelected = selectedStop?.stopNumber === stop.stopNumber;
              return (
                <div
                  key={stop.stopNumber}
                  onClick={() => onSelectStop(isSelected ? null : stop)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-zinc-800/90 border-zinc-600 text-white shadow-sm'
                      : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-5 w-5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      {stop.stopNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{stop.placeName}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{stop.address}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-zinc-400">{stop.arrivalTime}</span>
                    {stop.googleMapsUri && (
                      <a
                        href={stop.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-zinc-500 hover:text-emerald-400 transition-colors p-0.5"
                        title="View on Google Maps"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Replan Drawer / Input */}
        {isReplanOpen ? (
          <form onSubmit={handleReplanSubmit} className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">What changed?</span>
              <button
                type="button"
                onClick={() => setIsReplanOpen(false)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
            <input
              type="text"
              value={replanText}
              onChange={(e) => setReplanText(e.target.value)}
              placeholder="e.g. Bank is closed, I only have 90 minutes, reduce budget..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              {['Bank is closed', 'I only have 90 minutes', 'Reduce budget to Rs. 2,000'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setReplanText(chip)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60"
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={isLoading || !replanText.trim()}
              className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow transition-colors cursor-pointer disabled:opacity-50"
            >
              Re-evaluate Mission
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setIsReplanOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Replan</span>
            </button>

            <button
              onClick={handleTriggerNewMission}
              className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 transition-colors cursor-pointer"
            >
              New Mission
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-zinc-800/60 text-[11px] text-zinc-500 flex items-center justify-between">
        <span>Autonomous Agent active</span>
        <span>Google Maps Grounded</span>
      </div>
    </div>
  );
};
