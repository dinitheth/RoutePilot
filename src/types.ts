export type VerificationStatus = 'VERIFIED' | 'ESTIMATE' | 'NOT_VERIFIED' | 'UNAVAILABLE';

export type MissionStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'RESEARCHING'
  | 'EVALUATING'
  | 'PLANNING'
  | 'READY'
  | 'ACTIVE'
  | 'MONITORING'
  | 'REPLANNING'
  | 'UPDATED'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'FAILED'
  | 'CANCELLED';

export type TransportationMode = 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';

export interface LocationPoint {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  source?: string;
  verificationStatus: VerificationStatus;
}

export interface HardConstraints {
  maxDurationMinutes: number;
  deadlineTime?: string;
  maxBudgetLKR?: number;
  requiredTasks: string[];
  mustReturnHome: boolean;
  transportationMode: TransportationMode;
}

export interface SoftConstraints {
  preferHigherRated: boolean;
  minimizeTravelTime: boolean;
  avoidHeavyTraffic: boolean;
  preferredLunchType?: string;
  preferredStores?: string[];
}

export interface MissionTask {
  id: string;
  title: string;
  category: 'BANK' | 'SHOPPING' | 'EDUCATION' | 'FOOD' | 'COMMUTE' | 'GENERAL';
  description: string;
  isOptional: boolean;
  estimatedDurationMinutes: number;
  estimatedCostLKR: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  targetPlaceQuery: string;
  selectedPlace?: PlaceCandidate;
  candidatePlaces?: PlaceCandidate[];
}

export interface PlaceCandidate {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  category: string;
  rating?: number;
  userRatingsTotal?: number;
  isOpenNow?: boolean;
  openingHoursText?: string;
  priceLevel?: number;
  distanceFromPrevKm?: number;
  travelMinutesFromPrev?: number;
  source: 'GOOGLE_PLACES_NEW' | 'GOOGLE_MAPS_GEOCODE' | 'VERIFIED_REGIONAL_DATABASE' | 'GEMINI_MAPS_GROUNDING';
  verificationStatus: VerificationStatus;
  notes?: string;
  googleMapsUri?: string;
  groundingSources?: Array<{ title?: string; uri?: string; snippet?: string }>;
}

export interface RouteSegment {
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
  steps: string[];
  trafficCondition: 'LIGHT' | 'MODERATE' | 'HEAVY';
  source: 'GOOGLE_ROUTES_API' | 'ESTIMATED_TRAFFIC_MATRIX';
  verificationStatus: VerificationStatus;
}

export interface ItineraryStop {
  stopNumber: number;
  taskId?: string;
  title: string;
  category: 'START' | 'BANK' | 'SHOPPING' | 'EDUCATION' | 'FOOD' | 'COMMUTE' | 'END';
  placeName: string;
  address: string;
  lat: number;
  lng: number;
  arrivalTime: string;
  departureTime: string;
  durationMinutes: number;
  travelFromPrevMinutes: number;
  travelDistanceKm: number;
  costLKR: number;
  instructions: string;
  verificationStatus: VerificationStatus;
  isCompleted: boolean;
  wasModifiedInReplan?: boolean;
  googleMapsUri?: string;
  groundingSources?: Array<{ title?: string; uri?: string; snippet?: string }>;
}

export interface PlanScore {
  totalScore: number;
  feasibilityScore: number;
  deadlineScore: number;
  taskCompletionScore: number;
  efficiencyScore: number;
  budgetScore: number;
  scoreExplanation: string;
}

export interface MissionPlan {
  version: number;
  createdAt: string;
  title: string;
  summary: string;
  isFeasible: boolean;
  infeasibilityReason?: string;
  suggestedResolutions?: string[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalEstimatedCostLKR: number;
  startTime: string;
  expectedFinishTime: string;
  stops: ItineraryStop[];
  routeSegments: RouteSegment[];
  score: PlanScore;
  decisionExplanation: string;
  replanReason?: string;
}

export interface MissionEvent {
  id: string;
  missionId: string;
  timestamp: string;
  type:
    | 'MISSION_CREATED'
    | 'MISSION_ANALYSIS_STARTED'
    | 'PLACE_SEARCH_STARTED'
    | 'CANDIDATE_FOUND'
    | 'ROUTE_CALCULATED'
    | 'PLAN_CREATED'
    | 'MISSION_ACTIVATED'
    | 'MONITORING_TICK'
    | 'EXTERNAL_EVENT_DETECTED'
    | 'CONSTRAINT_CHANGED'
    | 'PLACE_BECAME_UNAVAILABLE'
    | 'MISSION_REPLAN_STARTED'
    | 'PLAN_VERSION_CREATED'
    | 'MISSION_COMPLETED'
    | 'MISSION_BLOCKED'
    | 'TOOL_CALLED';
  message: string;
  toolName?: string;
  toolDurationMs?: number;
  payload?: any;
  actor: 'ROUTEPILOT_ADK_AGENT' | 'BACKGROUND_ENGINE' | 'USER' | 'GOOGLE_MAPS';
}

export interface MissionVersion {
  version: number;
  timestamp: string;
  triggerEvent: string;
  reason: string;
  plan: MissionPlan;
  changedConstraints?: Partial<HardConstraints>;
  affectedTaskIds?: string[];
}

export interface Mission {
  id: string;
  userPrompt: string;
  createdAt: string;
  updatedAt: string;
  status: MissionStatus;
  currentPhase: 'UNDERSTAND' | 'RESEARCH' | 'COMPARE' | 'PLAN' | 'PERSIST' | 'EXECUTE' | 'MONITOR' | 'REPLAN';
  origin: LocationPoint;
  destination: LocationPoint;
  startTime: string;
  hardConstraints: HardConstraints;
  softConstraints: SoftConstraints;
  tasks: MissionTask[];
  currentPlan?: MissionPlan;
  versions: MissionVersion[];
  events: MissionEvent[];
  backgroundMonitoringActive: boolean;
  lastMonitoredAt?: string;
  mapsGroundingEnabled?: boolean;
  groundingSummary?: string;
}
