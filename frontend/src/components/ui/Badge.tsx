import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "border-slate-200 bg-slate-100 text-slate-800 dark:border-transparent dark:bg-slate-800 dark:text-slate-200",
    secondary: "border-slate-200 bg-slate-200/70 text-slate-700 dark:border-transparent dark:bg-slate-700/70 dark:text-slate-300",
    success: "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    warning: "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    destructive: "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    outline: "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
