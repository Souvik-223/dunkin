import React, { useState, useEffect } from 'react';
import type { TripInput, TripPreset, TripPlanResult } from '../../types/trip';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LocationSearchInput } from './LocationSearchInput';
import {
  MapPin,
  Navigation,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Truck,
  Building,
  User,
  ArrowUpDown,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

interface TripInputFormProps {
  onSubmit: (input: TripInput) => void;
  isLoading: boolean;
  presets?: TripPreset[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  activeTrip?: TripPlanResult | null;
}

export const TripInputForm: React.FC<TripInputFormProps> = ({
  onSubmit,
  isLoading,
  presets = [],
  isCollapsed = false,
  onToggleCollapse,
  onClose,
  activeTrip,
}) => {
  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleUsed, setCycleUsed] = useState(0.0);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [driverName, setDriverName] = useState('John Doe / Driver #1');
  const [carrierName, setCarrierName] = useState('Dunkin Freight Logistics');
  const [truckNo, setTruckNo] = useState('TRK-9842 / TRL-4412');

  // Synchronize inputs when an active trip is loaded from history
  useEffect(() => {
    if (activeTrip?.locations) {
      setCurrentLocation(activeTrip.locations.origin?.display_name || '');
      setPickupLocation(activeTrip.locations.pickup?.display_name || '');
      setDropoffLocation(activeTrip.locations.dropoff?.display_name || '');
      if (activeTrip.summary?.initial_cycle_used_hours !== undefined) {
        setCycleUsed(activeTrip.summary.initial_cycle_used_hours);
      }
    }
  }, [activeTrip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used_hours: Number(cycleUsed),
      driver_name: driverName,
      carrier_name: carrierName,
      truck_tractor_no: truckNo,
    });
  };

  const handleApplyPreset = (preset: TripPreset) => {
    setCurrentLocation(preset.current_location);
    setPickupLocation(preset.pickup_location);
    setDropoffLocation(preset.dropoff_location);
    setCycleUsed(preset.current_cycle_used_hours);
  };

  const handleSwapLocations = () => {
    const temp = currentLocation;
    setCurrentLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  const remainingCycle = Math.max(0, 70.0 - cycleUsed);

  const getCycleColor = (used: number) => {
    if (used < 45) return 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-950/60';
    if (used < 60) return 'text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-950/60';
    return 'text-rose-700 bg-rose-50 border-rose-300 dark:text-rose-400 dark:border-rose-500/30 dark:bg-rose-950/60';
  };

  // Minimized Compact Summary Bar when collapsed
  if (isCollapsed) {
    return (
      <Card className="glass-card shadow-md animate-in fade-in duration-200">
        <div className="p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-7 w-7 rounded-lg bg-cyan-600/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider hidden sm:inline">
                Active Route:
              </span>
            </div>

            {currentLocation || pickupLocation || dropoffLocation ? (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 flex items-center gap-1.5 font-semibold text-[11px] shadow-xs">
                  <span>🟢</span>
                  <span className="truncate max-w-[120px]">{currentLocation || 'Origin'}</span>
                </span>
                <span className="text-slate-400">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 flex items-center gap-1.5 font-semibold text-[11px] shadow-xs">
                  <span>📦</span>
                  <span className="truncate max-w-[120px]">{pickupLocation || 'Pickup'}</span>
                </span>
                <span className="text-slate-400">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 flex items-center gap-1.5 font-semibold text-[11px] shadow-xs">
                  <span>🏁</span>
                  <span className="truncate max-w-[120px]">{dropoffLocation || 'Dropoff'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-mono font-bold text-[10px]">
                  ⏱️ {cycleUsed.toFixed(1)}h / 70h
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                No active route entered yet. Click "Edit Parameters" to plan a route.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {presets.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-[10px] uppercase tracking-wider font-bold">Presets:</span>
                {presets.slice(0, 3).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      handleApplyPreset(preset);
                      if (onToggleCollapse) onToggleCollapse();
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    {preset.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {(onToggleCollapse || onClose) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleCollapse || onClose}
                className="h-8 px-3 gap-1.5 text-xs font-semibold cursor-pointer hover:border-cyan-500/50"
              >
                <Sliders className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Edit Parameters</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Full Expanded Top Horizontal Banner
  return (
    <Card className="glass-card shadow-xl relative z-30 animate-in fade-in duration-200">
      <CardHeader className="py-3 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/30 dark:shadow-cyan-900/40 text-white shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Trip & Route Parameters</span>
                <Badge variant="outline" className="text-cyan-600 border-cyan-500/40 bg-cyan-50/50 dark:text-cyan-400 dark:border-cyan-500/30 dark:bg-transparent font-mono text-[10px]">
                  FMCSA 70h/8d Active
                </Badge>
              </CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Specify origin, pickup, dropoff locations, and prior cycle hours to calculate compliance schedule.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Demo Presets */}
            {presets.length > 0 && (
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="flex items-center gap-1 px-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold hidden sm:inline-flex">
                  <Sparkles className="h-3 w-3" />
                  Presets:
                </span>
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2 py-1 rounded text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title={`${preset.title}: ${preset.current_location} → ${preset.dropoff_location}`}
                  >
                    {preset.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {(onToggleCollapse || onClose) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse || onClose}
                className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                title="Collapse Trip Parameters"
                aria-label="Collapse Trip Parameters"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main 4-Column Responsive Parameter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* 1. Current Location */}
            <div className="relative focus-within:z-50">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="current-location" className="mb-0 text-xs font-bold text-slate-800 dark:text-slate-200">
                  1. Current Location (Origin)
                </Label>
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer font-semibold"
                  title="Swap Origin and Dropoff"
                >
                  <ArrowUpDown className="h-2.5 w-2.5" />
                  Swap
                </button>
              </div>
              <LocationSearchInput
                id="current-location"
                value={currentLocation}
                onChange={setCurrentLocation}
                placeholder="Search origin (e.g. Chicago, IL or Paris)..."
                required
                accentColor="emerald"
                icon={<Navigation className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
              />
            </div>

            {/* 2. Pickup Location */}
            <div className="relative focus-within:z-50">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="pickup-location" className="mb-0 text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. Pickup Location (Loading)
                </Label>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                  +1.0h Load
                </span>
              </div>
              <LocationSearchInput
                id="pickup-location"
                value={pickupLocation}
                onChange={setPickupLocation}
                placeholder="Search pickup (e.g. St. Louis, MO)..."
                required
                accentColor="blue"
                icon={<MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
              />
            </div>

            {/* 3. Dropoff Location */}
            <div className="relative focus-within:z-50">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="dropoff-location" className="mb-0 text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. Dropoff Location (Unloading)
                </Label>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                  +1.0h Unload
                </span>
              </div>
              <LocationSearchInput
                id="dropoff-location"
                value={dropoffLocation}
                onChange={setDropoffLocation}
                placeholder="Search dropoff (e.g. Los Angeles, CA)..."
                required
                accentColor="rose"
                icon={<MapPin className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
              />
            </div>

            {/* 4. Current Cycle Used Gauge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="cycle-hours" className="mb-0 text-xs font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                  <Clock className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                  Cycle Used
                </Label>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${getCycleColor(cycleUsed)}`}>
                  {cycleUsed.toFixed(1)} / 70h ({remainingCycle.toFixed(1)}h left)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="0.5"
                  value={cycleUsed}
                  onChange={(e) => setCycleUsed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
                <div className="relative flex items-center shrink-0">
                  <input
                    id="cycle-hours"
                    type="number"
                    min="0"
                    max="70"
                    step="0.5"
                    value={cycleUsed}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCycleUsed(isNaN(val) ? 0 : Math.min(70, Math.max(0, val)));
                    }}
                    className="h-9 w-20 rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-950/60 pl-2 pr-6 text-center font-mono font-bold text-xs text-slate-900 dark:text-slate-100 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                    h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Carrier / Driver Log Sheet Details */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800 animate-in fade-in duration-150">
              <div>
                <Label htmlFor="driver-name" className="text-xs">Driver Name</Label>
                <Input
                  id="driver-name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  icon={<User className="h-3.5 w-3.5 text-slate-400" />}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="carrier-name" className="text-xs">Carrier / Fleet Name</Label>
                <Input
                  id="carrier-name"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  icon={<Building className="h-3.5 w-3.5 text-slate-400" />}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="truck-no" className="text-xs">Truck/Tractor & Trailer No.</Label>
                <Input
                  id="truck-no"
                  value={truckNo}
                  onChange={(e) => setTruckNo(e.target.value)}
                  icon={<Truck className="h-3.5 w-3.5 text-slate-400" />}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Bottom Action Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/70 dark:border-slate-800/70">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 font-semibold cursor-pointer transition"
            >
              <Building className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{showAdvanced ? 'Hide Log Sheet Header Settings' : 'Customize Carrier & Driver (Log Sheet Header)'}</span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>49 CFR § 395 11h/14h/30m/10h Compliant</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                className="font-bold shadow-md shadow-cyan-900/30 text-xs px-5 h-9 cursor-pointer"
              >
                Calculate Route & Generate Logs
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
