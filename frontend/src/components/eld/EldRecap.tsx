import React from 'react';
import type { ELDRecap } from '../../types/trip';

interface EldRecapProps {
  recap: ELDRecap;
}

export const EldRecap: React.FC<EldRecapProps> = ({ recap }) => {
  return (
    <div className="mt-3 border border-slate-300 rounded-lg p-3 bg-white text-slate-900 text-xs">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
        <span className="font-bold text-xs uppercase tracking-wide text-slate-950">
          Recap: Complete at end of day (70 Hour / 8 Day Drivers)
        </span>
        <span className="text-[10px] text-slate-500 italic">
          *If you took 34 consecutive hours off duty you have 70 hours available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        {/* Box 1: On duty hours today */}
        <div className="border border-slate-200 rounded p-2 bg-slate-50">
          <div className="text-[11px] text-slate-600 font-medium mb-1">
            On duty hours today <br />
            <span className="text-[10px] text-slate-400">(Total Lines 3 & 4)</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {recap.on_duty_hours_today.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
        </div>

        {/* Box 2: Total on duty last 7 days */}
        <div className="border border-slate-200 rounded p-2 bg-slate-50">
          <div className="text-[11px] text-slate-600 font-medium mb-1">
            A. Total hours on duty last 7 days <br />
            <span className="text-[10px] text-slate-400">(including today)</span>
          </div>
          <div className="text-xl font-bold text-blue-700 font-mono">
            {recap.total_hours_last_7_days_including_today.toFixed(1)} / {recap.cycle_limit.toFixed(0)}{' '}
            <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
        </div>

        {/* Box 3: Total hours available tomorrow */}
        <div className="border border-slate-200 rounded p-2 bg-slate-50">
          <div className="text-[11px] text-slate-600 font-medium mb-1">
            B. Total hours available tomorrow <br />
            <span className="text-[10px] text-slate-400">(70 hr. minus A*)</span>
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono">
            {recap.total_hours_available_tomorrow.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
