import React from 'react';
import { cn } from '../../lib/utils';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 select-none block mb-1.5",
        className
      )}
      {...props}
    />
  );
}
