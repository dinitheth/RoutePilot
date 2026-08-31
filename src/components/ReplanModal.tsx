import React, { useState } from 'react';
import {
  Sliders,
  X,
  Clock,
  Wallet,
  Car,
  CheckCircle2,
  Sparkles,
  Send,
  RefreshCw,
} from 'lucide-react';
import { Mission, TransportationMode } from '../types';

interface ReplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  onReplan: (
    eventDescription: string,
    affectedCategoryOrTaskId?: string,
    constraintOverrides?: any
  ) => void;
}

export const ReplanModal: React.FC<ReplanModalProps> = ({
  isOpen,
  onClose,
  mission,
  onReplan,
}) => {
  if (!isOpen || !mission) return null;

  const [customText, setCustomText] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(
    mission.hardConstraints.maxDurationMinutes
  );
  const [budgetLKR, setBudgetLKR] = useState(
    mission.hardConstraints.maxBudgetLKR || 5000
  );
  const [transportMode, setTransportMode] = useState<TransportationMode>(
    mission.hardConstraints.transportationMode
  );
  const [removeLunch, setRemoveLunch] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventDescription =
      customText.trim() ||
      `User adjusted constraints: Time ${durationMinutes}m, Budget Rs. ${budgetLKR.toLocaleString()}, Transport ${transportMode}${
        removeLunch ? ', Remove lunch' : ''
      }`;

    const overrides: any = {
      maxDurationMinutes: durationMinutes,
      maxBudgetLKR: budgetLKR,
      transportationMode: transportMode,
    };
    if (removeLunch) overrides.removeTaskId = 'FOOD';

    onReplan(eventDescription, undefined, overrides);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 shadow-2xl max-w-lg w-full flex flex-col gap-5 text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <Sliders className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Re-Plan Mission</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Freeform Re-plan Request
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={2}
              className="w-full rounded-2xl bg-[#09090B] border border-zinc-800 p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none font-sans"
              placeholder="e.g. I only have 90 minutes now, remove lunch and find the fastest route back."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Duration (Minutes)
              </label>
              <input
                type="number"
                min="30"
                max="720"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full bg-[#09090B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" /> Budget (LKR)
              </label>
              <input
                type="number"
                step="500"
                value={budgetLKR}
                onChange={(e) => setBudgetLKR(parseInt(e.target.value, 10))}
                className="w-full bg-[#09090B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 font-medium mb-1.5">
                <Car className="h-3.5 w-3.5 text-purple-400" /> Transport
              </label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as TransportationMode)}
                className="w-full bg-[#09090B] border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="DRIVING">Driving (Car/Van)</option>
                <option value="WALKING">Walking</option>
                <option value="TRANSIT">Public Transit / Bus</option>
                <option value="BICYCLING">Bicycle</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={removeLunch}
                  onChange={(e) => setRemoveLunch(e.target.checked)}
                  className="rounded bg-[#09090B] border-zinc-700 text-zinc-100 focus:ring-zinc-400 h-4 w-4"
                />
                <span>Skip Optional Lunch</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Execute Autonomous Re-Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
