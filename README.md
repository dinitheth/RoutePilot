# RoutePilot

Autonomous Errand and Urban Navigation Dispatcher Powered by Google Gemini and Google Maps Platform.

<a href="https://ibb.co/xSn0sTX3"><img src="https://i.ibb.co/LzTWP7Yv/Route-Pilot.jpg" alt="Route-Pilot" border="0"></a>

---

## Executive Summary

RoutePilot is an autonomous operations agent engineered to resolve complex, multi-constraint urban itineraries. While conventional navigation platforms operate strictly point-to-point, RoutePilot addresses real-world logistical planning: multi-stop errands characterized by strict time windows, financial budgets, business opening hours, prioritized stops, and mid-mission disruptions.

By combining the reasoning and structured tool-calling capabilities of the Google Gemini model family with real-time geospatial grounding from the Google Maps Platform (Places API, Routes API, Geocoding API), RoutePilot translates unstructured natural language objectives into verified, topologically sequenced 3D spatial missions.

---

## Key Capabilities

### 1. Autonomous Goal Decomposition
* Translates ambiguous, high-level natural language prompts (e.g., *"I have 3 hours and a 5,000 LKR budget, need to visit a bank in Nugegoda, pick up electronics, and grab lunch"*) into deterministic execution plans.
* Identifies explicit and implicit constraints: total mission duration, opening hours, dwell time per stop, financial budget ceilings, and return-to-origin requirements.

### 2. Multi-API Geospatial Grounding
* Real-time verification of physical business existence, precise latitude/longitude coordinates, formatted addresses, and operational hours using Google Maps Platform Places and Geocoding APIs.
* Calculation of transit durations, distances, and traffic considerations across multi-waypoint topologies.

### 3. Constraint-Driven Heuristic Sequencing
* Formulates and solves the underlying Traveling Salesperson Problem with Time Windows (TSPTW).
* Prioritizes high-urgency stops (e.g., banking deadlines) and balances dwell times against transit buffers to guarantee arrival within designated schedules.

### 4. Continuous Re-planning & Feedback Loop
* Real-time telemetry monitoring supporting mid-mission adaptation.
* Dynamically replans remaining legs when users encounter closed facilities, unexpected delays, or altered preferences without restarting the workflow.

### 5. High-Contrast Tactical Visualization
* 3D perspective camera angles with interactive tilt, bearing adjustment, and automated route fly-through animations.
* Synchronized HUD telemetry displaying total transit distance, elapsed time, cumulative budget utilization, and stop-by-stop validation cards.
* High-density tactical cartography engine with native fallback capabilities.

---

## System Architecture

The application is architected as a decoupled full-stack system with strict separation between client presentation, agent orchestration, and external API gateways.

```
+-----------------------------------------------------------------------+
|                           Client Interface                            |
|             (React 18 + TypeScript + Tailwind CSS + Vite)             |
|                                                                       |
|  [ Natural Language HUD ]   [ 3D Tactical Map ]   [ Telemetry Rails ] |
+-----------------------------------+-----------------------------------+
                                    |
                            HTTP / REST APIs
                                    |
+-----------------------------------v-----------------------------------+
|                        Serverless / Express API                       |
|                          (Node.js Runtime)                            |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |                     RoutePilot Agent Loop                       |  |
|  |   Perceive -> Decompose -> Tool Call -> Optimize -> Formulate   |  |
|  +-----------------------------------------------------------------+  |
|                                   |                                   |
|        +--------------------------+--------------------------+        |
|        |                                                     |        |
|  +-----v----------------+                             +------v-----+  |
|  |  Google Gemini API   |                             | Google Maps|  |
|  |  Structured Outputs  |                             | Platform   |  |
|  +----------------------+                             +------------+  |
+-----------------------------------------------------------------------+
```

---

## Technology Stack

* **AI & Language Models**: Google Gemini 2.5 Flash / Gemini Pro via `@google/genai` TypeScript SDK
* **Geospatial & Mapping**: Google Maps Platform (JavaScript API, Places API New, Routes API, Geocoding)
* **Frontend Framework**: React 18, TypeScript, Tailwind CSS, Motion
* **Backend Runtime**: Node.js, Express, tsx, esbuild
* **Deployment Targets**: Google Cloud Run, Vercel Serverless Functions, Docker

---

## Getting Started

### Prerequisites

* Node.js version 18.0.0 or higher
* npm version 9.0.0 or higher
* Google Gemini API Key
* (Optional) Google Maps Platform API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dinitheth/RoutePilot.git
   cd RoutePilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Production Build and Deployment

### Standard Container Build (Cloud Run / Docker)

Compile the static assets and bundle the server:
```bash
npm run build
npm start
```

### Vercel Deployment

This project includes native Vercel configuration (`vercel.json` and `/api/index.ts`):

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the `GEMINI_API_KEY` and `VITE_GOOGLE_MAPS_API_KEY` in Project Settings.
4. Deploy using standard Vite preset settings.

---

## API Reference

### Plan Mission
`POST /api/plan-mission`
* Payload: `{ "userPrompt": string, "origin": { "lat": number, "lng": number, "name": string }, "constraints": object }`
* Response: Full mission specification with validated waypoints, polyline routes, cost estimates, and risk telemetry.

### Replan Mission
`POST /api/replan-mission`
* Payload: `{ "missionId": string, "currentStopIndex": number, "reason": string }`
* Response: Updated itinerary reflecting bypassed or adjusted nodes.

### System Health
`GET /api/health`
* Response: Status of the server runtime, Gemini integration, and storage services.

---

## License

This project is licensed under the Apache License 2.0. See the `LICENSE` file for details.
