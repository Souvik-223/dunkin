import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";
    
    const variants = {
      default: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 shadow-xs dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border-slate-700/60 dark:shadow-sm",
      primary: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 active:from-cyan-700 active:to-blue-700 shadow-sm shadow-cyan-600/30",
      secondary: "bg-slate-200/80 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
      outline: "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-transparent dark:hover:bg-slate-800/80 dark:text-slate-200",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white",
      destructive: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-sm shadow-red-500/30",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
