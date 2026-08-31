import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AgentCommandPanel } from './components/AgentCommandPanel';
import { RealGoogleMap } from './components/RealGoogleMap';
import { MissionHistoryDrawer } from './components/MissionHistoryDrawer';
import { TechnicalDetailsModal } from './components/TechnicalDetailsModal';
import { Location3DPopviewModal } from './components/Location3DPopviewModal';
import { Mission, ItineraryStop } from './types';

export function App() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [selectedStop, setSelectedStop] = useState<ItineraryStop | null>(null);
  const [popviewStop, setPopviewStop] = useState<ItineraryStop | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isTechDetailsOpen, setIsTechDetailsOpen] = useState<boolean>(false);

  // 1. Initial Load: Fetch missions from Firestore API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMissions() {
      try {
        const res = await fetch('/api/missions');
        const data = await res.json();
        if (!isMounted) return;

        if (data.missions && data.missions.length > 0) {
          setMissions(data.missions);
          setCurrentMission(data.missions[0]);
        } else {
          // Seed default initial mission if empty
          const seedRes = await fetch('/api/seed-demos', { method: 'POST' });
          const seedData = await seedRes.json();
          if (!isMounted) return;
          if (seedData.missions && seedData.missions.length > 0) {
            setMissions(seedData.missions);
            setCurrentMission(seedData.missions[0]);
          }
        }
      } catch (err) {
        console.warn('[App] Could not fetch missions:', err);
      }
    }

    loadMissions();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Poll for telemetry & updates for active mission in background
  useEffect(() => {
    if (!currentMission) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/missions/${currentMission.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.mission) {
            setCurrentMission(data.mission);
          }
        }
      } catch (err) {
        // silent polling error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentMission?.id]);

  // 3. Launch Mission via Natural Language Agent
  const handleLaunchMission = async (prompt: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.mission) {
        setCurrentMission(data.mission);
        setMissions((prev) => [data.mission, ...prev.filter((m) => m.id !== data.mission.id)]);
        setSelectedStop(null);
      }
    } catch (err) {
      console.error('[App] Error launching mission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Replan Mission via Natural Language Friction Prompt
  const handleReplanMission = async (eventDescription: string) => {
    if (!currentMission) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/missions/${currentMission.id}/replan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDescription,
        }),
      });
      const data = await res.json();
      if (data.mission) {
        setCurrentMission(data.mission);
        setMissions((prev) =>
          prev.map((m) => (m.id === data.mission.id ? data.mission : m))
        );
      }
    } catch (err) {
      console.error('[App] Error replanning mission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Force-Reset to Clean New Mission State
  const handleNewMission = useCallback(() => {
    setCurrentMission(null);
    setSelectedStop(null);
    setPopviewStop(null);
    setIsLoading(false);
    setIsHistoryOpen(false);
    setIsTechDetailsOpen(false);
  }, []);

  const currentStops = currentMission?.currentPlan?.stops || [];

  return (
    <div className="h-screen w-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans overflow-hidden select-none">
      {/* 1. Ultra-Minimal Header */}
      <Header
        onNewMission={handleNewMission}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTechDetails={() => setIsTechDetailsOpen(true)}
        missionCount={missions.length}
      />

      {/* 2. Full-Screen Two-Panel Viewport Layout */}
      <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: AI Agent Command Center (35% width) */}
        <section className="w-full md:w-[35%] lg:w-[32%] xl:w-[30%] h-full shrink-0 flex flex-col z-20">
          <AgentCommandPanel
            mission={currentMission}
            isLoading={isLoading}
            onStartMission={handleLaunchMission}
            onReplanMission={handleReplanMission}
            onNewMission={handleNewMission}
            selectedStop={selectedStop}
            onSelectStop={(stop) => setSelectedStop(stop)}
          />
        </section>

        {/* Right Panel: Real Google Map Hero (65% width) */}
        <section className="w-full md:flex-1 h-full relative z-10">
          <RealGoogleMap
            mission={currentMission}
            selectedStop={selectedStop}
            onSelectStop={(stop) => setSelectedStop(stop)}
            onOpen3DPopview={(stop) => setPopviewStop(stop)}
          />
        </section>
      </main>

      {/* 3. Slide-out Drawers & Modals */}
      <MissionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        missions={missions}
        currentMission={currentMission}
        onSelectMission={(m) => {
          setCurrentMission(m);
          setSelectedStop(null);
        }}
      />

      <TechnicalDetailsModal
        isOpen={isTechDetailsOpen}
        onClose={() => setIsTechDetailsOpen(false)}
      />

      {/* 4. Centered 3D Popview Modal */}
      {popviewStop && (
        <Location3DPopviewModal
          stop={popviewStop}
          stops={currentStops}
          onClose={() => setPopviewStop(null)}
          onSelectStop={(st) => {
            setPopviewStop(st);
            setSelectedStop(st);
          }}
          onFlyToStop={(st) => {
            setSelectedStop(st);
          }}
        />
      )}
    </div>
  );
}

export default App;
