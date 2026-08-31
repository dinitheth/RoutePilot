import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Mission, ItineraryStop } from '../types';

interface CartoDarkMapProps {
  mission: Mission | null;
  selectedStop: ItineraryStop | null;
  onSelectStop: (stop: ItineraryStop | null) => void;
  onOpen3DPopview: (stop: ItineraryStop) => void;
  is3DTilted: boolean;
}

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function formatLegDistance(distKm: number): string {
  if (distKm >= 1) {
    return `${distKm.toFixed(1)} km`;
  }
  const meters = Math.max(50, Math.round(distKm * 1000));
  return `${meters} m`;
}

export const CartoDarkMap: React.FC<CartoDarkMapProps> = ({
  mission,
  selectedStop,
  onSelectStop,
  onOpen3DPopview,
  is3DTilted,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const stops = mission?.currentPlan?.stops || [];
  const origin = mission?.origin || { lat: 6.8649, lng: 79.8997, name: 'Nugegoda' };

  const centerLat =
    stops.length > 0
      ? stops.reduce((acc, s) => acc + (s.lat || 6.8649), 0) / stops.length
      : origin.lat || 6.8649;
  const centerLng =
    stops.length > 0
      ? stops.reduce((acc, s) => acc + (s.lng || 79.8997), 0) / stops.length
      : origin.lng || 79.8997;

  // 1. Initialize Leaflet instance with Dark Matter cartography
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Esri World Dark Canvas Base (Watermark-free, clean dark tactical cartography)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
      }
    ).addTo(map);

    // Dark Reference Labels, Neighborhoods & Highways
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
      }
    ).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Invalidate size immediately and after layout settles
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Observe container resizes (e.g. sidebar toggle, window resizing)
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render stops and polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (stops.length === 0) {
      map.setView([origin.lat, origin.lng], 13);
      return;
    }

    const latLngs: [number, number][] = [];

    stops.forEach((stop) => {
      const isSelected = selectedStop?.stopNumber === stop.stopNumber;
      const lat = stop.lat;
      const lng = stop.lng;
      latLngs.push([lat, lng]);

      let customHtml = '';
      let iconSize: [number, number] = [36, 44];
      let iconAnchor: [number, number] = [18, 44];

      if (isSelected) {
        iconSize = [250, 260];
        iconAnchor = [125, 260];
        customHtml = `
          <div class="tactical-hud-card-anchor" style="width: 250px; height: 260px;">
            <div class="tactical-hud-card">
              <div class="tactical-hud-header">
                <div class="tactical-hud-tag">
                  <span class="tactical-hud-beacon"></span>
                  <span>STOP // 0${stop.stopNumber}</span>
                </div>
                <button class="tactical-hud-close" id="hud-close-${stop.stopNumber}" title="Deselect">✕</button>
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
                  <button class="tactical-hud-btn-popview" id="hud-popview-${stop.stopNumber}">
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
          </div>
        `;
      } else {
        customHtml = `
          <div class="custom-map-marker-container" style="transform: translateY(-8px);">
            <div class="custom-map-marker-pin">
              <div class="custom-map-marker-badge unselected">
                ${stop.stopNumber}
              </div>
            </div>
            <div class="custom-map-marker-stem"></div>
            <div class="custom-map-marker-shadow"></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker-div',
        html: customHtml,
        iconSize,
        iconAnchor,
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on('click', (e) => {
        const target = (e.originalEvent as MouseEvent)?.target as HTMLElement | null;
        if (target && target.closest(`#hud-close-${stop.stopNumber}`)) {
          onSelectStop(null);
          return;
        }
        if (target && target.closest(`#hud-popview-${stop.stopNumber}`)) {
          onOpen3DPopview(stop);
          return;
        }
        if (target && target.closest('.tactical-hud-btn-maps')) {
          return;
        }
        onSelectStop(stop);
      });

      marker.on('dblclick', () => {
        onOpen3DPopview(stop);
      });

      // Tooltip only on unselected markers
      if (!isSelected) {
        marker.bindTooltip(
          `<div class="text-xs font-semibold text-zinc-100">${stop.stopNumber}. ${stop.placeName}</div><div class="text-[10px] text-zinc-400">${stop.durationMinutes > 0 ? `${stop.durationMinutes} min dwell` : 'Waypoint'}</div>`,
          {
            direction: 'top',
            offset: [0, -42],
            className: 'leaflet-dark-tooltip',
          }
        );
      }

      markersGroup.addLayer(marker);
    });

    // Render smooth glow polyline & 3D Leg Distance Badges
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#10b981',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;

      // Render 3D Distance Badges (KM or M) at the midpoint of each segment
      for (let i = 0; i < stops.length - 1; i++) {
        const fromStop = stops[i];
        const toStop = stops[i + 1];

        const midLat = (fromStop.lat + toStop.lat) / 2;
        const midLng = (fromStop.lng + toStop.lng) / 2;

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

        const distanceBadgeHtml = `
          <div class="tactical-leg-distance-container" style="transform: perspective(800px) rotateX(${is3DTilted ? 26 : 0}deg);">
            <div class="tactical-leg-distance-pill" id="leg-badge-${fromStop.stopNumber}-${toStop.stopNumber}">
              <div class="tactical-leg-chevron" style="transform: rotate(${Math.round(bearingDeg - 90)}deg);">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
              <span class="tactical-leg-dist-text">${distFormatted}</span>
              <span class="tactical-leg-divider">|</span>
              <span class="tactical-leg-time-text">${timeMinutes}m</span>
            </div>
          </div>
        `;

        const distanceIcon = L.divIcon({
          className: 'tactical-leg-marker-icon',
          html: distanceBadgeHtml,
          iconSize: [90, 26],
          iconAnchor: [45, 13],
        });

        const legMarker = L.marker([midLat, midLng], {
          icon: distanceIcon,
          zIndexOffset: 50,
        });

        legMarker.bindTooltip(
          `<div class="text-xs font-mono font-bold text-emerald-400">LEG // 0${fromStop.stopNumber} ➔ 0${toStop.stopNumber}</div>
           <div class="text-[11px] text-zinc-300 font-medium">${fromStop.placeName} ➔ ${toStop.placeName}</div>
           <div class="text-[10px] text-zinc-400 mt-0.5">Distance: <span class="text-zinc-200 font-bold">${distFormatted}</span> • Travel: ~${timeMinutes} mins</div>`,
          {
            direction: 'top',
            offset: [0, -14],
            className: 'tactical-leg-tooltip',
          }
        );

        legMarker.on('click', () => {
          onSelectStop(toStop);
        });

        markersGroup.addLayer(legMarker);
      }
    }

    // Fit bounds smoothly
    if (latLngs.length > 1 && !selectedStop) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 0.6 });
    } else if (latLngs.length === 1 && !selectedStop) {
      map.flyTo(latLngs[0], 15, { animate: true, duration: 0.6 });
    }
  }, [stops, selectedStop, origin, onSelectStop, onOpen3DPopview]);

  // 3. React to selected stop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStop) return;

    map.flyTo([selectedStop.lat, selectedStop.lng], 16.5, {
      animate: true,
      duration: 0.7,
    });
  }, [selectedStop]);

  return (
    <div
      className="relative w-full h-full overflow-hidden transition-transform duration-700 ease-out origin-center"
      style={{
        transformStyle: 'preserve-3d',
        transform: is3DTilted
          ? 'perspective(1000px) rotateX(24deg) scale(1.04)'
          : 'perspective(1000px) rotateX(0deg) scale(1)',
      }}
    >
      <div ref={mapContainerRef} className="w-full h-full bg-[#121214]" />
    </div>
  );
};
