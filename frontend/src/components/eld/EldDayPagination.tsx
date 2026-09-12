import React from 'react';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Printer, Download, Maximize2, Minimize2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface EldDayPaginationProps {
  currentDayIndex: number;
  totalDays: number;
  onDayChange: (index: number) => void;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
  onEnlarge?: () => void;
  isEnlarged?: boolean;
}

export const EldDayPagination: React.FC<EldDayPaginationProps> = ({
  currentDayIndex,
  totalDays,
  onDayChange,
  sheetRef,
  onEnlarge,
  isEnlarged = false,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!sheetRef?.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(sheetRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // High resolution for crisp paper text
      });
      const link = document.createElement('a');
      link.download = `driver-daily-log-day-${currentDayIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download log image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/90 border border-slate-200/90 rounded-xl mb-4 shadow-sm dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-none no-print">
      {/* Day Switcher Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDayChange(Math.max(0, currentDayIndex - 1))}
          disabled={currentDayIndex === 0}
          title="Previous Day"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1.5 px-2">
          {Array.from({ length: totalDays }).map((_, idx) => (
            <button
              key={`day-pill-${idx}`}
              onClick={() => onDayChange(idx)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                idx === currentDayIndex
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Day {idx + 1}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDayChange(Math.min(totalDays - 1, currentDayIndex + 1))}
          disabled={currentDayIndex === totalDays - 1}
          title="Next Day"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownloadImage}
          isLoading={isExporting}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5 text-cyan-400" />
          Download PNG
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handlePrint}
          className="gap-1.5"
        >
          <Printer className="h-3.5 w-3.5" />
          Print Log Sheet
        </Button>

        {onEnlarge && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEnlarge}
            className="gap-1.5 cursor-pointer"
            title={isEnlarged ? "Exit Fullscreen Modal" : "Enlarge ELD Logs to Fullscreen Modal"}
          >
            {isEnlarged ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Enlarge</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
