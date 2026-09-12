import React from 'react';
import type { ELDLogSheet as ELDLogSheetType } from '../../types/trip';
import { EldLogGrid } from './EldLogGrid';
import { EldRemarks } from './EldRemarks';
import { EldRecap } from './EldRecap';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface EldLogSheetProps {
  sheet: ELDLogSheetType;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
}

export const EldLogSheet: React.FC<EldLogSheetProps> = ({ sheet, sheetRef }) => {
  const { header, grid_data, remarks, recap, day_number, total_days, formatted_date } = sheet;

  return (
    <div
      ref={sheetRef}
      className="fmcsa-paper-sheet text-slate-900 border-2 border-slate-700 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto transition-all"
    >
      {/* Top Header Section */}
      <div className="border-b-2 border-slate-900 pb-4 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase font-serif">
                Drivers Daily Log
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                FMCSA CERTIFIED
              </span>
            </div>
            <div className="text-xs font-bold text-slate-700">
              (24 hours) — In accordance with 49 CFR Part 395 (Hours of Service of Drivers)
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Original — File at home terminal. Duplicate — Driver retains in personal possession for 8 days.
            </div>
          </div>

          <div className="text-right flex flex-col sm:items-end">
            <div className="inline-block border-2 border-slate-900 px-3 py-1.5 rounded-lg bg-slate-50 shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold mr-2">Log Date:</span>
              <span className="text-sm font-black font-mono text-slate-950">{formatted_date}</span>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-black text-blue-700 mt-1.5 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <CheckCircle2 className="h-3 w-3 text-blue-600" />
              Day {day_number} of {total_days}
            </div>
          </div>
        </div>

        {/* Route From / To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-slate-600 shrink-0">From: </span>
            <span className="font-semibold text-slate-950 border-b border-slate-400 pb-0.5 flex-1 truncate">
              {header.from_location}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-slate-600 shrink-0">To: </span>
            <span className="font-semibold text-slate-950 border-b border-slate-400 pb-0.5 flex-1 truncate">
              {header.to_location}
            </span>
          </div>
        </div>

        {/* 3 Metrics Boxes & Carrier Info Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {/* Mileage & Equipment Boxes */}
          <div className="space-y-2">
            <div className="border border-slate-800 rounded-lg p-2 bg-slate-50 text-center shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-600">Total Miles Driving Today</div>
              <div className="text-xl font-black font-mono text-slate-950">
                {header.total_miles_driving_today.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-600">mi</span>
              </div>
            </div>
            <div className="border border-slate-800 rounded-lg p-2 bg-slate-50 text-center shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-600">Truck / Tractor & Trailer No.</div>
              <div className="text-xs font-black font-mono text-slate-950 truncate" title={header.truck_tractor_numbers}>
                {header.truck_tractor_numbers}
              </div>
            </div>
          </div>

          {/* Carrier Lines */}
          <div className="md:col-span-2 space-y-2 text-xs flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0 w-32">Carrier Name:</span>
              <span className="font-semibold text-slate-950 border-b border-slate-300 pb-0.5 flex-1 truncate">
                {header.carrier_name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0 w-32">Main Office:</span>
              <span className="text-slate-800 border-b border-slate-300 pb-0.5 flex-1 truncate">
                {header.main_office_address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0 w-32">Home Terminal:</span>
              <span className="text-slate-800 border-b border-slate-300 pb-0.5 flex-1 truncate">
                {header.home_terminal_address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0 w-32">Driver Name:</span>
              <span className="font-black text-slate-950 border-b border-slate-300 pb-0.5 flex-1">
                {header.driver_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* The 24-Hour Graph Grid */}
      <div className="my-3">
        <EldLogGrid
          segments={grid_data.segments}
          graphPoints={grid_data.graph_points}
          totals={grid_data.totals}
        />
      </div>

      {/* Remarks Section */}
      <EldRemarks
        remarks={remarks}
        fromLocation={header.from_location}
        toLocation={header.to_location}
      />

      {/* Recap Section */}
      <EldRecap recap={recap} />

      {/* Driver Certification Signature Line */}
      <div className="mt-5 pt-3 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
        <div className="font-medium text-[11px]">
          I certify that these entries are true, correct, and in full compliance with federal Hours of Service rules:
        </div>
        <div className="font-mono font-bold text-slate-950 border-b-2 border-slate-900 px-6 pb-1 min-w-[220px] text-center">
          /s/ {header.driver_name}
        </div>
      </div>
    </div>
  );
};
