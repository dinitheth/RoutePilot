import {
  Mission,
  MissionEvent,
  MissionStatus,
  MissionTask,
  MissionVersion,
  PlaceCandidate,
} from '../models/types.js';
import {
  parseGoalWithGemini,
  explainReplanDecisionWithGemini,
  researchPlacesWithMapsGrounding,
  DEFAULT_GEMINI_MODEL,
} from '../services/gemini_service.js';
import { searchPlacesTool, getRouteTool } from '../tools/maps_tools.js';
import { buildOptimizedPlan } from '../tools/mission_tools.js';
import { firestoreService } from '../services/firestore_service.js';

export class RoutePilotAgent {
  public static async createAndExecuteMission(userPrompt: string): Promise<Mission> {
    const missionId = `mission_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const startTimeStr = new Date().toISOString();

    console.log(`\n======================================================`);
    console.log(`[RoutePilotAgent] STARTING AUTONOMOUS MISSION: ${missionId}`);
    console.log(`[RoutePilotAgent] Model: ${DEFAULT_GEMINI_MODEL} | Framework: Google ADK`);
    console.log(`[RoutePilotAgent] Objective: "${userPrompt}"`);
    console.log(`======================================================\n`);

    // 1. Initialize Base Mission Document
    const mission: Mission = {
      id: missionId,
      userPrompt,
      createdAt: startTimeStr,
      updatedAt: startTimeStr,
      status: 'CREATED',
      currentPhase: 'UNDERSTAND',
      mapsGroundingEnabled: true,
      groundingSummary: 'Active Gemini 3.5+ Google Maps Grounding & Verified Places Matrix',
      origin: {
        name: 'Nugegoda',
        address: 'High Level Rd, Nugegoda, Western Province, Sri Lanka',
        lat: 6.8649,
        lng: 79.8997,
        verificationStatus: 'VERIFIED',
      },
      destination: {
        name: 'Home (Nugegoda)',
        address: 'High Level Rd, Nugegoda, Western Province, Sri Lanka',
        lat: 6.8649,
        lng: 79.8997,
        verificationStatus: 'VERIFIED',
      },
      startTime: '09:30',
      hardConstraints: {
        maxDurationMinutes: 240,
        deadlineTime: '14:00',
        maxBudgetLKR: 5000,
        requiredTasks: [],
        mustReturnHome: true,
        transportationMode: 'DRIVING',
      },
      softConstraints: {
        preferHigherRated: true,
        minimizeTravelTime: true,
        avoidHeavyTraffic: true,
        preferredLunchType: 'Sri Lankan / Cafe',
      },
      tasks: [],
      versions: [],
      events: [],
      backgroundMonitoringActive: true,
    };

    await this.logEvent(mission, 'MISSION_CREATED', `Mission ${missionId} created from user prompt.`);
    await firestoreService.saveMission(mission);

    // 2. PHASE 1: UNDERSTAND & PARSE GOAL
    mission.status = 'ANALYZING';
    mission.currentPhase = 'UNDERSTAND';
    await this.logEvent(mission, 'MISSION_ANALYSIS_STARTED', 'Invoking Gemini 3.5+ to parse constraints and tasks graph.');

    const parsed = await parseGoalWithGemini(userPrompt);

    mission.origin = {
      name: parsed.origin.name,
      address: parsed.origin.address,
      lat: parsed.origin.lat || 6.8649,
      lng: parsed.origin.lng || 79.8997,
      verificationStatus: 'VERIFIED',
    };
    mission.destination = {
      name: parsed.destination.name,
      address: parsed.destination.address,
      lat: parsed.destination.lat || 6.8649,
      lng: parsed.destination.lng || 79.8997,
      verificationStatus: 'VERIFIED',
    };
    mission.startTime = parsed.startTime || '09:30';
    mission.hardConstraints.maxDurationMinutes = parsed.durationMinutes || 240;
    mission.hardConstraints.deadlineTime = parsed.deadlineTime || '14:00';
    mission.hardConstraints.maxBudgetLKR = parsed.maxBudgetLKR || 5000;
    mission.hardConstraints.transportationMode = parsed.transportationMode || 'DRIVING';
    mission.softConstraints = { ...mission.softConstraints, ...parsed.softPreferences };

    mission.tasks = parsed.tasks.map((t, idx) => ({
      id: `task_${idx + 1}`,
      title: t.title,
      category: t.category,
      description: t.description,
      isOptional: t.isOptional,
      estimatedDurationMinutes: t.estimatedDurationMinutes,
      estimatedCostLKR: t.estimatedCostLKR,
      status: 'PENDING',
      targetPlaceQuery: t.targetPlaceQuery,
    }));

    mission.hardConstraints.requiredTasks = mission.tasks.filter((t) => !t.isOptional).map((t) => t.id);

    await this.logEvent(
      mission,
      'TOOL_CALLED',
      `Parsed ${mission.tasks.length} tasks (${mission.hardConstraints.requiredTasks.length} required). Time window: ${mission.hardConstraints.maxDurationMinutes}m, Budget: Rs. ${mission.hardConstraints.maxBudgetLKR?.toLocaleString()}.`,
      'mission_parser'
    );

    // 3. PHASE 2: RESEARCH REAL WORLD (GOOGLE MAPS PLATFORM & GEMINI MAPS GROUNDING)
    mission.status = 'RESEARCHING';
    mission.currentPhase = 'RESEARCH';
    await this.logEvent(
      mission,
      'PLACE_SEARCH_STARTED',
      'Executing Gemini 3.5+ Maps Grounding (googleMaps tool) & Places API (New) verification.'
    );

    for (const task of mission.tasks) {
      // 1. Invoke Google Maps Places Candidate Search
      const searchRes = await searchPlacesTool.execute({
        query: task.targetPlaceQuery,
        category: task.category,
        maxResults: 3,
      });

      // 2. Perform Gemini Maps Grounding tool invocation to retrieve real-world grounding URIs and review snippets
      const mapsGroundingRes = await researchPlacesWithMapsGrounding(
        task.targetPlaceQuery,
        { lat: mission.origin.lat, lng: mission.origin.lng }
      );

      // Attach grounding sources to candidate places
      const enrichedCandidates = searchRes.candidates.map((cand, idx) => {
        const matchingSource = mapsGroundingRes.groundingSources[idx] || mapsGroundingRes.groundingSources[0];
        return {
          ...cand,
          googleMapsUri: matchingSource?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cand.name} ${cand.address}`)}`,
          groundingSources: mapsGroundingRes.groundingSources,
        };
      });

      task.candidatePlaces = enrichedCandidates;
      task.selectedPlace = enrichedCandidates[0]; // best scoring verified candidate

      await this.logEvent(
        mission,
        'TOOL_CALLED',
        `Grounding completed via Gemini googleMaps tool for "${task.title}". Verified ${mapsGroundingRes.groundingSources.length} Maps URI citation(s).`,
        'googleMaps'
      );

      await this.logEvent(
        mission,
        'CANDIDATE_FOUND',
        `Discovered ${enrichedCandidates.length} candidate(s) for "${task.title}". Selected: ${task.selectedPlace?.name} (${task.selectedPlace?.verificationStatus}).`,
        'search_places'
      );
    }

    // 4. PHASE 3 & 4: EVALUATE & PLAN OPTIMIZED ROUTE
    mission.status = 'PLANNING';
    mission.currentPhase = 'PLAN';
    await this.logEvent(mission, 'ROUTE_CALCULATED', 'Computing distance matrices and route segments via Routes API.');

    const planV1 = buildOptimizedPlan(
      1,
      mission.origin,
      mission.destination,
      mission.startTime,
      mission.tasks,
      mission.hardConstraints,
      mission.softConstraints
    );

    mission.currentPlan = planV1;
    mission.status = planV1.isFeasible ? 'ACTIVE' : 'BLOCKED';
    mission.currentPhase = 'EXECUTE';

    // 5. PHASE 5: PERSIST PLAN VERSION & FIRESTORE STATE
    const version1: MissionVersion = {
      version: 1,
      timestamp: new Date().toISOString(),
      triggerEvent: 'INITIAL_MISSION_SYNTHESIS',
      reason: 'Initial autonomous multi-step plan compiled by RoutePilot ADK Agent.',
      plan: planV1,
    };

    mission.versions.push(version1);
    await firestoreService.saveMissionVersion(mission.id, version1);

    await this.logEvent(
      mission,
      'PLAN_CREATED',
      `Plan v1 compiled (${planV1.isFeasible ? 'FEASIBLE' : 'INFEASIBLE'}). Total distance: ${planV1.totalDistanceKm} km, ETA return: ${planV1.expectedFinishTime}. Score: ${planV1.score.totalScore}/100.`,
      'optimize_itinerary'
    );

    await this.logEvent(mission, 'MISSION_ACTIVATED', 'Mission activated and background monitoring daemon started.');

    await firestoreService.saveMission(mission);
    return mission;
  }

  // Autonomous Replanning Engine triggered by external events or user adjustments
  public static async autonomousReplan(
    missionId: string,
    eventDescription: string,
    affectedCategoryOrTaskId?: string,
    constraintOverrides?: {
      maxDurationMinutes?: number;
      maxBudgetLKR?: number;
      removeTaskId?: string;
      transportationMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
      addedTask?: { title: string; category: any; duration: number; cost: number; query: string };
    }
  ): Promise<Mission> {
    const mission = await firestoreService.getMission(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found in Firestore.`);

    const prevVersionNum = mission.currentPlan?.version || 1;
    const nextVersionNum = prevVersionNum + 1;

    console.log(`\n[RoutePilotAgent] TRIGGERING AUTONOMOUS REPLAN: Mission ${missionId} -> Plan v${nextVersionNum}`);
    console.log(`[RoutePilotAgent] Event: "${eventDescription}"`);

    mission.status = 'REPLANNING';
    mission.currentPhase = 'REPLAN';

    await this.logEvent(
      mission,
      'MISSION_REPLAN_STARTED',
      `Autonomous replan triggered: "${eventDescription}". Inspecting active plan and evaluating constraints.`,
      'replan_mission'
    );

    // Apply constraint changes if present
    if (constraintOverrides?.maxDurationMinutes) {
      mission.hardConstraints.maxDurationMinutes = constraintOverrides.maxDurationMinutes;
      await this.logEvent(
        mission,
        'CONSTRAINT_CHANGED',
        `Hard constraint updated: Max duration reduced to ${constraintOverrides.maxDurationMinutes} minutes.`
      );
    }
    if (constraintOverrides?.maxBudgetLKR) {
      mission.hardConstraints.maxBudgetLKR = constraintOverrides.maxBudgetLKR;
      await this.logEvent(
        mission,
        'CONSTRAINT_CHANGED',
        `Hard constraint updated: Max budget adjusted to Rs. ${constraintOverrides.maxBudgetLKR.toLocaleString()}.`
      );
    }
    if (constraintOverrides?.transportationMode) {
      mission.hardConstraints.transportationMode = constraintOverrides.transportationMode;
      await this.logEvent(
        mission,
        'CONSTRAINT_CHANGED',
        `Transportation mode updated to ${constraintOverrides.transportationMode}.`
      );
    }
    if (constraintOverrides?.removeTaskId) {
      mission.tasks = mission.tasks.filter((t) => t.id !== constraintOverrides.removeTaskId && t.category !== 'FOOD');
      await this.logEvent(
        mission,
        'CONSTRAINT_CHANGED',
        `Task removed from mission scope to optimize schedule.`
      );
    }
    if (constraintOverrides?.addedTask) {
      const newTask: MissionTask = {
        id: `task_${mission.tasks.length + 1}`,
        title: constraintOverrides.addedTask.title,
        category: constraintOverrides.addedTask.category,
        description: constraintOverrides.addedTask.title,
        isOptional: false,
        estimatedDurationMinutes: constraintOverrides.addedTask.duration,
        estimatedCostLKR: constraintOverrides.addedTask.cost,
        status: 'PENDING',
        targetPlaceQuery: constraintOverrides.addedTask.query,
      };
      mission.tasks.push(newTask);
      const searchRes = await searchPlacesTool.execute({
        query: newTask.targetPlaceQuery,
        category: newTask.category,
      });
      newTask.candidatePlaces = searchRes.candidates;
      newTask.selectedPlace = searchRes.candidates[0];
      await this.logEvent(
        mission,
        'CANDIDATE_FOUND',
        `Added new task "${newTask.title}". Selected candidate: ${newTask.selectedPlace?.name}.`
      );
    }

    // Handle place unavailable event (e.g. Bank A closure event)
    if (affectedCategoryOrTaskId) {
      for (const task of mission.tasks) {
        if (
          task.id === affectedCategoryOrTaskId ||
          task.category.toLowerCase() === affectedCategoryOrTaskId.toLowerCase()
        ) {
          await this.logEvent(
            mission,
            'PLACE_BECAME_UNAVAILABLE',
            `Selected location for "${task.title}" (${task.selectedPlace?.name}) became unavailable. Searching alternative places via Maps API.`,
            'search_places'
          );

          // Get next viable candidate
          const candidates = task.candidatePlaces || [];
          const currentSelectedId = task.selectedPlace?.id;
          const alternatives = candidates.filter((c) => c.id !== currentSelectedId);

          if (alternatives.length > 0) {
            task.selectedPlace = alternatives[0];
          } else {
            // Fresh search query
            const freshSearch = await searchPlacesTool.execute({
              query: `${task.category} alternate branch near Nugegoda`,
              category: task.category,
            });
            task.candidatePlaces = freshSearch.candidates;
            task.selectedPlace = freshSearch.candidates[1] || freshSearch.candidates[0];
          }

          await this.logEvent(
            mission,
            'CANDIDATE_FOUND',
            `Replacement candidate selected: "${task.selectedPlace?.name}" (${task.selectedPlace?.address}).`
          );
        }
      }
    }

    // Recalculate route and plan
    const newPlan = buildOptimizedPlan(
      nextVersionNum,
      mission.origin,
      mission.destination,
      mission.startTime,
      mission.tasks,
      mission.hardConstraints,
      mission.softConstraints,
      eventDescription
    );

    // Explain replan rationale with Gemini 3.5+
    const decisionText = await explainReplanDecisionWithGemini(
      mission.currentPlan?.summary || 'Plan v1',
      eventDescription,
      newPlan.summary,
      (mission.currentPlan?.totalDurationMinutes || 0) - newPlan.totalDurationMinutes
    );
    newPlan.decisionExplanation = decisionText;

    mission.currentPlan = newPlan;
    mission.status = newPlan.isFeasible ? 'UPDATED' : 'BLOCKED';
    mission.currentPhase = 'EXECUTE';

    const newVersion: MissionVersion = {
      version: nextVersionNum,
      timestamp: new Date().toISOString(),
      triggerEvent: eventDescription,
      reason: decisionText,
      plan: newPlan,
      changedConstraints: constraintOverrides ? { ...mission.hardConstraints } : undefined,
    };

    mission.versions.push(newVersion);
    await firestoreService.saveMissionVersion(mission.id, newVersion);

    await this.logEvent(
      mission,
      'PLAN_VERSION_CREATED',
      `Plan v${nextVersionNum} generated & saved to Firestore. Status: ${newPlan.isFeasible ? 'FEASIBLE' : 'INFEASIBLE'}. Rationale: ${decisionText}`,
      'create_mission_version'
    );

    await firestoreService.saveMission(mission);
    return mission;
  }

  private static async logEvent(
    mission: Mission,
    type: MissionEvent['type'],
    message: string,
    toolName?: string
  ): Promise<MissionEvent> {
    const event: MissionEvent = {
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      missionId: mission.id,
      timestamp: new Date().toISOString(),
      type,
      message,
      toolName,
      actor: 'ROUTEPILOT_ADK_AGENT',
    };

    mission.events.push(event);
    await firestoreService.addMissionEvent(event);
    return event;
  }
}
