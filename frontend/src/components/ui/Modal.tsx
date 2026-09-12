import React, { useEffect } from 'react';
import { Minimize2 } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  size?: 'full' | 'xl' | 'lg';
  hideHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  headerActions,
  children,
  contentClassName = '',
  size = 'full',
  hideHeader = false,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    full: 'w-[98vw] h-[98vh] max-w-[98.5vw] max-h-[98.5vh]',
    xl: 'w-full max-w-6xl h-[85vh]',
    lg: 'w-full max-w-4xl h-[75vh]',
  }[size];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-1 sm:p-2 md:p-[1vw] no-print animate-in fade-in duration-200"
    >
      {/* Blurred backdrop with 2% visible screen edge blur */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div
        className={`relative z-10 flex flex-col rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-2xl transition-all duration-200 ${sizeClasses}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (renders only when hideHeader is false) */}
        {!hideHeader && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <div className="flex items-center gap-2">
                  {typeof title === 'string' ? (
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                      {title}
                    </h2>
                  ) : (
                    title
                  )}
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}

              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-7 px-2.5 gap-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Close modal (Esc)"
                aria-label="Close modal"
              >
                <Minimize2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="hidden sm:inline">Close</span>
                <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.2 text-[9px] font-mono bg-slate-200/80 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
                  ESC
                </kbd>
              </Button>
            </div>
          </div>
        )}

        {/* Modal Content Body */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
