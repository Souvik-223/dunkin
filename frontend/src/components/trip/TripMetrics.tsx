import React from 'react';
import type { TripSummary } from '../../types/trip';
import { Card, CardContent } from '../ui/Card';
import { Route, Clock, ShieldCheck, Moon, Calendar, Gauge } from 'lucide-react';

interface TripMetricsProps {
  summary: TripSummary;
}

export const TripMetrics: React.FC<TripMetricsProps> = ({ summary }) => {
  const arrivalDate = new Date(summary.estimated_arrival);
  const arrivalFormatted = arrivalDate.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ' @ ' + arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {/* Breakpoint Alert Banner if road ended */}
      {summary.has_breakpoint && (
        <div className="col-span-full p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">❌</span>
            <div>
              <div className="font-extrabold text-sm text-red-600 dark:text-red-400">
                Road Route Breakpoint Reached
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                {summary.breakpoint_message || 'No possible road routes available from this place.'}
              </div>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white shadow-xs">
            Route Terminated
          </span>
        </div>
      )}

      {/* 1. Total Distance */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Total Distance</span>
            <Route className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {summary.total_distance_miles.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mi</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Interstate highway</div>
        </CardContent>
      </Card>

      {/* 2. Total Trip Duration */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Trip Elapsed</span>
            <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
            {summary.total_duration_hours.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{summary.days_count} calendar day(s)</div>
        </CardContent>
      </Card>

      {/* 3. Driving Time */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Driving Time</span>
            <Gauge className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {summary.total_driving_hours.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">≤ 11h per shift</div>
        </CardContent>
      </Card>

      {/* 4. Rest & Sleep Time */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Rest & Sleeper</span>
            <Moon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">
            {summary.total_rest_hours.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">10h rests & 30m breaks</div>
        </CardContent>
      </Card>

      {/* 5. Cycle Remaining */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Cycle Remaining</span>
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {summary.cycle_remaining_hours.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">of 70.0h max</div>
        </CardContent>
      </Card>

      {/* 6. Estimated Arrival */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Estimated Arrival</span>
            <Calendar className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1" title={arrivalFormatted}>
            {arrivalFormatted}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Destination reached</div>
        </CardContent>
      </Card>
    </div>
  );
};
