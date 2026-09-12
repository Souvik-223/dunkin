import React from 'react';
import type { DutySegment, GraphPoint, ELDGridTotals } from '../../types/trip';

interface EldLogGridProps {
  segments: DutySegment[];
  graphPoints: GraphPoint[];
  totals: ELDGridTotals;
}

const ROW_LABELS = [
  { row: 1, name: '1. Off Duty' },
  { row: 2, name: '2. Sleeper Berth' },
  { row: 3, name: '3. Driving' },
  { row: 4, name: '4. On Duty (not driving)' },
];

export const EldLogGrid: React.FC<EldLogGridProps> = ({ graphPoints, totals }) => {
  // SVG coordinate dimensions
  const labelWidth = 140;
  const gridWidth = 720;
  const totalWidth = 60;
  const rowHeight = 36;
  const headerHeight = 28;
  const totalSvgWidth = labelWidth + gridWidth + totalWidth;
  const totalSvgHeight = headerHeight + rowHeight * 4;

  const hourWidth = gridWidth / 24;

  // Convert (hour, row) point to SVG (px, py)
  const toSvgCoords = (hour: number, row: number) => {
    const px = labelWidth + (hour / 24.0) * gridWidth;
    // Rows 1, 2, 3, 4 centered within their height
    const py = headerHeight + (row - 1) * rowHeight + rowHeight / 2;
    return { px, py };
  };

  // Build SVG path string for the stepped continuous duty status line
  let pathD = '';
  if (graphPoints.length > 0) {
    const first = toSvgCoords(graphPoints[0].x, graphPoints[0].y);
    pathD = `M ${first.px} ${first.py}`;
    for (let i = 1; i < graphPoints.length; i++) {
      const pt = toSvgCoords(graphPoints[i].x, graphPoints[i].y);
      pathD += ` L ${pt.px} ${pt.py}`;
    }
  }

  return (
    <div className="w-full overflow-x-auto bg-white text-slate-900 rounded-lg p-2 border border-slate-300 shadow-inner">
      <svg
        viewBox={`0 0 ${totalSvgWidth} ${totalSvgHeight}`}
        className="w-full h-auto select-none"
        style={{ minWidth: '820px' }}
      >
        {/* Top Header Bar */}
        <rect x="0" y="0" width={totalSvgWidth} height={headerHeight} fill="#0f172a" />
        <text
          x={labelWidth / 2}
          y={headerHeight / 2 + 4}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          fontWeight="bold"
          letterSpacing="0.5"
        >
          DUTY STATUS
        </text>

        {/* 24-Hour Markers */}
        {Array.from({ length: 25 }).map((_, i) => {
          const x = labelWidth + i * hourWidth;
          let hourLabel = `${i}`;
          if (i === 0 || i === 24) hourLabel = 'Mid-night';
          else if (i === 12) hourLabel = 'Noon';
          else if (i > 12) hourLabel = `${i - 12}`;

          return (
            <text
              key={`hour-header-${i}`}
              x={x}
              y={headerHeight / 2 + 4}
              textAnchor="middle"
              fill={i === 0 || i === 12 || i === 24 ? '#38bdf8' : '#e2e8f0'}
              fontSize={i === 0 || i === 12 || i === 24 ? '8.5' : '9.5'}
              fontWeight={i === 0 || i === 12 || i === 24 ? 'bold' : 'normal'}
            >
              {hourLabel}
            </text>
          );
        })}

        <text
          x={labelWidth + gridWidth + totalWidth / 2}
          y={headerHeight / 2 + 4}
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="9"
          fontWeight="bold"
        >
          TOTAL
        </text>

        {/* Row Backgrounds & Borders */}
        {ROW_LABELS.map((item, idx) => {
          const y = headerHeight + idx * rowHeight;
          const isEven = idx % 2 === 0;

          return (
            <g key={`row-bg-${item.row}`}>
              {/* Row Label Box */}
              <rect
                x="0"
                y={y}
                width={labelWidth}
                height={rowHeight}
                fill={isEven ? '#f8fafc' : '#ffffff'}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x="10"
                y={y + rowHeight / 2 + 4}
                fill="#0f172a"
                fontSize="11"
                fontWeight="600"
              >
                {item.name}
              </text>

              {/* Grid Area */}
              <rect
                x={labelWidth}
                y={y}
                width={gridWidth}
                height={rowHeight}
                fill={isEven ? '#f8fafc' : '#ffffff'}
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              {/* 15-Minute Ticks within each row */}
              {Array.from({ length: 24 }).map((_, hour) => {
                const hourX = labelWidth + hour * hourWidth;
                return (
                  <g key={`ticks-${idx}-${hour}`}>
                    {/* 15 min */}
                    <line
                      x1={hourX + hourWidth * 0.25}
                      y1={y}
                      x2={hourX + hourWidth * 0.25}
                      y2={y + 6}
                      stroke="#94a3b8"
                      strokeWidth="0.75"
                    />
                    {/* 30 min */}
                    <line
                      x1={hourX + hourWidth * 0.5}
                      y1={y}
                      x2={hourX + hourWidth * 0.5}
                      y2={y + 11}
                      stroke="#64748b"
                      strokeWidth="1"
                    />
                    {/* 45 min */}
                    <line
                      x1={hourX + hourWidth * 0.75}
                      y1={y}
                      x2={hourX + hourWidth * 0.75}
                      y2={y + 6}
                      stroke="#94a3b8"
                      strokeWidth="0.75"
                    />
                  </g>
                );
              })}

              {/* Total Hours Column */}
              <rect
                x={labelWidth + gridWidth}
                y={y}
                width={totalWidth}
                height={rowHeight}
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x={labelWidth + gridWidth + totalWidth / 2}
                y={y + rowHeight / 2 + 4}
                textAnchor="middle"
                fill="#0f172a"
                fontSize="12"
                fontWeight="700"
              >
                {item.row === 1 && totals.off_duty_hours.toFixed(1)}
                {item.row === 2 && totals.sleeper_berth_hours.toFixed(1)}
                {item.row === 3 && totals.driving_hours.toFixed(1)}
                {item.row === 4 && totals.on_duty_not_driving_hours.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Full Hour Vertical Dividing Lines */}
        {Array.from({ length: 25 }).map((_, i) => {
          const x = labelWidth + i * hourWidth;
          return (
            <line
              key={`hour-grid-line-${i}`}
              x1={x}
              y1={headerHeight}
              x2={x}
              y2={totalSvgHeight}
              stroke="#94a3b8"
              strokeWidth={i === 0 || i === 12 || i === 24 ? '1.5' : '1'}
              strokeDasharray={i === 0 || i === 12 || i === 24 ? 'none' : '2 2'}
            />
          );
        })}

        {/* The Continuous FMCSA Duty Status Line (Stepped Graph) */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#0284c7"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-sm"
          />
        )}
      </svg>
    </div>
  );
};
