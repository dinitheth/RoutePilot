import fs from 'fs';
import path from 'path';
import { Mission, MissionEvent, MissionVersion, AgentRunLog } from '../models/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const MISSIONS_FILE = path.join(DATA_DIR, 'missions.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');
const RUNS_FILE = path.join(DATA_DIR, 'runs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory Firestore cache synchronized with filesystem
class FirestoreDatabaseService {
  private missions: Map<string, Mission> = new Map();
  private events: Map<string, MissionEvent[]> = new Map();
  private versions: Map<string, MissionVersion[]> = new Map();
  private runs: Map<string, AgentRunLog[]> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(MISSIONS_FILE)) {
        const raw = fs.readFileSync(MISSIONS_FILE, 'utf-8');
        const data: Mission[] = JSON.parse(raw);
        data.forEach((m) => this.missions.set(m.id, m));
      }
      if (fs.existsSync(EVENTS_FILE)) {
        const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
        const data: Record<string, MissionEvent[]> = JSON.parse(raw);
        Object.entries(data).forEach(([mId, evts]) => this.events.set(mId, evts));
      }
      if (fs.existsSync(VERSIONS_FILE)) {
        const raw = fs.readFileSync(VERSIONS_FILE, 'utf-8');
        const data: Record<string, MissionVersion[]> = JSON.parse(raw);
        Object.entries(data).forEach(([mId, vList]) => this.versions.set(mId, vList));
      }
      if (fs.existsSync(RUNS_FILE)) {
        const raw = fs.readFileSync(RUNS_FILE, 'utf-8');
        const data: Record<string, AgentRunLog[]> = JSON.parse(raw);
        Object.entries(data).forEach(([mId, rList]) => this.runs.set(mId, rList));
      }
    } catch (err) {
      console.warn('[FirestoreService] Disk load warning:', err);
    }
  }

  private saveToDisk() {
    try {
      const missionsArr = Array.from(this.missions.values());
      fs.writeFileSync(MISSIONS_FILE, JSON.stringify(missionsArr, null, 2), 'utf-8');

      const eventsObj: Record<string, MissionEvent[]> = {};
      this.events.forEach((v, k) => (eventsObj[k] = v));
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsObj, null, 2), 'utf-8');

      const versionsObj: Record<string, MissionVersion[]> = {};
      this.versions.forEach((v, k) => (versionsObj[k] = v));
      fs.writeFileSync(VERSIONS_FILE, JSON.stringify(versionsObj, null, 2), 'utf-8');

      const runsObj: Record<string, AgentRunLog[]> = {};
      this.runs.forEach((v, k) => (runsObj[k] = v));
      fs.writeFileSync(RUNS_FILE, JSON.stringify(runsObj, null, 2), 'utf-8');
    } catch (err) {
      console.error('[FirestoreService] Disk write error:', err);
    }
  }

  public async saveMission(mission: Mission): Promise<void> {
    this.missions.set(mission.id, { ...mission, updatedAt: new Date().toISOString() });
    this.saveToDisk();
    console.log(`[Firestore] Document saved: missions/${mission.id} (Status: ${mission.status}, Plan v${mission.currentPlan?.version || 1})`);
  }

  public async getMission(id: string): Promise<Mission | null> {
    return this.missions.get(id) || null;
  }

  public async listMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async addMissionEvent(event: MissionEvent): Promise<void> {
    const list = this.events.get(event.missionId) || [];
    list.push(event);
    this.events.set(event.missionId, list);

    // Also update mission internal event log
    const m = this.missions.get(event.missionId);
    if (m) {
      m.events = list;
      m.updatedAt = new Date().toISOString();
    }

    this.saveToDisk();
    console.log(`[Firestore] Event appended: missionEvents/${event.id} -> [${event.type}] ${event.message}`);
  }

  public async getMissionEvents(missionId: string): Promise<MissionEvent[]> {
    return this.events.get(missionId) || [];
  }

  public async saveMissionVersion(missionId: string, version: MissionVersion): Promise<void> {
    const list = this.versions.get(missionId) || [];
    list.push(version);
    this.versions.set(missionId, list);

    const m = this.missions.get(missionId);
    if (m) {
      m.versions = list;
      m.updatedAt = new Date().toISOString();
    }

    this.saveToDisk();
    console.log(`[Firestore] Version stored: missionVersions/${missionId}/v${version.version} ("${version.reason}")`);
  }

  public async getMissionVersions(missionId: string): Promise<MissionVersion[]> {
    return this.versions.get(missionId) || [];
  }

  public async recordAgentRun(run: AgentRunLog): Promise<void> {
    const list = this.runs.get(run.missionId) || [];
    list.push(run);
    this.runs.set(run.missionId, list);
    this.saveToDisk();
  }
}

export const firestoreService = new FirestoreDatabaseService();
