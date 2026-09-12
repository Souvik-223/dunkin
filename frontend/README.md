# Spotter Frontend — React 19 + TypeScript + Tailwind CSS v4

High-performance, regulation-compliant web application for interactive commercial vehicle routing, real truck stop inspection, and vector FMCSA 24-hour daily log drawing.

---

## Technical Stack & Architecture

* **Framework**: React 19.2 (Concurrent mode, optimal rendering)
* **Language**: TypeScript 6.0 (Strict mode, zero `any` types)
* **Build System**: Vite 8.3 (Instant HMR, Rollup optimized bundling)
* **Styling Engine**: Tailwind CSS v4.3 (CSS-first engine with `@custom-variant dark`)
* **Mapping Engine**: Leaflet 1.9.4 with custom SVG divIcons & multi-layer tile switching
* **Icons**: Lucide React 1.45 (Accessible SVG icons)
* **Export Utilities**: `html-to-image` 1.11 (High-DPI PNG generation) + CSS `@media print`

---

## Component Architecture

```
frontend/src/
├── api/
│   └── tripApi.ts               # Axios HTTP client with proxy integration
│
├── types/
│   └── trip.ts                  # End-to-end TypeScript interfaces & types
│
├── components/
│   ├── map/
│   │   └── RouteMap.tsx         # Interactive Leaflet map with:
│   │                            # - Multi-tile selector (Clean, Dark, Satellite)
│   │                            # - Custom SVG stop pins with stop numbers
│   │                            # - Dual polylines (cyan glow underlay + core line)
│   │                            # - Rich popups (address, photo, ratings, amenities)
│   │                            # - 1-Click free Google Maps navigation links
│   │
│   ├── eld/
│   │   ├── EldLogSheet.tsx      # Master FMCSA 24-hour log sheet canvas
│   │   ├── EldLogGrid.tsx       # Mathematical SVG 24-hour grid (15-min ticks)
│   │   ├── EldDayPagination.tsx # Multi-day switcher + Download PNG + Print
│   │   ├── EldRemarks.tsx       # Duty event location remarks table
│   │   └── EldRecap.tsx         # 70-hour / 8-day cycle recap table
│   │
│   ├── trip/
│   │   ├── TripInputForm.tsx    # Widescreen 4-column responsive banner
│   │   ├── RouteTimeline.tsx    # Collapsible milestones sidebar
│   │   └── TripMetrics.tsx      # HOS KPI summary cards
│   │
│   └── ui/                      # Custom design token components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Input.tsx
│       ├── Label.tsx
│       ├── Modal.tsx
│       ├── Tabs.tsx
│       └── Separator.tsx
│
├── App.tsx                      # Root layout, state management & theme toggle
├── index.css                    # Tailwind v4 theme tokens & custom scrollbars
└── main.tsx                     # React 19 root bootstrap
```

---

## Key Technical Implementations

### 1. Mathematical SVG 24-Hour ELD Grid (`EldLogGrid.tsx`)
Standard HTML canvas elements blur on high-DPI retina screens and do not print cleanly. We engineered the 24-hour grid using pure vector SVG primitives:
* **$X$-Axis Transformation**: $x = \text{hour} \times \left(\frac{\text{width}}{24.0}\right)$.
* **15-Minute Increments**: 96 subdivisions across 24 hours with major, half-hour, and quarter-hour tick marks.
* **$Y$-Axis Status Levels**:
  * Level 1: Off-Duty (Line $y_1$)
  * Level 2: Sleeper Berth (Line $y_2$)
  * Level 3: Driving (Line $y_3$)
  * Level 4: On-Duty Not Driving (Line $y_4$)
* **Orthogonal Stepped Polyline**: Renders status transitions with sharp vertical connecting steps matching official paper logs.

### 2. Multi-Layer Map with High-Resolution Satellite View (`RouteMap.tsx`)
Operates on **100% Free Map APIs** requiring zero credit cards:
* **Clean Logistics**: Esri World Street Map (high-contrast daylight navigation).
* **Dark Fleet**: Esri Canvas World Dark Gray Base (tactical night mode).
* **Satellite Aerial**: Esri World Imagery (photorealistic satellite view of truck parking lots, turning radiuses, and highway off-ramps).
* **OpenStreetMap**: Standard OSM fallback.

### 3. Light & Dark Mode System
Configured for Tailwind CSS v4 using:
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```
* Persisted in `localStorage` under `spotter_theme`.
* Pre-hydrated in `index.html` to eliminate flash of unstyled content (FOUC).
* Synchronizes map tiles automatically (switching to Dark Fleet in dark mode and Clean Logistics in light mode).

---

## Local Development & Build

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server (with HMR)
```bash
npm run dev
```
Application will be accessible at: `http://localhost:5173/`

### 3. Production Build & Linting
```bash
# Type check and build production bundle
npm run build

# Run Oxlint
npm run lint
```
Bundle size is optimized under 560 kB with sub-second compilation.
