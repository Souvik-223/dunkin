import React from 'react';
import type { ELDRemark } from '../../types/trip';

interface EldRemarksProps {
  remarks: ELDRemark[];
  fromLocation: string;
  toLocation: string;
}

export const EldRemarks: React.FC<EldRemarksProps> = ({ remarks, fromLocation, toLocation }) => {
  return (
    <div className="mt-3 border border-slate-300 rounded-lg p-3 bg-white text-slate-900 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-200 gap-2">
        <span className="font-bold text-sm tracking-wide uppercase text-slate-950">Remarks</span>
        <div className="text-[11px] text-slate-600 italic">
          Enter name of place you reported and where released from work, and when/where each change of duty occurred.
        </div>
      </div>

      {/* Shipping Documents Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-2 bg-slate-50 border border-slate-200 rounded">
        <div>
          <span className="font-semibold text-slate-700">Shipping Documents: </span>
          <span className="font-mono text-slate-900">BOL-884920 / Manifest #44109</span>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Shipper & Commodity: </span>
          <span className="text-slate-900 font-medium">Commercial Dry Freight ({fromLocation} → {toLocation})</span>
        </div>
      </div>

      {/* Remarks Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-[11px]">
              <th className="p-1.5 border border-slate-200 w-16">Time</th>
              <th className="p-1.5 border border-slate-200 w-32">Status</th>
              <th className="p-1.5 border border-slate-200 w-52">Location</th>
              <th className="p-1.5 border border-slate-200">Remarks / Operational Activity</th>
            </tr>
          </thead>
          <tbody>
            {remarks.map((item, idx) => (
              <tr key={`remark-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                <td className="p-1.5 border border-slate-200 font-mono font-semibold text-slate-950">{item.time}</td>
                <td className="p-1.5 border border-slate-200">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      item.status === 'DRIVING'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'ON_DUTY_NOT_DRIVING'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'SLEEPER_BERTH'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-1.5 border border-slate-200 font-medium text-slate-800 truncate max-w-xs" title={item.location}>
                  {item.location}
                </td>
                <td className="p-1.5 border border-slate-200 text-slate-700">{item.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
