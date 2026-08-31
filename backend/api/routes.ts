import { Router, Request, Response } from 'express';
import { RoutePilotAgent } from '../agents/routepilot_agent.js';
import { firestoreService } from '../services/firestore_service.js';
import { backgroundEngine } from '../services/background_engine.js';
import { searchPlacesLive } from '../services/maps_service.js';
import { DEFAULT_GEMINI_MODEL } from '../services/gemini_service.js';

export const apiRouter = Router();

// 1. Health & Configuration Status
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    product: 'RoutePilot Autonomous Task Agent',
    category: 'TASKMASTER',
    model: DEFAULT_GEMINI_MODEL,
    framework: 'Google ADK (Agent Development Kit)',
    infrastructure: 'Google Cloud Run',
    persistence: 'Google Cloud Firestore',
    mapsPlatform: 'Google Maps Platform (Places API New, Routes API)',
    timestamp: new Date().toISOString(),
  });
});

// 2. List Missions from Firestore
apiRouter.get('/missions', async (req: Request, res: Response) => {
  try {
    const missions = await firestoreService.listMissions();
    res.json({ missions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create & Execute Autonomous Mission
apiRouter.post('/missions', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Field "prompt" is required.' });
    }

    const mission = await RoutePilotAgent.createAndExecuteMission(prompt);
    res.json({ success: true, mission });
  } catch (err: any) {
    console.error('[API] Error creating mission:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Mission by ID
apiRouter.get('/missions/:id', async (req: Request, res: Response) => {
  try {
    const mission = await firestoreService.getMission(req.params.id);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json({ mission });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Mission Events (Telemetry Stream)
apiRouter.get('/missions/:id/events', async (req: Request, res: Response) => {
  try {
    const events = await firestoreService.getMissionEvents(req.params.id);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Mission Versions
apiRouter.get('/missions/:id/versions', async (req: Request, res: Response) => {
  try {
    const versions = await firestoreService.getMissionVersions(req.params.id);
    res.json({ versions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Trigger Autonomous / User-Initiated Replan
apiRouter.post('/missions/:id/replan', async (req: Request, res: Response) => {
  try {
    const { eventDescription, affectedCategoryOrTaskId, constraintOverrides } = req.body;
    const mission = await RoutePilotAgent.autonomousReplan(
      req.params.id,
      eventDescription || 'User requested mission schedule adjustment.',
      affectedCategoryOrTaskId,
      constraintOverrides
    );
    res.json({ success: true, mission });
  } catch (err: any) {
    console.error('[API] Error replanning mission:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Simulate Background Real-World Event
apiRouter.post('/missions/:id/simulate-event', async (req: Request, res: Response) => {
  try {
    const { eventType, customText } = req.body;
    const mission = await backgroundEngine.simulateRealWorldEvent(
      req.params.id,
      eventType || 'BANK_UNAVAILABLE',
      customText
    );
    res.json({ success: true, mission });
  } catch (err: any) {
    console.error('[API] Error simulating event:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Maps Places Proxy
apiRouter.get('/maps/places', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || 'Commercial Bank Nugegoda';
    const category = (req.query.category as string) || 'BANK';
    const candidates = await searchPlacesLive(query, category);
    res.json({ candidates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Seed Initial Hackathon Demonstrations if empty
apiRouter.post('/seed-demos', async (req: Request, res: Response) => {
  try {
    const existing = await firestoreService.listMissions();
    if (existing.length === 0) {
      console.log('[API] Seeding default hackathon demo missions...');
      // 1. Sri Lanka Main Mission
      await RoutePilotAgent.createAndExecuteMission(
        "I'm starting from Nugegoda at 9:30 AM. I have Rs. 5,000 and 4 hours. I need to visit a bank, buy a laptop charger, collect a document from campus, have lunch, and return home before 2 PM."
      );
    }
    const missions = await firestoreService.listMissions();
    res.json({ success: true, count: missions.length, missions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
