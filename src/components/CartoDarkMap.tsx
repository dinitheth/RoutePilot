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

    // Render smooth glow polyline
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#10b981',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;
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
