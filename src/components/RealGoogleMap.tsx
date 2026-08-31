import React, { useEffect, useRef, useState, useCallback } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import {
  RotateCw,
  Layers,
  MapPin,
  ExternalLink,
  Navigation,
  Box,
} from 'lucide-react';
import { Mission, ItineraryStop } from '../types';
import { Location3DPopviewModal } from './Location3DPopviewModal';
import { CartoDarkMap } from './CartoDarkMap';

interface RealGoogleMapProps {
  mission: Mission | null;
  selectedStop: ItineraryStop | null;
  onSelectStop: (stop: ItineraryStop | null) => void;
  onOpen3DPopview?: (stop: ItineraryStop) => void;
}

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatLegDistance(distKm: number): string {
  if (distKm >= 1) {
    return `${distKm.toFixed(1)} km`;
  }
  const meters = Math.max(50, Math.round(distKm * 1000));
  return `${meters} m`;
}

/**
 * Helper function to calculate the LatLngBounds of all mission waypoints
 * with optional origin and validation.
 */
export function calculateMissionLatLngBounds(
  stops: ItineraryStop[],
  origin?: { lat: number; lng: number }
): google.maps.LatLngBounds | null {
  if (typeof google === 'undefined' || !google.maps || !google.maps.LatLngBounds) {
    return null;
  }

  const bounds = new google.maps.LatLngBounds();
  let validPoints = 0;

  if (origin && typeof origin.lat === 'number' && typeof origin.lng === 'number') {
    bounds.extend(new google.maps.LatLng(origin.lat, origin.lng));
    validPoints++;
  }

  stops.forEach((stop) => {
    if (typeof stop.lat === 'number' && typeof stop.lng === 'number') {
      bounds.extend(new google.maps.LatLng(stop.lat, stop.lng));
      validPoints++;
    }
  });

  return validPoints > 0 ? bounds : null;
}

export const RealGoogleMap: React.FC<RealGoogleMapProps> = ({
  mission,
  selectedStop,
  onSelectStop,
  onOpen3DPopview,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [is3DTilted, setIs3DTilted] = useState<boolean>(true);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [mapLoadFailed, setMapLoadFailed] = useState<boolean>(false);

  const stops = mission?.currentPlan?.stops || [];
  const origin = mission?.origin || { lat: 6.8649, lng: 79.8997, name: 'Nugegoda' };

  // Calculate center and bounds
  const centerLat = stops.length > 0
    ? stops.reduce((acc, s) => acc + (s.lat || 6.8649), 0) / stops.length
    : origin.lat || 6.8649;
  const centerLng = stops.length > 0
    ? stops.reduce((acc, s) => acc + (s.lng || 79.8997), 0) / stops.length
    : origin.lng || 79.8997;

  // Initialize Real Google Map via Loader
  useEffect(() => {
    // Catch Google Maps auth failure globally to suppress error alerts and use dark cartography
    (window as any).gm_authFailure = () => {
      console.warn('[RealGoogleMap] Google Maps authentication failed. Using dark cartography engine.');
      setMapLoadFailed(true);
    };

    if (!mapContainerRef.current) return;

    const apiKey =
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      (window as any).GOOGLE_MAPS_API_KEY ||
      '';

    // If key is empty or placeholder, switch to dark cartography map immediately
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('MY_') || apiKey.length < 15) {
      setMapLoadFailed(true);
      return;
    }

    setOptions({
      key: apiKey,
      v: 'weekly',
    });

    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ])
      .then(([mapsLib]) => {
        if (!mapContainerRef.current) return;
        const { Map } = mapsLib as any;

        const mapOptions: google.maps.MapOptions = {
          center: { lat: centerLat, lng: centerLng },
          zoom: 14,
          tilt: 50,
          heading: 20,
          mapId: 'DEMO_MAP_ID',
          mapTypeId: 'roadmap',
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#e4e4e7' }],
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#71717a' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#14281d' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#27272a' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#18181b' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{ color: '#3f3f46' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#18181b' }],
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{ color: '#27272a' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#09090b' }],
            },
          ],
        };

        const map = new Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;
        setIsMapLoaded(true);
      })
      .catch((err) => {
        console.warn('[RealGoogleMap] Falling back to dark cartography map:', err);
        setMapLoadFailed(true);
      });
  }, []);

  const prevMissionIdRef = useRef<string | null>(null);
  const prevPlanVersionRef = useRef<number | null>(null);
  const animationTimerRef = useRef<any>(null);

  // Smoothly Fly To / Animate Camera Function
  const smoothFlyTo = useCallback(
    (lat: number, lng: number, zoomLevel: number = 16, tilt?: number, heading?: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const targetTilt = tilt !== undefined ? tilt : (is3DTilted ? 55 : 0);
      const targetHeading = heading !== undefined ? heading : (is3DTilted ? 25 : 0);

      if (typeof (map as any).moveCamera === 'function') {
        (map as any).moveCamera({
          center: { lat, lng },
          zoom: zoomLevel,
          tilt: targetTilt,
          heading: targetHeading,
        });
      } else {
        map.panTo({ lat, lng });
        map.setZoom(zoomLevel);
        if (typeof map.setTilt === 'function') map.setTilt(targetTilt);
        if (typeof map.setHeading === 'function') map.setHeading(targetHeading);
      }
    },
    [is3DTilted]
  );

  // Helper to fit bounds with animation duration and camera perspective
  const fitMissionBoundsWithAnimation = useCallback(
    (
      bounds: google.maps.LatLngBounds,
      padding: google.maps.Padding = { top: 75, bottom: 75, left: 75, right: 75 },
      animationDurationMs: number = 600
    ) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      map.fitBounds(bounds, padding);

      setTimeout(() => {
        const m = mapInstanceRef.current;
        if (!m) return;
        const targetTilt = is3DTilted ? 55 : 0;
        const targetHeading = is3DTilted ? 25 : 0;
        if (typeof (m as any).moveCamera === 'function') {
          (m as any).moveCamera({ tilt: targetTilt, heading: targetHeading });
        } else {
          if (typeof m.setTilt === 'function') m.setTilt(targetTilt);
          if (typeof m.setHeading === 'function') m.setHeading(targetHeading);
        }
      }, animationDurationMs);
    },
    [is3DTilted]
  );

  // Open 3D Popview for target stop
  const handleOpen3DPopview = useCallback((stop?: ItineraryStop) => {
    const target = stop || selectedStop || stops[0] || null;
    if (target) {
      onSelectStop(target);
      if (onOpen3DPopview) {
        onOpen3DPopview(target);
      }
    }
  }, [selectedStop, stops, onSelectStop, onOpen3DPopview]);

  // Update Advanced Markers & Polyline with dynamic HTML & 3D perspective scaling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((m) => {
      if (m.map) m.map = null;
      else if (m.setMap) m.setMap(null);
    });
    markersRef.current = [];

    // Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (stops.length === 0) {
      map.panTo({ lat: centerLat, lng: centerLng });
      map.setZoom(13);
      return;
    }

    const bounds = calculateMissionLatLngBounds(stops, mission?.origin) || new google.maps.LatLngBounds();
    const pathCoordinates: google.maps.LatLngLiteral[] = [];

    // Check if AdvancedMarkerElement is supported in this environment
    const AdvancedMarker = (google.maps as any)?.marker?.AdvancedMarkerElement;

    stops.forEach((stop) => {
      const position = { lat: stop.lat, lng: stop.lng };
      bounds.extend(position);
      pathCoordinates.push(position);

      const isSelected = selectedStop?.stopNumber === stop.stopNumber;

      if (AdvancedMarker) {
        // Custom HTML Marker with dynamic numbering and 3D perspective scaling
        const markerContainer = document.createElement('div');
        
        if (isSelected) {
          markerContainer.className = 'tactical-hud-card-anchor';
          markerContainer.style.transform = `perspective(800px) rotateX(${is3DTilted ? 25 : 0}deg)`;
          markerContainer.innerHTML = `
            <div class="tactical-hud-card">
              <div class="tactical-hud-header">
                <div class="tactical-hud-tag">
                  <span class="tactical-hud-beacon"></span>
                  <span>STOP // 0${stop.stopNumber}</span>
                </div>
                <button class="tactical-hud-close" id="gmap-hud-close-${stop.stopNumber}" title="Deselect">✕</button>
              </div>
              <div class="tactical-hud-body">
                <div class="tactical-hud-viewport">
                  <div class="tactical-hud-scanlines"></div>
                  <div class="tactical-hud-feed-badge">RECON // LIVE</div>
                  <div class="tactical-hud-coords">${stop.lat.toFixed(4)}°N, ${stop.lng.toFixed(4)}°E</div>
                  ${
                    stop.photoUrl
                      ? `<img src="${stop.photoUrl}" class="tactical-hud-img" alt="${stop.placeName}" />`
                      : `<div class="tactical-hud-placeholder"><span>${stop.category || 'POINT OF INTEREST'}</span></div>`
                  }
                </div>
                <div class="tactical-hud-info">
                  <div class="tactical-hud-title" title="${stop.placeName}">${stop.placeName}</div>
                  <div class="tactical-hud-meta">
                    <span class="tactical-hud-time">${stop.arrivalTime}</span>
                    <span class="tactical-hud-dot">•</span>
                    <span class="tactical-hud-dwell">${stop.durationMinutes > 0 ? `${stop.durationMinutes}m dwell` : 'Start / End'}</span>
                  </div>
                </div>
                <div class="tactical-hud-actions">
                  <button class="tactical-hud-btn-popview" id="gmap-hud-popview-${stop.stopNumber}">
                    <svg style="width: 12px; height: 12px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    <span>3D POPVIEW</span>
                  </button>
                  ${
                    stop.googleMapsUri
                      ? `<a href="${stop.googleMapsUri}" target="_blank" rel="noopener noreferrer" class="tactical-hud-btn-maps" title="Google Maps">MAPS ↗</a>`
                      : ''
                  }
                </div>
              </div>
            </div>
            <div class="tactical-hud-antenna">
              <div class="tactical-hud-antenna-glow"></div>
            </div>
            <div class="custom-map-marker-pin is-selected">
              <div class="custom-map-marker-badge selected">
                ${stop.stopNumber}
              </div>
            </div>
            <div class="custom-map-marker-stem"></div>
            <div class="custom-map-marker-shadow"></div>
          `;
        } else {
          markerContainer.className = 'custom-map-marker-container';
          markerContainer.style.transform = `perspective(800px) rotateX(${is3DTilted ? 35 : 0}deg) translateY(-8px)`;
          markerContainer.innerHTML = `
            <div class="custom-map-marker-pin">
              <div class="custom-map-marker-badge unselected">
                ${stop.stopNumber}
              </div>
            </div>
            <div class="custom-map-marker-stem"></div>
            <div class="custom-map-marker-shadow"></div>
          `;
        }

        const marker = new AdvancedMarker({
          map,
          position,
          title: `${stop.stopNumber}. ${stop.placeName}`,
          content: markerContainer,
          zIndex: isSelected ? 9999 : 1,
          gmpClickable: true,
        });

        marker.addListener('click', (e: any) => {
          const domEvt = e?.domEvent as MouseEvent | undefined;
          const target = domEvt?.target as HTMLElement | null;
          if (target && target.closest(`#gmap-hud-close-${stop.stopNumber}`)) {
            onSelectStop(null);
            return;
          }
          if (target && target.closest(`#gmap-hud-popview-${stop.stopNumber}`)) {
            handleOpen3DPopview(stop);
            return;
          }
          if (target && target.closest('.tactical-hud-btn-maps')) {
            return;
          }
          onSelectStop(stop);
        });

        markerContainer.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          handleOpen3DPopview(stop);
        });

        markersRef.current.push(marker);
      } else {
        // Standard Marker Fallback
        const marker = new google.maps.Marker({
          position,
          map,
          title: `${stop.stopNumber}. ${stop.placeName}`,
          label: {
            text: `${stop.stopNumber}`,
            color: isSelected ? '#09090b' : '#f4f4f5',
            fontSize: '11px',
            fontWeight: 'bold',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 18 : 14,
            fillColor: isSelected ? '#34d399' : '#18181b',
            fillOpacity: 1,
            strokeColor: isSelected ? '#ffffff' : '#52525b',
            strokeWeight: 2,
          },
        });

        marker.addListener('click', () => {
          onSelectStop(stop);
        });

        markersRef.current.push(marker);
      }
    });

    // Draw single clean route polyline directly & 3D Leg Distance Badges
    if (pathCoordinates.length > 1 && map) {
      const polyline = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.95,
        strokeWeight: 4,
      });

      polyline.setMap(map);
      polylineRef.current = polyline;

      // Render 3D Distance Badges (KM or M) at the midpoint of each segment
      for (let i = 0; i < stops.length - 1; i++) {
        const fromStop = stops[i];
        const toStop = stops[i + 1];

        const midLat = (fromStop.lat + toStop.lat) / 2;
        const midLng = (fromStop.lng + toStop.lng) / 2;
        const position = { lat: midLat, lng: midLng };

        const distKm =
          toStop.travelDistanceKm && toStop.travelDistanceKm > 0
            ? toStop.travelDistanceKm
            : calculateHaversineDistanceKm(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng);

        const distFormatted = formatLegDistance(distKm);
        const timeMinutes = toStop.travelFromPrevMinutes || Math.max(1, Math.round(distKm * 2.2));

        // Bearing angle for directional arrow
        const y = Math.sin(((toStop.lng - fromStop.lng) * Math.PI) / 180) * Math.cos((toStop.lat * Math.PI) / 180);
        const x =
          Math.cos((fromStop.lat * Math.PI) / 180) * Math.sin((toStop.lat * Math.PI) / 180) -
          Math.sin((fromStop.lat * Math.PI) / 180) *
            Math.cos((toStop.lat * Math.PI) / 180) *
            Math.cos(((toStop.lng - fromStop.lng) * Math.PI) / 180);
        const bearingDeg = (Math.atan2(y, x) * 180) / Math.PI;

        if (AdvancedMarker) {
          const legContainer = document.createElement('div');
          legContainer.className = 'tactical-leg-distance-container';
          legContainer.style.transform = `perspective(800px) rotateX(${is3DTilted ? 26 : 0}deg)`;
          legContainer.innerHTML = `
            <div class="tactical-leg-distance-pill" title="Leg: ${fromStop.placeName} ➔ ${toStop.placeName} (${distFormatted})">
              <div class="tactical-leg-chevron" style="transform: rotate(${Math.round(bearingDeg - 90)}deg);">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
              <span class="tactical-leg-dist-text">${distFormatted}</span>
              <span class="tactical-leg-divider">|</span>
              <span class="tactical-leg-time-text">${timeMinutes}m</span>
            </div>
          `;

          const legMarker = new AdvancedMarker({
            map,
            position,
            title: `Distance: ${distFormatted}`,
            content: legContainer,
            zIndex: 50,
            gmpClickable: true,
          });

          legMarker.addListener('click', () => {
            onSelectStop(toStop);
          });

          markersRef.current.push(legMarker);
        }
      }
    }

    const isNewMission = mission?.id && mission.id !== prevMissionIdRef.current;
    const isNewPlanVersion =
      mission?.currentPlan?.version !== undefined &&
      mission.currentPlan.version !== prevPlanVersionRef.current;

    prevMissionIdRef.current = mission?.id || null;
    prevPlanVersionRef.current = mission?.currentPlan?.version || null;

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    // Camera Animation: When a new mission starts or a plan is updated
    if ((isNewMission || isNewPlanVersion) && stops.length > 0) {
      const firstStop = stops[0];
      smoothFlyTo(firstStop.lat, firstStop.lng, 16, 45, 25);

      animationTimerRef.current = setTimeout(() => {
        if (stops.length > 1) {
          fitMissionBoundsWithAnimation(bounds, { top: 80, bottom: 80, left: 80, right: 80 }, 600);
        }
      }, 950);
    } else if (stops.length > 1 && !selectedStop) {
      fitMissionBoundsWithAnimation(bounds, { top: 80, bottom: 80, left: 80, right: 80 }, 400);
    } else if (stops.length === 1 && !selectedStop) {
      smoothFlyTo(stops[0].lat, stops[0].lng, 15, 45, 20);
    }

    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, [stops, isMapLoaded, is3DTilted, mission?.id, mission?.origin, mission?.currentPlan?.version, onSelectStop, smoothFlyTo, fitMissionBoundsWithAnimation, centerLat, centerLng, handleOpen3DPopview]);

  // Handle Stop Switching Camera Zoom and Fly-To
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapLoaded) return;

    if (selectedStop) {
      smoothFlyTo(selectedStop.lat, selectedStop.lng, 16.5, 45, 15);
    }
  }, [selectedStop, isMapLoaded, smoothFlyTo]);

  // Recenter / Fit View Handler
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (stops.length > 1) {
      const bounds = calculateMissionLatLngBounds(stops, mission?.origin) || new google.maps.LatLngBounds();
      fitMissionBoundsWithAnimation(bounds, { top: 75, bottom: 75, left: 75, right: 75 }, 500);
    } else if (stops.length === 1) {
      smoothFlyTo(stops[0].lat, stops[0].lng, 15.5, 45, 20);
    } else {
      map.panTo({ lat: centerLat, lng: centerLng });
      map.setZoom(14);
    }
  }, [stops, mission?.origin, centerLat, centerLng, fitMissionBoundsWithAnimation, smoothFlyTo]);

  // Toggle 3D Tilt
  const handleToggle3D = () => {
    const nextIs3D = !is3DTilted;
    setIs3DTilted(nextIs3D);

    const map = mapInstanceRef.current;
    if (!map) return;

    const targetTilt = nextIs3D ? 55 : 0;
    const targetHeading = nextIs3D ? 25 : 0;

    if (typeof (map as any).moveCamera === 'function') {
      (map as any).moveCamera({
        tilt: targetTilt,
        heading: targetHeading,
      });
    } else {
      if (typeof map.setTilt === 'function') map.setTilt(targetTilt);
      if (typeof map.setHeading === 'function') map.setHeading(targetHeading);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#09090B] overflow-hidden select-none">
      {/* 1. Real Google Maps Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full transition-transform duration-700 ease-out origin-center ${mapLoadFailed ? 'hidden' : 'block'}`}
      />

      {/* 2. High-Contrast Dark Cartography Map (fixes black screen when Google Maps key is unset or in dev) */}
      {mapLoadFailed && (
        <CartoDarkMap
          mission={mission}
          selectedStop={selectedStop}
          onSelectStop={onSelectStop}
          onOpen3DPopview={(st) => handleOpen3DPopview(st)}
          is3DTilted={is3DTilted}
        />
      )}

      {/* Floating Top-Left Mission Pill */}
      {stops.length > 0 && (
        <div className="absolute top-4 left-4 z-20 bg-[#121214]/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-zinc-800 shadow-lg flex items-center gap-2.5 text-xs text-zinc-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-zinc-100">RoutePilot</span>
          <span className="text-zinc-500">•</span>
          <span>{stops.length} stops</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">
            {mission?.currentPlan?.totalDurationMinutes
              ? `${Math.floor(mission.currentPlan.totalDurationMinutes / 60)}h ${mission.currentPlan.totalDurationMinutes % 60}m`
              : '2h 53m'}
          </span>
        </div>
      )}

      {/* Floating Top-Right Camera Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* 3D Popview Trigger Button */}
        {stops.length > 0 && (
          <button
            onClick={() => handleOpen3DPopview()}
            className="px-3 py-1.5 rounded-full bg-[#121214]/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-emerald-400 text-xs font-medium transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
            title="Open 3D Location Popview"
          >
            <Box className="h-3.5 w-3.5 text-emerald-400" />
            <span>3D Popview</span>
          </button>
        )}

        {stops.length > 1 && (
          <button
            onClick={() => {
              if (stops.length === 0) return;
              let currentIdx = 0;
              const flyNext = () => {
                if (currentIdx >= stops.length) {
                  handleRecenter();
                  return;
                }
                const st = stops[currentIdx];
                onSelectStop(st);
                smoothFlyTo(st.lat, st.lng, 16.5, is3DTilted ? 55 : 0, is3DTilted ? 20 + currentIdx * 15 : 0);
                currentIdx++;
                setTimeout(flyNext, 2200);
              };
              flyNext();
            }}
            className="px-3 py-1.5 rounded-full bg-[#121214]/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-emerald-400 text-xs font-medium transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
            title="Fly Over Planned Route"
          >
            <Navigation className="h-3 w-3 text-emerald-400" />
            <span>Fly Route</span>
          </button>
        )}

        <button
          onClick={handleToggle3D}
          className={`px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium transition-all shadow-lg cursor-pointer flex items-center gap-1.5 ${
            is3DTilted
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 font-semibold shadow-emerald-950/40'
              : 'bg-[#121214]/90 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title={is3DTilted ? 'Switch to 2D Top-Down View' : 'Switch to 3D Perspective View'}
        >
          <Layers className={`h-3.5 w-3.5 ${is3DTilted ? 'text-emerald-400' : 'text-zinc-400'}`} />
          <span>{is3DTilted ? '3D View' : '2D View'}</span>
        </button>

        <button
          onClick={handleRecenter}
          className="p-2 rounded-full bg-[#121214]/90 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors shadow-lg cursor-pointer"
          title="Recenter Map on Route"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Attribution Requirement */}
      <div className="absolute bottom-2 left-4 z-10 text-[10px] text-zinc-600 pointer-events-none font-mono">
        <span>Google Maps Platform Grounding • Colombo Corridor</span>
      </div>
    </div>
  );
};
