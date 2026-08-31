import { parseGoalWithGemini, ParsedGoalOutput } from '../services/gemini_service.js';
import {
  HardConstraints,
  ItineraryStop,
  LocationPoint,
  MissionPlan,
  MissionTask,
  PlaceCandidate,
  PlanScore,
  RouteSegment,
  SoftConstraints,
} from '../models/types.js';
import { calculateRouteSegment } from '../services/maps_service.js';

export interface ConstraintEvaluationResult {
  isFeasible: boolean;
  violations: string[];
  totalTimeMinutes: number;
  totalCostLKR: number;
  deadlineFeasible: boolean;
  budgetFeasible: boolean;
  completedTasksCount: number;
  missingRequiredTasks: string[];
  suggestedAdjustments: string[];
}

export function evaluateMissionConstraints(
  startTime: string,
  hardConstraints: HardConstraints,
  stops: ItineraryStop[]
): ConstraintEvaluationResult {
  const violations: string[] = [];
  const suggestedAdjustments: string[] = [];

  // Calculate total time
  let totalTimeMinutes = 0;
  let totalCostLKR = 0;
  const completedTaskIds = new Set<string>();

  stops.forEach((s) => {
    totalTimeMinutes += (s.travelFromPrevMinutes || 0) + (s.durationMinutes || 0);
    totalCostLKR += s.costLKR || 0;
    if (s.taskId) completedTaskIds.add(s.taskId);
  });

  // Check duration constraint
  const durationExceeded = totalTimeMinutes > hardConstraints.maxDurationMinutes;
  if (durationExceeded) {
    violations.push(
      `Total estimated duration (${Math.round(totalTimeMinutes)} mins) exceeds time limit (${hardConstraints.maxDurationMinutes} mins)`
    );
    suggestedAdjustments.push('Increase time allowance or remove optional tasks');
  }

  // Check budget constraint
  let budgetFeasible = true;
  if (hardConstraints.maxBudgetLKR && totalCostLKR > hardConstraints.maxBudgetLKR) {
    budgetFeasible = false;
    violations.push(
      `Total estimated expenditure (Rs. ${totalCostLKR.toLocaleString()}) exceeds budget (Rs. ${hardConstraints.maxBudgetLKR.toLocaleString()})`
    );
    suggestedAdjustments.push('Select lower-cost alternatives or skip dining');
  }

  // Check required tasks
  const missingRequiredTasks: string[] = [];
  hardConstraints.requiredTasks.forEach((reqId) => {
    if (!completedTaskIds.has(reqId)) {
      missingRequiredTasks.push(reqId);
      violations.push(`Required task "${reqId}" could not be accommodated within constraints`);
    }
  });

  const isFeasible = violations.length === 0;

  return {
    isFeasible,
    violations,
    totalTimeMinutes,
    totalCostLKR,
    deadlineFeasible: !durationExceeded,
    budgetFeasible,
    completedTasksCount: completedTaskIds.size,
    missingRequiredTasks,
    suggestedAdjustments,
  };
}

export function calculatePlanScore(
  evalResult: ConstraintEvaluationResult,
  tasks: MissionTask[],
  softConstraints: SoftConstraints
): PlanScore {
  let feasibilityScore = evalResult.isFeasible ? 100 : 35;
  let deadlineScore = evalResult.deadlineFeasible ? 100 : 20;
  let budgetScore = evalResult.budgetFeasible ? 100 : 40;

  const totalRequired = tasks.filter((t) => !t.isOptional).length || 1;
  const reqTasksCompleted = tasks.filter((t) => !t.isOptional && !evalResult.missingRequiredTasks.includes(t.id)).length;
  let taskCompletionScore = Math.round((reqTasksCompleted / totalRequired) * 100);

  let efficiencyScore = 92;
  if (evalResult.totalTimeMinutes > 200) efficiencyScore = 84;
  if (evalResult.totalTimeMinutes > 260) efficiencyScore = 65;

  const totalScore = Math.round(
    feasibilityScore * 0.35 +
      deadlineScore * 0.25 +
      taskCompletionScore * 0.2 +
      efficiencyScore * 0.1 +
      budgetScore * 0.1
  );

  let scoreExplanation = '';
  if (evalResult.isFeasible) {
    scoreExplanation = `High confidence (${totalScore}/100): All ${tasks.length} tasks scheduled cleanly within deadline (${Math.round(evalResult.totalTimeMinutes)}m duration) and Rs. ${evalResult.totalCostLKR.toLocaleString()} estimated cost.`;
  } else {
    scoreExplanation = `Infeasible plan (${totalScore}/100): ${evalResult.violations.join('; ')}.`;
  }

  return {
    totalScore,
    feasibilityScore,
    deadlineScore,
    taskCompletionScore,
    efficiencyScore,
    budgetScore,
    scoreExplanation,
  };
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return (h || 9) * 60 + (m || 0);
}

function formatMinutesToTime(mins: number): string {
  const hours = Math.floor(mins / 60) % 24;
  const minutes = Math.floor(mins % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(hours)}:${pad(minutes)}`;
}

export function buildOptimizedPlan(
  version: number,
  origin: LocationPoint,
  destination: LocationPoint,
  startTimeStr: string,
  tasks: MissionTask[],
  hardConstraints: HardConstraints,
  softConstraints: SoftConstraints,
  replanReason?: string
): MissionPlan {
  const stops: ItineraryStop[] = [];
  const routeSegments: RouteSegment[] = [];

  let currentClockMins = parseTimeToMinutes(startTimeStr);
  let currentLocation = origin;
  let totalDistanceKm = 0;
  let totalCostLKR = 0;

  // 1. Origin Stop
  stops.push({
    stopNumber: 1,
    title: 'Start Mission',
    category: 'START',
    placeName: origin.name,
    address: origin.address,
    lat: origin.lat,
    lng: origin.lng,
    arrivalTime: formatMinutesToTime(currentClockMins),
    departureTime: formatMinutesToTime(currentClockMins),
    durationMinutes: 0,
    travelFromPrevMinutes: 0,
    travelDistanceKm: 0,
    costLKR: 0,
    instructions: `Depart from initial origin point at ${formatMinutesToTime(currentClockMins)}.`,
    verificationStatus: origin.verificationStatus || 'VERIFIED',
    isCompleted: true,
    googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${origin.name} ${origin.address}`)}`,
  });

  // Optimize ordering: Prioritize Banks/Campus first before afternoon closing, then Shopping, then Food
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder: Record<string, number> = {
      BANK: 1,
      EDUCATION: 2,
      SHOPPING: 3,
      FOOD: 4,
      GENERAL: 5,
    };
    return (priorityOrder[a.category] || 9) - (priorityOrder[b.category] || 9);
  });

  let stopCounter = 2;

  for (const task of sortedTasks) {
    const candidate = task.selectedPlace || task.candidatePlaces?.[0];
    if (!candidate) continue;

    // Route segment to candidate
    const route = calculateRouteSegment(
      { name: currentLocation.name, lat: currentLocation.lat, lng: currentLocation.lng },
      { name: candidate.name, lat: candidate.lat, lng: candidate.lng },
      hardConstraints.transportationMode
    );

    routeSegments.push(route);
    totalDistanceKm += route.distanceKm;

    currentClockMins += route.durationMinutes;
    const arrivalTime = formatMinutesToTime(currentClockMins);

    const taskDuration = task.estimatedDurationMinutes || 25;
    currentClockMins += taskDuration;
    const departureTime = formatMinutesToTime(currentClockMins);

    totalCostLKR += task.estimatedCostLKR || 0;

    stops.push({
      stopNumber: stopCounter++,
      taskId: task.id,
      title: task.title,
      category: task.category as any,
      placeName: candidate.name,
      address: candidate.address,
      lat: candidate.lat,
      lng: candidate.lng,
      arrivalTime,
      departureTime,
      durationMinutes: taskDuration,
      travelFromPrevMinutes: route.durationMinutes,
      travelDistanceKm: route.distanceKm,
      costLKR: task.estimatedCostLKR || 0,
      instructions: task.description || `Complete ${task.title} at ${candidate.name}.`,
      verificationStatus: candidate.verificationStatus,
      isCompleted: false,
      googleMapsUri:
        candidate.googleMapsUri ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${candidate.name} ${candidate.address}`)}`,
      groundingSources: candidate.groundingSources,
    });

    currentLocation = {
      name: candidate.name,
      address: candidate.address,
      lat: candidate.lat,
      lng: candidate.lng,
      placeId: candidate.placeId,
      verificationStatus: candidate.verificationStatus,
    };
  }

  // Final Return Home if required
  if (hardConstraints.mustReturnHome) {
    const returnRoute = calculateRouteSegment(
      { name: currentLocation.name, lat: currentLocation.lat, lng: currentLocation.lng },
      { name: destination.name, lat: destination.lat, lng: destination.lng },
      hardConstraints.transportationMode
    );
    routeSegments.push(returnRoute);
    totalDistanceKm += returnRoute.distanceKm;

    currentClockMins += returnRoute.durationMinutes;
    const returnArrival = formatMinutesToTime(currentClockMins);

    stops.push({
      stopNumber: stopCounter++,
      title: 'Mission Complete — Return Home',
      category: 'END',
      placeName: destination.name,
      address: destination.address,
      lat: destination.lat,
      lng: destination.lng,
      arrivalTime: returnArrival,
      departureTime: returnArrival,
      durationMinutes: 0,
      travelFromPrevMinutes: returnRoute.durationMinutes,
      travelDistanceKm: returnRoute.distanceKm,
      costLKR: 0,
      instructions: `Return safely to ${destination.name}. All mission errands completed.`,
      verificationStatus: 'VERIFIED',
      isCompleted: false,
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${destination.name} ${destination.address}`)}`,
    });
  }

  const startClockMins = parseTimeToMinutes(startTimeStr);
  const totalDurationMinutes = currentClockMins - startClockMins;
  const expectedFinishTime = formatMinutesToTime(currentClockMins);

  const evalResult = evaluateMissionConstraints(startTimeStr, hardConstraints, stops);
  const score = calculatePlanScore(evalResult, tasks, softConstraints);

  const decisionExplanation = evalResult.isFeasible
    ? `Plan v${version} selected by RoutePilot ADK Agent: successfully schedules ${tasks.length} errands covering ${totalDistanceKm.toFixed(1)} km, arriving home at ${expectedFinishTime} (${Math.round(totalDurationMinutes)} min duration vs ${hardConstraints.maxDurationMinutes} min limit).`
    : `Mission infeasible under current constraints: ${evalResult.violations.join('. ')}.`;

  return {
    version,
    createdAt: new Date().toISOString(),
    title: `Mission Plan v${version} (${evalResult.isFeasible ? 'Feasible' : 'Infeasible'})`,
    summary: `${tasks.length} tasks scheduled across ${stops.length} stops (${totalDistanceKm.toFixed(1)} km total travel, finishes at ${expectedFinishTime}).`,
    isFeasible: evalResult.isFeasible,
    infeasibilityReason: evalResult.isFeasible ? undefined : evalResult.violations.join(', '),
    suggestedResolutions: evalResult.suggestedAdjustments,
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalDurationMinutes,
    totalEstimatedCostLKR: totalCostLKR,
    startTime: startTimeStr,
    expectedFinishTime,
    stops,
    routeSegments,
    score,
    decisionExplanation,
    replanReason,
  };
}
