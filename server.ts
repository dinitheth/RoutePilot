import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './backend/api/routes.js';
import { backgroundEngine } from './backend/services/background_engine.js';
import { DEFAULT_GEMINI_MODEL } from './backend/services/gemini_service.js';

const PORT = 3000;

async function bootstrap() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  console.log(`\n======================================================`);
  console.log(`🚀 ROUTEPILOT — AUTONOMOUS REAL-WORLD TASK AGENT`);
  console.log(`🎯 Category: TASKMASTER (All Things Agentic Hackathon)`);
  console.log(`🤖 Model: ${DEFAULT_GEMINI_MODEL}`);
  console.log(`🧩 Framework: Google ADK (Agent Development Kit)`);
  console.log(`☁️ Infrastructure: Google Cloud Run + Firestore`);
  console.log(`🗺️ Grounding: Google Maps Platform (Places API New, Routes API)`);
  console.log(`======================================================\n`);

  // Mount Backend API
  app.use('/api', apiRouter);

  // Start background monitoring daemon
  backgroundEngine.start();

  // Vite middleware in dev mode / static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] RoutePilot server listening on port ${PORT} (0.0.0.0)`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
