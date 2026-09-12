import { useState, useEffect, useRef } from 'react';
import { tripApi } from './api/tripApi';
import type { TripInput, TripPreset, TripPlanResult, TripHistoryItem } from './types/trip';
import { TripInputForm } from './components/trip/TripInputForm';
import { TripMetrics } from './components/trip/TripMetrics';
import { RouteTimeline } from './components/trip/RouteTimeline';
import { RouteMap } from './components/map/RouteMap';
import { EldLogSheet } from './components/eld/EldLogSheet';
import { EldDayPagination } from './components/eld/EldDayPagination';
import { TripHistory } from './components/trip/TripHistory';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import {
  Truck,
  Map,
  FileText,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sun,
  Moon,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Sliders,
  History,
} from 'lucide-react';

export function App() {
  const [presets, setPresets] = useState<TripPreset[]>([]);
  const [tripResult, setTripResult] = useState<TripPlanResult | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [isTopFormOpen, setIsTopFormOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [enlargedModal, setEnlargedModal] = useState<'map' | 'eld' | null>(null);

  // Trip History state
  const [historyItems, setHistoryItems] = useState<TripHistoryItem[]>([]);
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Theme management: persisted to localStorage, defaults to dark
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('spotter_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('spotter_theme', theme);
  }, [theme]);

  const logSheetRef = useRef<HTMLDivElement>(null);
  const modalLogSheetRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const items = await tripApi.getHistory();
      setHistoryItems(items);
    } catch (err) {
      console.error('Failed to load trip history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initial load: Fetch presets & run baseline trip
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load presets and existing history concurrently
        const [loadedPresets] = await Promise.all([
          tripApi.getPresets(),
          loadHistory(),
        ]);
        setPresets(loadedPresets);

        // Run default calculation on initial load so page opens pre-filled and impressive
        setIsLoading(true);
        const defaultTrip = await tripApi.planTrip({
          current_location: 'Chicago, IL',
          pickup_location: 'St. Louis, MO',
          dropoff_location: 'Los Angeles, CA',
          current_cycle_used_hours: 15.0,
          driver_name: 'John Doe / Driver #1',
          carrier_name: 'Spotter Freight Logistics',
          truck_tractor_no: 'TRK-9842 / TRL-4412',
        });
        setTripResult(defaultTrip);
        // Refresh history to include this initial baseline trip
        loadHistory();
      } catch (err: any) {
        console.error('Initial load failed', err);
        setError('Failed to connect to backend service. Ensure Django server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const handlePlanTrip = async (input: TripInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await tripApi.planTrip(input);
      setTripResult(result);
      setSelectedDayIndex(0);
      setSelectedStopIndex(null);
      // Automatically refresh history to include newly saved ride
      loadHistory();
    } catch (err: any) {
      console.error('Failed to plan trip', err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err.message ||
        'Failed to calculate route and logs.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTrip = async (tripId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullTrip = await tripApi.getTripById(tripId);
      setTripResult(fullTrip);
      setCurrentTripId(tripId);
      setSelectedDayIndex(0);
      setSelectedStopIndex(null);
      setActiveTab('map');
    } catch (err: any) {
      console.error('Failed to load trip from history', err);
      setError('Failed to load previous trip from history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    try {
      await tripApi.deleteTrip(tripId);
      setHistoryItems((prev) => prev.filter((item) => item.id !== tripId));
      if (currentTripId === tripId) {
        setCurrentTripId(null);
      }
    } catch (err: any) {
      console.error('Failed to delete trip', err);
      setError('Failed to delete trip from history.');
    }
  };

  const currentSheet = tripResult?.log_sheets?.[selectedDayIndex];

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation Bar (Slim, Edge-to-Edge) */}
      <header className="border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 no-print transition-colors duration-200">
        <div className="w-[98vw] max-w-[1920px] mx-auto px-2 sm:px-4 h-12 sm:h-13 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/30 dark:shadow-cyan-900/40 shrink-0">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">SPOTTER</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-cyan-600 border-cyan-500/40 bg-cyan-50/50 dark:text-cyan-400 dark:border-cyan-500/30 dark:bg-transparent font-mono">
                  HOS & ELD
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none mt-0.5">
                Interstate Truck Route Planner & FMCSA 24-Hour Paper Log Generator
              </p>
            </div>
          </div>

          {/* Action Bar: Sidebar Toggles & Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Top Parameters Banner Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTopFormOpen(!isTopFormOpen)}
              className={`h-8 px-2.5 text-xs gap-1.5 transition-all cursor-pointer ${
                isTopFormOpen
                  ? 'border-cyan-500/50 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title={isTopFormOpen ? 'Collapse Trip Parameters Banner' : 'Expand Trip Parameters Banner'}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden md:inline font-semibold">Trip Parameters</span>
            </Button>

            {/* Right Sidebar Toggle (Route Milestones) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`h-8 px-2.5 text-xs gap-1.5 transition-all cursor-pointer ${
                isRightSidebarOpen
                  ? 'border-cyan-500/50 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title={isRightSidebarOpen ? 'Collapse Route Milestones Sidebar' : 'Expand Route Milestones Sidebar'}
            >
              <PanelRight className="h-3.5 w-3.5" />
              <span className="hidden md:inline font-semibold">Route Milestones</span>
              {tripResult?.stops && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 px-1 py-0 text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {tripResult.stops.length}
                </Badge>
              )}
            </Button>

            {/* Tactile Light / Dark Mode 1-Click Toggle Switch */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs select-none
                bg-white/90 hover:bg-slate-100 border-slate-200/90 text-slate-800
                dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-200"
              title={`Currently in ${theme === 'dark' ? 'Dark' : 'Light'} mode. Click to switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode.`}
              aria-label="Toggle theme mode"
            >
              <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors">
                {theme === 'dark' ? (
                  <Moon className="h-3 w-3 text-cyan-400 fill-cyan-400/20" />
                ) : (
                  <Sun className="h-3 w-3 text-amber-500 fill-amber-500/20" />
                )}
              </div>
              <span className="text-[11px] font-bold tracking-tight hidden sm:inline">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-700/60">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    theme === 'dark'
                      ? 'bg-cyan-400 shadow-xs shadow-cyan-400/50'
                      : 'bg-amber-400 shadow-xs shadow-amber-400/50'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container (98vw Edge-to-Edge Coverage) */}
      <main className="flex-1 w-[98vw] max-w-[1920px] mx-auto px-1 sm:px-2 py-2 space-y-2.5">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. TOP: Trip & Route Parameters Banner (Collapsible) */}
        <section className="no-print">
          <TripInputForm
            onSubmit={handlePlanTrip}
            isLoading={isLoading}
            presets={presets}
            isCollapsed={!isTopFormOpen}
            onToggleCollapse={() => setIsTopFormOpen(!isTopFormOpen)}
            onClose={() => setIsTopFormOpen(false)}
          />
        </section>

        {/* 2. KPI Metric Summary Cards */}
        {tripResult?.summary && <TripMetrics summary={tripResult.summary} />}

        {/* 3. Main Workspace: Dynamic Stage (Map / ELD / Rules) + Collapsible Route Milestones Right Sidebar */}
        <div className="flex flex-col xl:flex-row items-start gap-4 w-full">
          {/* Main Stage: Dynamic Visualizer (Map / FMCSA ELD Log / Rules) */}
          <section className="flex-1 min-w-0 w-full space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-wrap items-center justify-between gap-3 no-print">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
                  <TabsTrigger value="map" icon={<Map className="h-4 w-4" />}>
                    Interactive Map
                  </TabsTrigger>
                  <TabsTrigger value="eld" icon={<FileText className="h-4 w-4" />}>
                    FMCSA ELD Logs
                    {tripResult?.log_sheets && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-cyan-300 text-[10px] font-bold">
                        {tripResult.log_sheets.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history" icon={<History className="h-4 w-4" />}>
                    Trip History
                    {historyItems.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-cyan-300 text-[10px] font-bold font-mono">
                        {historyItems.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="rules" icon={<ShieldCheck className="h-4 w-4" />}>
                    Regulations
                  </TabsTrigger>
                </TabsList>

                {(activeTab === 'map' || activeTab === 'eld') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnlargedModal(activeTab as 'map' | 'eld')}
                    className="h-9 px-3 text-xs gap-1.5 font-semibold text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/50 cursor-pointer"
                    title={`Enlarge ${activeTab === 'map' ? 'Interactive Map' : 'FMCSA ELD Logs'} to Fullscreen Modal`}
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="hidden sm:inline">Enlarge {activeTab === 'map' ? 'Map' : 'ELD Logs'}</span>
                  </Button>
                )}
              </div>

              {/* Tab 1: Interactive Map */}
              <TabsContent value="map">
                {tripResult ? (
                  <RouteMap
                    route={tripResult.route}
                    stops={tripResult.stops}
                    theme={theme}
                    selectedStopIndex={selectedStopIndex}
                    onSelectStop={setSelectedStopIndex}
                    onEnlarge={() => setEnlargedModal('map')}
                  />
                ) : (
                  <Card className="p-12 text-center text-slate-500">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-cyan-500" />
                    Calculating route and loading map...
                  </Card>
                )}
              </TabsContent>

              {/* Tab 2: FMCSA 24-Hour ELD Paper Log Sheets */}
              <TabsContent value="eld">
                {tripResult?.log_sheets && tripResult.log_sheets.length > 0 ? (
                  <div>
                    {/* Pagination & Export Controls */}
                    <EldDayPagination
                      currentDayIndex={selectedDayIndex}
                      totalDays={tripResult.log_sheets.length}
                      onDayChange={setSelectedDayIndex}
                      sheetRef={logSheetRef}
                      onEnlarge={() => setEnlargedModal('eld')}
                    />

                    {/* The Full FMCSA Paper Log Sheet Component */}
                    {currentSheet && (
                      <EldLogSheet sheet={currentSheet} sheetRef={logSheetRef} />
                    )}
                  </div>
                ) : (
                  <Card className="p-12 text-center text-slate-500">
                    Enter trip details on the left to generate certified 24-hour driver daily log sheets.
                  </Card>
                )}
              </TabsContent>

              {/* Tab 3: Trip History & Previous Rides */}
              <TabsContent value="history">
                <TripHistory
                  history={historyItems}
                  currentTripId={currentTripId}
                  onLoadTrip={handleLoadTrip}
                  onDeleteTrip={handleDeleteTrip}
                  onRefresh={loadHistory}
                  isLoadingHistory={isLoadingHistory}
                />
              </TabsContent>

              {/* Tab 4: FMCSA Regulations Reference */}
              <TabsContent value="rules">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                        FMCSA Property-Carrying Driver Regulations (49 CFR § 395)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">11-Hour Driving Limit</h4>
                          <p className="text-slate-500 dark:text-slate-400">
                            May drive a maximum of 11 hours after 10 consecutive hours off duty.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">14-Hour Duty Window</h4>
                          <p className="text-slate-500 dark:text-slate-400">
                            May not drive beyond the 14th consecutive hour after coming on duty. Off-duty breaks do not extend this window.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">30-Minute Rest Break</h4>
                          <p className="text-slate-500 dark:text-slate-400">
                            Mandatory 30-minute off-duty or sleeper berth break required after 8 cumulative hours of driving.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">70-Hour / 8-Day Rolling Limit</h4>
                          <p className="text-slate-500 dark:text-slate-400">
                            May not drive after 70 hours on duty in any 8 consecutive days. May be restarted with 34 consecutive hours off duty.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Fueling Intervals</h4>
                          <p className="text-slate-500 dark:text-slate-400">
                            Required at least once every 1,000 driving miles (~30 minutes on-duty time).
                          </p>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">Pickup & Dropoff Terminal Time</h4>
                          <p className="text-slate-500 dark:text-slate-400">
                            1 hour On Duty (Not Driving) allocated for freight loading and unloading.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Right Panel: Chronological Route Milestones */}
          {tripResult?.stops && (
            isRightSidebarOpen ? (
              <aside className="w-full xl:w-[380px] 2xl:w-[420px] shrink-0 no-print">
                <RouteTimeline
                  stops={tripResult.stops}
                  onClose={() => setIsRightSidebarOpen(false)}
                  selectedStopIndex={selectedStopIndex}
                  onSelectStop={setSelectedStopIndex}
                />
              </aside>
            ) : (
              <aside className="hidden xl:flex shrink-0 no-print">
                <button
                  type="button"
                  onClick={() => setIsRightSidebarOpen(true)}
                  className="flex flex-col items-center gap-3 py-4 px-2.5 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:bg-slate-800 shadow-sm transition-all text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer group"
                  title="Open Route Milestones Sidebar"
                >
                  <PanelRightOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-bold tracking-wider uppercase">
                    Route Milestones
                  </span>
                  <span className="h-4 w-4 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 text-[9px] font-mono font-bold flex items-center justify-center">
                    {tripResult.stops.length}
                  </span>
                </button>
              </aside>
            )
          )}
        </div>
      </main>

      {/* Fullscreen Enlarge Modal: Interactive Map (Single Slim Header) */}
      <Modal
        isOpen={enlargedModal === 'map'}
        onClose={() => setEnlargedModal(null)}
        hideHeader={true}
        size="full"
        contentClassName="p-0 overflow-hidden flex flex-col h-full"
      >
        {tripResult && (
          <RouteMap
            route={tripResult.route}
            stops={tripResult.stops}
            theme={theme}
            selectedStopIndex={selectedStopIndex}
            onSelectStop={setSelectedStopIndex}
            isEnlarged={true}
            onEnlarge={() => setEnlargedModal(null)}
            className="border-0 rounded-none shadow-none flex-1 flex flex-col h-full"
          />
        )}
      </Modal>

      {/* Fullscreen Enlarge Modal: FMCSA 24-Hour ELD Paper Logs */}
      <Modal
        isOpen={enlargedModal === 'eld'}
        onClose={() => setEnlargedModal(null)}
        title="FMCSA 24-Hour Driver Daily Paper Log Sheet"
        subtitle={
          currentSheet
            ? `Certified 49 CFR § 395 Record of Duty Status • Date: ${currentSheet.date} • Total: 24.0 Hours Certified`
            : 'Certified 49 CFR § 395 Record of Duty Status'
        }
        badge={
          <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 bg-emerald-50/50 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-transparent font-mono text-[10px]">
            Day {selectedDayIndex + 1} of {tripResult?.log_sheets?.length || 1}
          </Badge>
        }
        contentClassName="p-4 sm:p-6 overflow-y-auto"
      >
        {tripResult?.log_sheets && tripResult.log_sheets.length > 0 && currentSheet && (
          <div className="max-w-6xl mx-auto space-y-4">
            <EldDayPagination
              currentDayIndex={selectedDayIndex}
              totalDays={tripResult.log_sheets.length}
              onDayChange={setSelectedDayIndex}
              sheetRef={modalLogSheetRef}
              isEnlarged={true}
              onEnlarge={() => setEnlargedModal(null)}
            />
            <EldLogSheet sheet={currentSheet} sheetRef={modalLogSheetRef} />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;
