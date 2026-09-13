import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X, Globe, Check } from 'lucide-react';
import { tripApi } from '../../api/tripApi';
import type { LocationSuggestion } from '../../types/trip';
import { cn } from '../../lib/utils';

export interface LocationSearchInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  accentColor?: 'emerald' | 'blue' | 'rose' | 'cyan';
  className?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  id,
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'Search any city worldwide...',
  required = false,
  disabled = false,
  icon,
  accentColor = 'cyan',
  className,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUserTypingRef = useRef(false);

  // Synchronize when external value changes (e.g. preset applied, swap button clicked, or history loaded)
  useEffect(() => {
    if (value !== query) {
      isUserTypingRef.current = false;
      setQuery(value);
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [value]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search effect triggered by active user input
  useEffect(() => {
    if (!isUserTypingRef.current) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await tripApi.searchLocations(trimmed, controller.signal);
        const validResults = results || [];
        setSuggestions(validResults);
        setIsOpen(validResults.length > 0);
        setHighlightedIndex(-1);
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          console.warn('Location search error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    isUserTypingRef.current = true;
    setQuery(newVal);
    onChange(newVal);
  };

  const handleSelect = (item: LocationSuggestion) => {
    isUserTypingRef.current = false;
    const selectedText = item.short_name || item.name;
    setQuery(selectedText);
    onChange(selectedText);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleClear = () => {
    isUserTypingRef.current = false;
    setQuery('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const colorVariants = {
    emerald: 'focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500',
    blue: 'focus-visible:ring-blue-500/40 focus-visible:border-blue-500',
    rose: 'focus-visible:ring-rose-500/40 focus-visible:border-rose-500',
    cyan: 'focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500',
  };

  const iconColorVariants = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800/60',
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", isOpen ? "z-50" : "z-0")}>
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 z-10">
            {icon}
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs",
            "dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500",
            "focus-visible:outline-none focus-visible:ring-2 transition-all",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-9" : "pl-3",
            query ? "pr-14" : "pr-8",
            colorVariants[accentColor],
            className
          )}
        />

        {/* Right side status / buttons */}
        <div className="absolute right-2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
          )}

          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer transition"
              title="Clear location"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Google Maps-Style Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              Worldwide Cities
            </span>
            <span>Use ↑↓ to navigate</span>
          </div>

          <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 py-1 text-xs">
            {suggestions.map((item, index) => {
              const isSelected = index === highlightedIndex;
              return (
                <li
                  key={item.id || `${item.name}-${index}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors text-left",
                    isSelected
                      ? "bg-cyan-500/10 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-100"
                      : "text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("p-1.5 rounded-lg border shrink-0 flex items-center justify-center", iconColorVariants[accentColor])}>
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate text-xs flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.state && (
                          <span className="font-normal text-slate-500 dark:text-slate-400 text-[11px]">
                            {item.state}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.display_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.country_code && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-[10px] uppercase border border-slate-200 dark:border-slate-700">
                        {item.country_code}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
