import { firestoreService } from './firestore_service.js';
import { RoutePilotAgent } from '../agents/routepilot_agent.js';

class BackgroundMissionEngine {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[BackgroundEngine] Asynchronous Mission Monitoring daemon started on Cloud Run.');

    // Monitor active missions every 45 seconds
    this.intervalId = setInterval(async () => {
      try {
        const missions = await firestoreService.listMissions();
        const activeMissions = missions.filter(
          (m) => m.backgroundMonitoringActive && (m.status === 'ACTIVE' || m.status === 'UPDATED')
        );

        for (const mission of activeMissions) {
          mission.lastMonitoredAt = new Date().toISOString();
          await firestoreService.saveMission(mission);
        }
      } catch (e) {
        console.warn('[BackgroundEngine] Monitoring tick error:', e);
      }
    }, 45000);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  // Simulate an autonomous asynchronous event arriving from real-world telemetry / webhooks
  public async simulateRealWorldEvent(
    missionId: string,
    eventType: 'BANK_UNAVAILABLE' | 'DEADLINE_CUT' | 'BUDGET_CUT' | 'REMOVE_LUNCH' | 'CUSTOM',
    customText?: string
  ) {
    console.log(`[BackgroundEngine] Processing external asynchronous event: ${eventType} for mission ${missionId}`);

    if (eventType === 'BANK_UNAVAILABLE') {
      return RoutePilotAgent.autonomousReplan(
        missionId,
        'Selected bank branch reported unexpected counter closure for unscheduled system maintenance.',
        'BANK'
      );
    } else if (eventType === 'DEADLINE_CUT') {
      return RoutePilotAgent.autonomousReplan(
        missionId,
        'User emergency: Available mission window shortened from 4 hours to 90 minutes.',
        undefined,
        { maxDurationMinutes: 90 }
      );
    } else if (eventType === 'BUDGET_CUT') {
      return RoutePilotAgent.autonomousReplan(
        missionId,
        'Budget constraint tightened: Max limit reduced to Rs. 2,000.',
        undefined,
        { maxBudgetLKR: 2000 }
      );
    } else if (eventType === 'REMOVE_LUNCH') {
      return RoutePilotAgent.autonomousReplan(
        missionId,
        'Optional lunch errand skipped to speed up mission execution.',
        undefined,
        { removeTaskId: 'FOOD' }
      );
    } else {
      return RoutePilotAgent.autonomousReplan(
        missionId,
        customText || 'External environmental update received from live monitoring.'
      );
    }
  }
}

export const backgroundEngine = new BackgroundMissionEngine();
