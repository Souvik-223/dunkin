import React from 'react';
import type { StopData } from '../../types/trip';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, MapPin, Coffee, Moon, Fuel, Navigation, Flag, PanelRightClose, XCircle, AlertOctagon } from 'lucide-react';

interface RouteTimelineProps {
  stops: StopData[];
  onClose?: () => void;
  onSelectStop?: (index: number) => void;
  selectedStopIndex?: number | null;
}

const STOP_BADGES: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' | 'secondary'; icon: React.ReactNode }> = {
  START: { label: 'Origin', variant: 'success', icon: <Navigation className="h-3.5 w-3.5" /> },
  PICKUP: { label: 'Pickup (1h Load)', variant: 'default', icon: <MapPin className="h-3.5 w-3.5 text-blue-400" /> },
  DROPOFF: { label: 'Dropoff (1h Unload)', variant: 'destructive', icon: <Flag className="h-3.5 w-3.5" /> },
  REST_30M: { label: '30m Break', variant: 'secondary', icon: <Coffee className="h-3.5 w-3.5 text-cyan-400" /> },
  REST_10H: { label: '10h Sleeper', variant: 'secondary', icon: <Moon className="h-3.5 w-3.5 text-purple-400" /> },
  FUEL: { label: 'Fuel Stop', variant: 'warning', icon: <Fuel className="h-3.5 w-3.5" /> },
  BREAKPOINT: { label: 'Road Ends Here', variant: 'destructive', icon: <XCircle className="h-3.5 w-3.5 text-red-500" /> },
};

export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  stops,
  onClose,
  onSelectStop,
  selectedStopIndex,
}) => {
  if (!stops || stops.length === 0) return null;

  const breakpointStop = stops.find((s) => s.stop_type === 'BREAKPOINT');

  return (
    <Card className="glass-card shadow-xl flex flex-col h-full max-h-[calc(100vh-210px)] min-h-[580px]">
      <CardHeader className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span>Route Milestones</span>
            <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              {stops.length} Stops
            </Badge>
          </CardTitle>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Collapse Route Sidebar"
              aria-label="Collapse Route Sidebar"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Click any waypoint to inspect and center map.
        </p>

        {/* Top Alert Banner when route terminates at a breakpoint */}
        {breakpointStop && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-800 dark:text-red-200 flex items-start gap-2 shadow-xs">
            <AlertOctagon className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <span>Road Network Breakpoint</span>
              </div>
              <div className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                No possible road routes available from <span className="font-bold text-red-600 dark:text-red-400 underline decoration-red-500/50">{breakpointStop.location_name}</span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {stops.map((stop, index) => {
            const isBreakpoint = stop.stop_type === 'BREAKPOINT';
            const config = STOP_BADGES[stop.stop_type] || {
              label: stop.stop_type,
              variant: 'default' as const,
              icon: <MapPin className="h-3.5 w-3.5" />,
            };

            const isSelected = selectedStopIndex === index;
            const arrival = new Date(stop.arrival_time);
            const formattedTime =
              arrival.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' }) +
              ' • ' +
              arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (isBreakpoint) {
              return (
                <div
                  key={`timeline-stop-${index}`}
                  onClick={() => onSelectStop?.(index)}
                  className="relative group cursor-pointer"
                >
                  {/* Node icon with glowing red cross */}
                  <div
                    className={`absolute -left-6 top-1 flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold transition-all shadow-xs bg-red-600 text-white ring-4 ring-red-500/30 ${
                      isSelected ? 'scale-110 ring-red-500/50' : 'group-hover:scale-105'
                    }`}
                  >
                    ❌
                  </div>

                  <div
                    className={`border rounded-xl p-3 transition-all bg-red-50/90 dark:bg-red-950/40 border-red-500/80 shadow-md ring-1 ring-red-500/30 ${
                      isSelected ? 'ring-2 ring-red-500 scale-[1.01]' : 'hover:border-red-400'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                      <Badge variant="destructive" className="gap-1 text-[10px] py-0 px-2 font-bold bg-red-600 text-white">
                        ❌ Road Ends Here
                      </Badge>
                      <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        Breakpoint
                      </span>
                    </div>

                    <div className="font-bold text-xs text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span>Road Network Terminus</span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug mb-1.5" title={stop.location_name}>
                      No possible road routes available from "{stop.location_name}"
                    </div>

                    <div className="text-[11px] text-red-800/90 dark:text-red-300/90 bg-red-500/10 dark:bg-red-900/30 border border-red-500/25 rounded-lg p-2.5 my-2 leading-relaxed">
                      The road network ends here or is separated by ocean / impassable terrain. Commercial interstate trucks cannot continue beyond this location by road.
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-red-600 dark:text-red-400 pt-1.5 border-t border-red-500/20 font-mono">
                      <span className="font-semibold">Status: Route Halted</span>
                      <span className="font-bold">{stop.miles_from_start.toFixed(0)} mi</span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-red-500/20">
                      <a
                        href={stop.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${stop.coordinates[0]},${stop.coordinates[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1 w-full text-[10px] font-semibold text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 bg-red-100/70 dark:bg-red-900/40 py-1 px-2 rounded-md transition border border-red-300 dark:border-red-800/50"
                      >
                        <span>🌐 View Breakpoint in Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`timeline-stop-${index}`}
                onClick={() => onSelectStop?.(index)}
                className="relative group cursor-pointer"
              >
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-1 flex items-center justify-center w-5 h-5 rounded-full text-[10px] transition-all shadow-xs ${
                    isSelected
                      ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/20 scale-110'
                      : 'bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 group-hover:border-cyan-500'
                  }`}
                >
                  {index + 1}
                </div>

                <div
                  className={`border rounded-xl p-3 transition-all ${
                    isSelected
                      ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-white/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={config.variant} className="gap-1 text-[10px] py-0 px-2 font-bold">
                        {config.label}
                      </Badge>
                      {stop.rating && (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                          ⭐ {stop.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {formattedTime}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mb-0.5 truncate" title={stop.location_name}>
                    {stop.location_name}
                  </div>

                  {stop.address && (
                    <div className="text-[10.5px] text-cyan-600 dark:text-cyan-400 mb-1.5 flex items-start gap-1 leading-snug">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-cyan-500" />
                      <span className="line-clamp-1">{stop.address}</span>
                    </div>
                  )}

                  {stop.photo_url && (
                    <div className="relative w-full h-16 rounded-lg overflow-hidden my-1.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                      <img
                        src={stop.photo_url}
                        alt={stop.location_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-1 left-1.5 text-[8.5px] font-bold bg-slate-950/80 text-cyan-300 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        Verified Facility
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-1.5 leading-tight line-clamp-2">
                    {stop.description}
                  </p>

                  {stop.amenities && stop.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {stop.amenities.slice(0, 3).map((amenity, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-[9px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/80 dark:border-slate-900 font-mono">
                    <span>
                      {stop.duration_hours > 0 ? `${stop.duration_hours}h duration` : 'Immediate'}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {stop.miles_from_start.toFixed(0)} mi
                    </span>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-900/60">
                    <a
                      href={stop.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${stop.coordinates[0]},${stop.coordinates[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center gap-1 w-full text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-cyan-50/60 dark:bg-cyan-950/30 hover:bg-cyan-100/60 dark:hover:bg-cyan-900/40 py-1 px-2 rounded-md transition border border-cyan-200 dark:border-cyan-800/40"
                    >
                      <span>🌐 Open in Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
