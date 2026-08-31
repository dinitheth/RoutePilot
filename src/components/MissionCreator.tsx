import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  SlidersHorizontal,
  Clock,
  Wallet,
  Car,
  MapPin,
  AlertTriangle,
  Flame,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { TransportationMode } from '../types';

interface MissionCreatorProps {
  isLoading: boolean;
  onSubmit: (prompt: string) => void;
  onSelectQuickDemo: (demoId: string) => void;
}

export const MissionCreator: React.FC<MissionCreatorProps> = ({
  isLoading,
  onSubmit,
  onSelectQuickDemo,
}) => {
  const [prompt, setPrompt] = useState(
    "I'm starting from Nugegoda at 9:30 AM. I have Rs. 5,000 and 4 hours. I need to visit a bank, buy a laptop charger, collect a document from campus, have lunch, and return home before 2 PM."
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [origin, setOrigin] = useState('Nugegoda');
  const [startTime, setStartTime] = useState('09:30');
  const [durationHours, setDurationHours] = useState('4');
  const [budgetLKR, setBudgetLKR] = useState('5000');
  const [transport, setTransport] = useState<TransportationMode>('DRIVING');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt);
  };

  const handleApplyAdvancedToPrompt = () => {
    const updated = `I'm starting from ${origin} at ${startTime}. I have Rs. ${parseInt(budgetLKR || '0').toLocaleString()} and ${durationHours} hours using ${transport.toLowerCase()}. ${prompt}`;
    setPrompt(updated);
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-4">
      {/* Title & Concept */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <span>Mission Objective</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Give RoutePilot a messy real-world chore. The agent parses goals, queries Google Maps, evaluates constraints, and generates an executable plan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1.5 font-medium ${
            showAdvanced
              ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
              : 'bg-[#09090B] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Constraints</span>
        </button>
      </div>

      {/* Main Prompt Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            rows={4}
            className="w-full rounded-2xl bg-[#09090B] border border-zinc-800 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 resize-none font-sans leading-relaxed transition-all"
            placeholder="e.g. I need to leave Nugegoda at 9:30 AM, visit a bank, buy a laptop charger at Unity Plaza, grab documents from USJ campus, eat lunch, and return home before 2 PM with Rs. 5000 budget."
          />
        </div>

        {/* Optional Structured Constraints Drawer */}
        {showAdvanced && (
          <div className="bg-[#09090B] border border-zinc-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <MapPin className="h-3 w-3 text-rose-400" /> Origin
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <Clock className="h-3 w-3 text-blue-400" /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <Clock className="h-3 w-3 text-amber-400" /> Duration (Hours)
              </label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <Wallet className="h-3 w-3 text-emerald-400" /> Budget (LKR)
              </label>
              <input
                type="number"
                step="500"
                value={budgetLKR}
                onChange={(e) => setBudgetLKR(e.target.value)}
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <Car className="h-3 w-3 text-purple-400" /> Transport Mode
              </label>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as TransportationMode)}
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                <option value="DRIVING">Driving</option>
                <option value="WALKING">Walking</option>
                <option value="TRANSIT">Public Transit</option>
                <option value="BICYCLING">Bicycle</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyAdvancedToPrompt}
                className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl border border-zinc-700 transition-colors"
              >
                Sync to Prompt
              </button>
            </div>
          </div>
        )}

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full py-3.5 px-5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Compass className="h-4 w-4 animate-spin text-zinc-950" />
              <span>RoutePilot Agent Planning Mission...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 text-zinc-950" />
              <span>Launch Autonomous Mission</span>
            </>
          )}
        </button>
      </form>

      {/* Flagship Hackathon Quick Demos in Bento Grid */}
      <div className="border-t border-zinc-800/80 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Official Hackathon Scenarios</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">1-Click Test</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Demo 1: Main Sri Lanka Mission */}
          <button
            type="button"
            onClick={() => onSelectQuickDemo('sri_lanka_main')}
            disabled={isLoading}
            className="text-left p-3.5 rounded-2xl bg-[#09090B] hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-100 group-hover:text-white">
                1. Flagship Errand
              </span>
              <ArrowRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2">
              Nugegoda: Bank + Charger + Campus doc + Lunch before 2 PM.
            </p>
          </button>

          {/* Demo 2: Autonomous Replan Bank Closure */}
          <button
            type="button"
            onClick={() => onSelectQuickDemo('bank_replan')}
            disabled={isLoading}
            className="text-left p-3.5 rounded-2xl bg-[#09090B] hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                2. Auto Replan
              </span>
              <ArrowRight className="h-3 w-3 text-zinc-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2">
              Simulate bank branch closure & autonomous route replacement.
            </p>
          </button>

          {/* Demo 3: Impossible Mission */}
          <button
            type="button"
            onClick={() => onSelectQuickDemo('impossible_mission')}
            disabled={isLoading}
            className="text-left p-3.5 rounded-2xl bg-[#09090B] hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 group-hover:text-rose-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                <span>3. Infeasible Test</span>
              </span>
              <ArrowRight className="h-3 w-3 text-zinc-500 group-hover:text-rose-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2">
              5 distant stops in 45 min — detects conflict without hallucinations.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
