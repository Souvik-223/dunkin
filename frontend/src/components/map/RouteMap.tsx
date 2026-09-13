import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { StopData, RouteData } from '../../types/trip';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Maximize2, Minimize2, Compass, ChevronDown, ChevronUp, MapPin, Layers } from 'lucide-react';

interface RouteMapProps {
  route?: RouteData;
  stops?: StopData[];
  className?: string;
  theme?: 'dark' | 'light';
  selectedStopIndex?: number | null;
  onSelectStop?: (index: number) => void;
  onEnlarge?: () => void;
  isEnlarged?: boolean;
}

const TILE_LAYERS = {
  voyager: {
    name: 'Clean Logistics',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap contributors',
    maxZoom: 19,
    maxNativeZoom: 18,
  },
  dark: {
    name: 'Dark Fleet',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DeLorme, NAVTEQ',
    maxZoom: 19,
    maxNativeZoom: 16,
  },
  satellite: {
    name: 'Satellite Aerial',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    maxNativeZoom: 18,
  },
  osm: {
    name: 'Standard OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    maxNativeZoom: 19,
  },
};

const STOP_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; borderColor: string; emoji: string }
> = {
  START: { label: 'Origin Terminal', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', emoji: '🟢' },
  PICKUP: { label: 'Pickup (1h Load)', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', emoji: '📦' },
  DROPOFF: { label: 'Dropoff (1h Unload)', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', borderColor: '#f43f5e', emoji: '🏁' },
  REST_30M: { label: '30m Rest Break', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', emoji: '☕' },
  REST_10H: { label: '10h Sleeper Berth', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', emoji: '🛏️' },
  FUEL: { label: 'Commercial Fueling', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', emoji: '⛽' },
  BREAKPOINT: { label: 'Road Ends Here', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)', borderColor: '#ef4444', emoji: '❌' },
};

export const RouteMap: React.FC<RouteMapProps> = ({
  route,
  stops = [],
  className,
  theme = 'dark',
  selectedStopIndex: externalSelectedIndex,
  onSelectStop,
  onEnlarge,
  isEnlarged = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const glowPolylineLayerRef = useRef<L.Polyline | null>(null);

  const [activeTileKey, setActiveTileKey] = useState<keyof typeof TILE_LAYERS>(
    theme === 'dark' ? 'dark' : 'voyager'
  );
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number | null>(null);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  const selectedStopIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex;

  const handleSelectStop = (idx: number | null) => {
    setInternalSelectedIndex(idx);
    if (idx !== null && onSelectStop) {
      onSelectStop(idx);
    }
  };

  // Auto-synchronize tile layer with theme
  useEffect(() => {
    handleTileChange(theme === 'dark' ? 'dark' : 'voyager');
  }, [theme]);

  // ResizeObserver: invalidate Leaflet size whenever sidebars collapse/expand
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => {
      observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // When selected index changes, fly to that stop
  useEffect(() => {
    if (selectedStopIndex !== undefined && selectedStopIndex !== null && stops[selectedStopIndex]) {
      const stop = stops[selectedStopIndex];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([stop.coordinates[0], stop.coordinates[1]], 10, {
          duration: 1.0,
        });
      }
    }
  }, [selectedStopIndex, stops]);

  // Initialize and update Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [39.8283, -98.5795],
        zoom: 4,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const tile = L.tileLayer(TILE_LAYERS[activeTileKey].url, {
        attribution: TILE_LAYERS[activeTileKey].attribution,
        maxZoom: TILE_LAYERS[activeTileKey].maxZoom || 19,
        maxNativeZoom: TILE_LAYERS[activeTileKey].maxNativeZoom || 18,
        subdomains: 'abc',
      }).addTo(map);

      tileLayerRef.current = tile;
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    // Clear previous layers
    if (markersLayer) markersLayer.clearLayers();
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }
    if (glowPolylineLayerRef.current) {
      map.removeLayer(glowPolylineLayerRef.current);
      glowPolylineLayerRef.current = null;
    }

    // Draw Polylines with luminous highway glow
    if (route && route.coordinates.length > 1) {
      const latLngs = route.coordinates.map((c) => [c[0], c[1]] as L.LatLngExpression);

      // Outer glow line
      const glowLine = L.polyline(latLngs, {
        color: '#38bdf8',
        weight: 9,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      glowPolylineLayerRef.current = glowLine;

      // Inner crisp highway line
      const mainLine = L.polyline(latLngs, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      polylineLayerRef.current = mainLine;

      // Fit bounds
      map.fitBounds(mainLine.getBounds(), {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
      });
    } else if (stops && stops.length > 0) {
      // If road coordinates are empty (e.g. road route ends at breakpoint), fit bounds to stops
      const stopLatLngs = stops.map((s) => [s.coordinates[0], s.coordinates[1]] as [number, number]);
      const bounds = L.latLngBounds(stopLatLngs);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 12,
        animate: true,
      });
    }

    // Add Custom Markers
    stops.forEach((stop, idx) => {
      const config = STOP_CONFIG[stop.stop_type] || {
        label: stop.stop_type,
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.15)',
        borderColor: '#94a3b8',
        emoji: '📍',
      };

      const isSelected = selectedStopIndex === idx;
      const isBreakpoint = stop.stop_type === 'BREAKPOINT';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isBreakpoint ? (isSelected ? '44px' : '38px') : (isSelected ? '38px' : '32px')};
            height: ${isBreakpoint ? (isSelected ? '44px' : '38px') : (isSelected ? '38px' : '32px')};
            background: ${isBreakpoint ? '#450a0a' : '#090d16'};
            border: ${isBreakpoint ? '3px solid #ef4444' : `2.5px solid ${config.borderColor}`};
            border-radius: 50%;
            box-shadow: ${isBreakpoint ? '0 0 20px rgba(239, 68, 68, 0.95), 0 0 36px rgba(239, 68, 68, 0.55)' : `0 4px 16px rgba(0,0,0,0.6), 0 0 14px ${config.color}90`};
            font-size: ${isBreakpoint ? (isSelected ? '20px' : '17px') : (isSelected ? '16px' : '13px')};
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            ${isBreakpoint ? 'box-sizing: border-box;' : ''}
          ">
            <span>${config.emoji}</span>
            <div style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              width: 14px;
              height: 14px;
              background: ${config.borderColor};
              color: white;
              font-size: 8.5px;
              font-weight: 800;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1.5px solid #090d16;
            ">
              ${isBreakpoint ? '❌' : idx + 1}
            </div>
          </div>
        `,
        iconSize: [isBreakpoint ? (isSelected ? 44 : 38) : (isSelected ? 38 : 32), isBreakpoint ? (isSelected ? 44 : 38) : (isSelected ? 38 : 32)],
        iconAnchor: [isBreakpoint ? (isSelected ? 22 : 19) : (isSelected ? 19 : 16), isBreakpoint ? (isSelected ? 22 : 19) : (isSelected ? 19 : 16)],
        popupAnchor: [0, -20],
      });

      const arrivalDate = new Date(stop.arrival_time);
      const arrivalFormatted =
        arrivalDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' @ ' +
        arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Build rich amenities chips
      const amenitiesHtml = stop.amenities && stop.amenities.length > 0
        ? `
          <div style="margin: 8px 0; display: flex; flex-wrap: wrap; gap: 4px;">
            ${stop.amenities.slice(0, 4).map(am => `
              <span style="
                font-size: 9.5px;
                font-weight: 600;
                background: rgba(15, 23, 42, 0.7);
                color: #e2e8f0;
                border: 1px solid rgba(148, 163, 184, 0.2);
                border-radius: 6px;
                padding: 2px 6px;
                display: inline-flex;
                align-items: center;
              ">
                ${am}
              </span>
            `).join('')}
          </div>
        `
        : '';

      // Photo banner if available
      const photoHtml = stop.photo_url
        ? `
          <div style="
            position: relative;
            width: 100%;
            height: 90px;
            margin: 6px 0 8px;
            border-radius: 8px;
            overflow: hidden;
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.1);
          ">
            <img src="${stop.photo_url}" alt="${stop.location_name}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="
              position: absolute;
              bottom: 4px;
              left: 6px;
              background: rgba(9, 13, 22, 0.85);
              backdrop-filter: blur(4px);
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              color: #38bdf8;
              border: 1px solid rgba(56, 189, 248, 0.3);
            ">
              ✅ Verified Commercial Facility
            </div>
          </div>
        `
        : '';

      // Star rating badge
      const ratingHtml = stop.rating
        ? `
          <span style="
            display: inline-flex;
            align-items: center;
            gap: 3px;
            font-size: 10.5px;
            font-weight: 800;
            color: #fbbf24;
            background: rgba(245, 158, 11, 0.15);
            border: 1px solid rgba(245, 158, 11, 0.3);
            padding: 2px 6px;
            border-radius: 9999px;
          ">
            ⭐ ${stop.rating.toFixed(1)} <span style="color: #94a3b8; font-weight: 500; font-size: 9px;">(${stop.user_ratings_total || 450})</span>
          </span>
        `
        : '';

      // Google maps deep link (100% free, no API key needed)
      const gmapsLink = stop.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${stop.coordinates[0]},${stop.coordinates[1]}`;

      const popupHtml = `
        <div style="font-family: inherit; min-width: 250px; max-width: 300px; color: #f8fafc;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              padding: 3px 8px;
              border-radius: 9999px;
              background: ${config.bg};
              color: ${config.color};
              border: 1px solid ${config.borderColor}50;
            ">
              Stop #${idx + 1}: ${config.label}
            </span>
            ${ratingHtml}
          </div>

          <div style="font-weight: 800; font-size: 14px; color: #f8fafc; margin-bottom: 2px; line-height: 1.25;">
            ${stop.location_name}
          </div>

          ${stop.address ? `
            <div style="font-size: 11px; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: flex-start; gap: 4px;">
              <span>📍</span>
              <span>${stop.address}</span>
            </div>
          ` : ''}

          ${photoHtml}

          ${isBreakpoint ? `
            <div style="
              background: rgba(239, 68, 68, 0.2);
              border: 1.5px solid rgba(239, 68, 68, 0.7);
              border-radius: 8px;
              padding: 8px 10px;
              margin: 6px 0 8px;
              color: #fca5a5;
            ">
              <div style="font-weight: 800; font-size: 11.5px; color: #ef4444; display: flex; align-items: center; gap: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
                <span>❌</span> <span>Road Route Terminated</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; margin-top: 4px; line-height: 1.35; color: #ffffff;">
                No possible road routes available from this place.
              </div>
              <div style="font-size: 10px; margin-top: 3px; color: #f87171; line-height: 1.25;">
                Road network ends or is disconnected by ocean / impassable terrain.
              </div>
            </div>
          ` : `
            <p style="font-size: 10.5px; color: #94a3b8; margin: 0 0 6px; line-height: 1.35;">
              ${stop.description}
            </p>
          `}

          ${amenitiesHtml}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 6px 0; border-top: 1px solid rgba(51, 65, 85, 0.4); font-size: 10.5px;">
            <div>
              <span style="color: #64748b; font-size: 9.5px; text-transform: uppercase;">Arrival:</span><br/>
              <strong style="color: #38bdf8; font-family: monospace;">${arrivalFormatted}</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 9.5px; text-transform: uppercase;">Duration / Dist:</span><br/>
              <strong style="color: #f8fafc; font-family: monospace;">${stop.duration_hours > 0 ? `${stop.duration_hours}h` : 'Depart'} • ${stop.miles_from_start.toFixed(0)} mi</strong>
            </div>
          </div>

          <div style="padding-top: 6px; border-top: 1px solid rgba(51, 65, 85, 0.4); text-align: center;">
            <a
              href="${gmapsLink}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                width: 100%;
                padding: 5px 10px;
                background: rgba(56, 189, 248, 0.15);
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.35);
                border-radius: 6px;
                font-size: 10.5px;
                font-weight: 700;
                text-decoration: none;
                transition: all 0.2s;
              "
            >
              🌐 Open in Google Maps &amp; Navigation
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([stop.coordinates[0], stop.coordinates[1]], { icon: customIcon })
        .bindPopup(popupHtml, { maxWidth: 320 });

      marker.on('click', () => {
        handleSelectStop(idx);
      });

      if (markersLayer) marker.addTo(markersLayer);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [route, stops, selectedStopIndex, activeTileKey]);

  // Handle tile switch
  const handleTileChange = (key: keyof typeof TILE_LAYERS) => {
    setActiveTileKey(key);
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newTile = L.tileLayer(TILE_LAYERS[key].url, {
        attribution: TILE_LAYERS[key].attribution,
        maxZoom: TILE_LAYERS[key].maxZoom || 19,
        maxNativeZoom: TILE_LAYERS[key].maxNativeZoom || 18,
        subdomains: 'abc',
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTile;
    }
  };

  const handleFitRoute = () => {
    if (mapInstanceRef.current && polylineLayerRef.current) {
      mapInstanceRef.current.fitBounds(polylineLayerRef.current.getBounds(), {
        padding: [60, 60],
        animate: true,
      });
      handleSelectStop(null);
    }
  };

  const handleFocusStop = (index: number) => {
    handleSelectStop(index);
    const stop = stops[index];
    if (stop && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([stop.coordinates[0], stop.coordinates[1]], 10, {
        duration: 1.2,
      });
    }
  };

  return (
    <Card className={`glass-card overflow-hidden ${className}`}>
      <CardHeader
        className={`flex flex-row items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 ${
          isEnlarged
            ? 'py-1.5 px-3 sm:px-4 bg-slate-50/90 dark:bg-slate-950/80 shrink-0'
            : 'py-2 px-3 sm:px-4 pb-2.5'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Compass className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <CardTitle className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {isEnlarged ? 'Interactive Interstate Route & Waypoints Map' : 'Interstate Route & Waypoints Map'}
            </CardTitle>
          </div>
          {route && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate">
              <span className="font-semibold text-cyan-600 dark:text-cyan-400 font-mono">
                {route.total_distance_miles.toFixed(0)} mi
              </span>
              <span>•</span>
              <span>{stops.length} Stops</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tile Layer Selector */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-950/80 p-0.5 border border-slate-200 dark:border-slate-800 text-xs">
            {(Object.keys(TILE_LAYERS) as Array<keyof typeof TILE_LAYERS>).map((key) => (
              <button
                key={key}
                onClick={() => handleTileChange(key)}
                className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                  activeTileKey === key
                    ? 'bg-white text-cyan-700 shadow-xs dark:bg-slate-800 dark:text-cyan-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {TILE_LAYERS[key].name}
              </button>
            ))}
          </div>

          {/* Quick Clean View / Overlays Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !(showWaypoints || showLegend);
              setShowWaypoints(next);
              setShowLegend(next);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
              !showWaypoints && !showLegend
                ? 'bg-cyan-50 border-cyan-500/50 text-cyan-700 dark:bg-cyan-950/60 dark:border-cyan-500/40 dark:text-cyan-400'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
            }`}
            title={!showWaypoints && !showLegend ? 'Show All Map Overlays' : 'Clean View (Hide All Overlays)'}
          >
            <Layers className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden md:inline">{!showWaypoints && !showLegend ? 'Overlays' : 'Clean View'}</span>
          </button>

          {route && route.coordinates.length > 0 && (
            <button
              onClick={handleFitRoute}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Fit Full Route"
            >
              <Maximize2 className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Fit</span>
            </button>
          )}

          {onEnlarge && (
            <button
              onClick={onEnlarge}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition cursor-pointer"
              title={isEnlarged ? 'Exit Fullscreen (Esc)' : 'Enlarge Map to Fullscreen Modal'}
            >
              {isEnlarged ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Exit Fullscreen</span>
                  <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 text-[9px] font-mono bg-slate-200/80 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-300">
                    ESC
                  </kbd>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Enlarge</span>
                </>
              )}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative flex-1 flex flex-col min-h-0">
        <div
          ref={mapContainerRef}
          className={`w-full bg-slate-100 dark:bg-slate-950 transition-all ${
            isEnlarged ? 'flex-1 h-[calc(98vh-46px)] min-h-[500px]' : 'h-[520px]'
          }`}
          style={{ zIndex: 1 }}
        />

        {/* Floating Quick Waypoint Selector Ribbon (Collapsible) */}
        {stops.length > 0 && showWaypoints ? (
          <div className="absolute top-3 left-3 right-3 z-[500] flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Collapse Ribbon Button */}
            <button
              type="button"
              onClick={() => setShowWaypoints(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-md text-[11px] font-semibold shrink-0 backdrop-blur-md cursor-pointer transition"
              title="Collapse Checkpoints Ribbon"
              aria-label="Collapse Checkpoints Ribbon"
            >
              <ChevronUp className="h-3 w-3 text-cyan-400" />
              <span className="hidden sm:inline">Hide</span>
            </button>

            {stops.map((stop, idx) => {
              const cfg = STOP_CONFIG[stop.stop_type] || { color: '#94a3b8', emoji: '📍' };
              const isSelected = selectedStopIndex === idx;
              return (
                <button
                  key={`stop-quick-btn-${idx}`}
                  onClick={() => handleFocusStop(idx)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition backdrop-blur-md cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-cyan-500 shadow-md'
                      : 'bg-white/90 text-slate-700 border-slate-200/90 hover:bg-white shadow-xs dark:bg-slate-900/80 dark:text-slate-300 dark:border-slate-700/80 dark:hover:bg-slate-800/90'
                  }`}
                >
                  <span>{cfg.emoji}</span>
                  <span className="font-bold font-mono">#{idx + 1}</span>
                  <span className="truncate max-w-[90px]">{stop.location_name.split(',')[0]}</span>
                </button>
              );
            })}
          </div>
        ) : stops.length > 0 && !showWaypoints ? (
          /* Expand Checkpoints Pill */
          <div className="absolute top-3 left-3 z-[500] pointer-events-auto animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowWaypoints(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800/90 shadow-md backdrop-blur-md text-[11px] font-semibold cursor-pointer transition group"
              title="Show Checkpoints Ribbon"
              aria-label="Show Checkpoints Ribbon"
            >
              <MapPin className="h-3.5 w-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
              <span>Checkpoints</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 text-[10px] font-mono font-bold">
                {stops.length}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>
          </div>
        ) : null}

        {/* Floating Stops Legend (Collapsible) */}
        {showLegend ? (
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 p-2.5 rounded-xl shadow-lg dark:shadow-xl z-[500] text-xs space-y-1.5 hidden sm:block animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80 pb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span>Stops Legend</span>
                <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono">({stops.length} pts)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title="Collapse Stops Legend"
                aria-label="Collapse Stops Legend"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span>🟢</span> Origin
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span>📦</span> Pickup (1h)
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span>🏁</span> Dropoff (1h)
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span>☕</span> 30m Rest Break
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span>🛏️</span> 10h Sleeper Berth
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span>⛽</span> Fueling
              </div>
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                <span>❌</span> Road Ends Here
              </div>
            </div>
          </div>
        ) : (
          /* Expand Stops Legend Pill */
          <button
            type="button"
            onClick={() => setShowLegend(true)}
            className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 px-2.5 py-1.5 rounded-lg shadow-lg z-[500] text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer transition group hidden sm:flex animate-in fade-in duration-200"
            title="Show Stops Legend"
            aria-label="Show Stops Legend"
          >
            <span className="text-[12px]">📍</span>
            <span className="text-[11px] font-bold">Legend</span>
            <ChevronUp className="h-3 w-3 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};
