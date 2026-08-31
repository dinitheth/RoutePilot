import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Wallet,
  Compass,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Sliders,
  ShieldCheck,
  TrendingUp,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { Mission, MissionStatus } from '../types';

interface MissionControlProps {
  mission: Mission | null;
  isLoading: boolean;
  onSimulateEvent: (
    eventType: 'BANK_UNAVAILABLE' | 'DEADLINE_CUT' | 'BUDGET_CUT' | 'REMOVE_LUNCH' | 'CUSTOM',
    customText?: string
  ) => void;
  onOpenReplanModal: () => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  mission,
  isLoading,
  onSimulateEvent,
  onOpenReplanModal,
}) => {
  if (!mission) {
    return (
      <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 text-center flex flex-col items-center justify-center min-h-[280px]">
        <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-3">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-200">Autonomous Mission Control</h3>
        <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
          State machine transitions, plan scoring telemetry, and background event simulation will activate once a mission is launched.
        </p>
      </div>
    );
  }

  const plan = mission.currentPlan;
  const status = mission.status;

  const getStatusBadge = (s: MissionStatus) => {
    switch (s) {
      case 'ACTIVE':
        return { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400', label: 'ACTIVE' };
      case 'MONITORING':
        return { bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', dot: 'bg-blue-400', label: 'MONITORING' };
      case 'REPLANNING':
        return { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', dot: 'bg-amber-400 animate-ping', label: 'REPLANNING' };
      case 'UPDATED':
        return { bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300', dot: 'bg-indigo-400', label: 'PLAN UPDATED' };
      case 'BLOCKED':
        return { bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', dot: 'bg-rose-400', label: 'CONFLICT / BLOCKED' };
      case 'COMPLETED':
        return { bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400', dot: 'bg-teal-400', label: 'COMPLETED' };
      default:
        return { bg: 'bg-zinc-800 border-zinc-700 text-zinc-300', dot: 'bg-zinc-400', label: s };
    }
  };

  const badge = getStatusBadge(status);
  const totalTasks = mission.tasks.length;
  const completedTasks = mission.tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-4">
      {/* Top Header: Mission ID & State Machine Status */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-400">
              MISSION #{mission.id.split('_')[1] || mission.id}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
              v{plan?.version || 1}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Origin: {mission.origin.name} • Start: {mission.startTime}
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 text-xs font-bold font-mono ${badge.bg}`}>
          <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Phase Progression */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
          <span className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-zinc-300 animate-pulse" />
            <span>Workflow Phase: <strong className="text-zinc-100 font-mono">{mission.currentPhase}</strong></span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Google ADK Engine</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 h-2 bg-[#09090B] rounded-full overflow-hidden p-0.5 border border-zinc-800">
          {['UNDERSTAND', 'RESEARCH', 'COMPARE', 'PLAN', 'EXECUTE', 'MONITOR'].map((phase, idx) => {
            const phaseOrder = ['UNDERSTAND', 'RESEARCH', 'COMPARE', 'PLAN', 'EXECUTE', 'MONITOR'];
            const currentIdx = phaseOrder.indexOf(mission.currentPhase);
            const isPassed = currentIdx >= idx;
            const isCurrent = currentIdx === idx;

            return (
              <div
                key={phase}
                className={`h-full rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-zinc-100 shadow-sm shadow-zinc-100'
                    : isPassed
                    ? 'bg-zinc-600'
                    : 'bg-zinc-900'
                }`}
                title={phase}
              />
            );
          })}
        </div>
      </div>

      {/* Real-time KPI Stats Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#09090B] border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-400" /> Duration
          </span>
          <div className="text-xl font-bold text-zinc-100 font-mono my-1">
            {plan ? `${Math.round(plan.totalDurationMinutes)}m` : `${mission.hardConstraints.maxDurationMinutes}m`}
          </div>
          <span className="text-[10px] text-zinc-500 block truncate">
            Limit: {mission.hardConstraints.maxDurationMinutes}m
          </span>
        </div>

        <div className="bg-[#09090B] border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <Wallet className="h-3 w-3 text-emerald-400" /> Est. Cost
          </span>
          <div className="text-xl font-bold text-zinc-100 font-mono my-1">
            Rs. {(plan?.totalEstimatedCostLKR || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-500 block truncate">
            Budget: Rs. {mission.hardConstraints.maxBudgetLKR?.toLocaleString()}
          </span>
        </div>

        <div className="bg-[#09090B] border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-blue-400" /> Tasks
          </span>
          <div className="text-xl font-bold text-zinc-100 font-mono my-1">
            {totalTasks} stops
          </div>
          <span className="text-[10px] text-zinc-500 block truncate">
            {mission.hardConstraints.requiredTasks.length} required
          </span>
        </div>

        <div className="bg-[#09090B] border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-purple-400" /> Plan Score
          </span>
          <div className="text-xl font-bold text-zinc-100 font-mono my-1 flex items-baseline gap-1">
            <span>{plan?.score.totalScore || 90}</span>
            <span className="text-xs text-zinc-500 font-normal">/100</span>
          </div>
          <span className="text-[10px] text-emerald-400 block truncate font-medium">
            {plan?.isFeasible ? 'Feasible Plan' : 'Infeasible Conflict'}
          </span>
        </div>
      </div>

      {/* Plan Decision & Scoring Telemetry */}
      {plan && (
        <div className="bg-[#09090B] border border-zinc-800 rounded-2xl p-4 text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Transparent Decision Telemetry</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              ETA Finish: <strong className="text-zinc-100">{plan.expectedFinishTime}</strong>
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {plan.decisionExplanation}
          </p>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 font-mono text-[11px]">
            <div className="flex justify-between px-2.5 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
              <span className="text-zinc-400">Feasibility:</span>
              <span className="text-emerald-400 font-bold">{plan.score.feasibilityScore}%</span>
            </div>
            <div className="flex justify-between px-2.5 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
              <span className="text-zinc-400">Deadline:</span>
              <span className="text-zinc-200 font-bold">{plan.score.deadlineScore}%</span>
            </div>
            <div className="flex justify-between px-2.5 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
              <span className="text-zinc-400">Task Match:</span>
              <span className="text-blue-400 font-bold">{plan.score.taskCompletionScore}%</span>
            </div>
            <div className="flex justify-between px-2.5 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
              <span className="text-zinc-400">Efficiency:</span>
              <span className="text-purple-400 font-bold">{plan.score.efficiencyScore}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Background Event Injector & Quick Actions */}
      <div className="border-t border-zinc-800/80 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Simulate Real-World Friction / Event</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Autonomous Replan</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => onSimulateEvent('BANK_UNAVAILABLE')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#09090B] hover:bg-zinc-800/60 text-amber-400 border border-zinc-800 hover:border-zinc-700 text-left transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold block text-xs">Bank Branch Closes</span>
              <span className="text-[11px] text-zinc-400">Triggers auto-reroute to alt bank</span>
            </div>
            <RefreshCw className="h-3.5 w-3.5 text-zinc-500 group-hover:text-amber-400 transition-transform group-hover:rotate-180" />
          </button>

          <button
            type="button"
            onClick={() => onSimulateEvent('DEADLINE_CUT')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#09090B] hover:bg-zinc-800/60 text-rose-400 border border-zinc-800 hover:border-zinc-700 text-left transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold block text-xs">Time Cut to 90 mins</span>
              <span className="text-[11px] text-zinc-400">Forces urgent re-optimization</span>
            </div>
            <Clock className="h-3.5 w-3.5 text-zinc-500 group-hover:text-rose-400" />
          </button>

          <button
            type="button"
            onClick={() => onSimulateEvent('BUDGET_CUT')}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-[#09090B] hover:bg-zinc-800/60 text-emerald-400 border border-zinc-800 hover:border-zinc-700 text-left transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold block text-xs">Budget Cut (Rs. 2,000)</span>
              <span className="text-[11px] text-zinc-400">Re-evaluates affordable stops</span>
            </div>
            <Wallet className="h-3.5 w-3.5 text-zinc-500 group-hover:text-emerald-400" />
          </button>

          <button
            type="button"
            onClick={onOpenReplanModal}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 text-left transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold block text-xs">Custom Replan...</span>
              <span className="text-[11px] text-zinc-400">Adjust tasks, transport, or time</span>
            </div>
            <Sliders className="h-3.5 w-3.5 text-zinc-300 group-hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
};
