import React, { useState } from 'react';
import type { TripHistoryItem } from '../../types/trip';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  History,
  Navigation,
  MapPin,
  Flag,
  Calendar,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ArrowRight,
  Route
} from 'lucide-react';

interface TripHistoryProps {
  history: TripHistoryItem[];
  currentTripId?: number | null;
  onLoadTrip: (tripId: number) => Promise<void>;
  onDeleteTrip: (tripId: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoadingHistory?: boolean;
}

export const TripHistory: React.FC<TripHistoryProps> = ({
  history,
  currentTripId,
  onLoadTrip,
  onDeleteTrip,
  onRefresh,
  isLoadingHistory = false,
}) => {
  const [loadingTripId, setLoadingTripId] = useState<number | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLoad = async (id: number) => {
    try {
      setLoadingTripId(id);
      await onLoadTrip(id);
    } finally {
      setLoadingTripId(null);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this trip from your history?')) {
      return;
    }
    try {
      setDeletingTripId(id);
      await onDeleteTrip(id);
    } finally {
      setDeletingTripId(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="glass-card shadow-xl border-slate-200/80 dark:border-slate-800/80">
      <CardHeader className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Trip History &amp; Previous Rides</span>
                <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                  {history.length} Saved
                </Badge>
              </CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Every calculated trip is automatically saved. Click any ride to instantly load its route, verified stops, and ELD log sheets.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingHistory}
            className="h-8 px-2.5 text-xs gap-1.5 font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-500' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 p-3 sm:p-4">
        {history.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
            <Route className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Previous Rides Saved Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              When you calculate any compliant route from the top parameters banner, it is automatically persisted to the database and will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((trip) => {
              const isCurrent = currentTripId === trip.id;
              const isLoading = loadingTripId === trip.id;
              const isDeleting = deletingTripId === trip.id;

              const createdDate = new Date(trip.created_at);
              const formattedDate = createdDate.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) + ' • ' + createdDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={trip.id}
                  onClick={() => handleLoad(trip.id)}
                  className={`relative p-3 sm:p-4 rounded-xl border transition-all cursor-pointer group ${
                    isCurrent
                      ? 'bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-sm dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Waypoint Chain */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          #{trip.id}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{formattedDate}</span>
                        </span>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/60 px-2 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-700">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Active Loaded Trip</span>
                          </span>
                        )}
                      </div>

                      {/* Route Waypoint Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                          <Navigation className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={trip.current_location}>
                            {trip.current_location}
                          </span>
                        </span>

                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

                        <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={trip.pickup_location}>
                            {trip.pickup_location}
                          </span>
                        </span>

                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

                        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/60">
                          <Flag className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={trip.dropoff_location}>
                            {trip.dropoff_location}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Metrics & Actions */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700/60">
                          {trip.total_distance_miles.toFixed(0)} mi
                        </span>
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                          {trip.total_duration_hours.toFixed(1)}h ({trip.days_count}d)
                        </span>
                        <span className="hidden sm:inline px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60" title="Cycle hours used at start">
                          ⏱️ {trip.current_cycle_used_hours}h cycle
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isCurrent ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoad(trip.id);
                          }}
                          disabled={isLoading}
                          className={`h-8 px-3 text-xs gap-1.5 font-bold cursor-pointer transition ${
                            isCurrent
                              ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                              : 'text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800/60'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Route className="h-3.5 w-3.5" />
                              <span>{isCurrent ? 'Active' : 'Load Ride'}</span>
                            </>
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(trip.id, e)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Delete trip from history"
                          aria-label="Delete trip from history"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
