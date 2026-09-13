# Spotter Backend: Django Service-Layer Architecture

High-throughput, regulation-compliant REST API backend for the Spotter commercial fleet management platform. Built with **Django 6.1**, **Django REST Framework (DRF)**, **Uvicorn (ASGI)**, and **drf-spectacular (OpenAPI 3.0)**.

---

## Directory Structure & Architectural Pattern

The backend strictly implements the **HackSoftware Django Styleguide**, separating business domain logic from HTTP delivery and database persistence:

```
backend/
├── config/                      # Project root configuration
│   ├── settings/                # Environment-driven modular settings
│   │   ├── base.py              # Core installed apps, DRF & CORS config
│   │   ├── development.py       # Local development debug settings
│   │   ├── production.py        # Production security, WhiteNoise, SSL
│   │   └── test.py              # In-memory test SQLite runner
│   ├── asgi.py                  # ASGI entry point for Uvicorn
│   ├── urls.py                  # Root URL router & Swagger docs
│   └── wsgi.py                  # WSGI fallback
│
├── apps/
│   ├── common/                  # Cross-cutting enterprise utilities
│   │   ├── exceptions.py        # Standardized JSON error response envelope
│   │   ├── renderers.py         # Standardized JSON success response envelope
│   │   ├── pagination.py        # Page-number pagination
│   │   └── views.py             # Health check endpoint (/api/health/)
│   │
│   └── trips/                   # Core HOS & ELD business domain
│       ├── models.py            # Trip audit persistence model
│       ├── serializers.py       # DRF input/output serialization
│       ├── selectors.py         # Read-only database queries
│       ├── views.py             # HTTP controllers (/api/trips/plan/, /presets/)
│       ├── urls.py              # Trip endpoint routes
│       ├── services/            # PURE BUSINESS LOGIC (No HTTP code)
│       │   ├── hos_engine.py    # FMCSA Hours of Service (49 CFR § 395) simulation
│       │   ├── places.py        # 100% Free real truck stop & travel plaza discovery
│       │   ├── eld_generator.py # 24-hour log sheet generation & midnight slicing
│       │   └── trip_service.py  # Orchestrator coordinating maps, HOS, and ELD
│       └── tests/               # Automated unit & compliance test suites
│           ├── test_hos_engine.py
│           ├── test_eld_generator.py
│           ├── test_places.py
│           └── test_views.py
│
├── infrastructure/
│   └── maps/                    # Geospatial service adapters (100% Free)
│       ├── geocoding.py         # Nominatim geocoding with caching & fallback
│       ├── routing.py           # Project OSRM commercial road routing
│       └── places.py            # Corridor truck stop database & reverse geocoding
│
├── manage.py                    # Django management script
├── verify_e2e.py                # Full-stack end-to-end integration test
└── requirements.txt             # Python production dependencies
```

---

## Core Domain Services

### 1. `HOSEngine` (`apps/trips/services/hos_engine.py`)
Deterministic FMCSA Property-Carrying Driver simulation engine:
* **Driving Limits**: Enforces 11.0 cumulative hours of driving per shift.
* **Duty Window**: Enforces 14.0 consecutive elapsed hours from the start of the duty period.
* **30-Minute Rest Break**: Enforces an off-duty break when driving reaches 8.0 hours.
* **10-Hour Sleeper Reset**: Inserts a 10-hour consecutive rest period when the 11h or 14h clock is exhausted, resetting shift counters.
* **Fueling Stops**: Schedules a 30-minute on-duty fueling stop at least once every 1,000 miles.
* **Terminal Operations**: Allocates 1.0 hour On-Duty (Not Driving) for loading at Pickup and 1.0 hour for unloading at Dropoff.

### 2. `PlacesService` (`infrastructure/maps/places.py`)
100% Free, zero-credit-card commercial facility discovery:
* **Corridor Matching**: Snaps HOS stops to real major commercial plazas (**Love's, Pilot Flying J, TravelCenters of America, Petro, Sapp Bros, State DOT Rest Areas**) along all major US Interstate freight corridors (I-80, I-70, I-40, I-10, I-64, I-75, I-95, I-15).
* **Facility Metadata**: Provides real street address, exit number, star ratings, review counts, trucker amenities (semi-truck parking count, private showers, diesel lanes, 24/7 food), and authentic photos.
* **Nominatim Reverse Geocoding**: Queries OpenStreetMap Nominatim for any routes off major corridors to extract road names, exit numbers, towns, and postal codes.
* **Free Google Maps Links**: Generates `https://www.google.com/maps/search/?api=1&query={lat},{lng}` deep links ($0, no key needed).

### 3. `ELDLogGenerator` (`apps/trips/services/eld_generator.py`)
Generates FMCSA-standard 24-hour log sheets:
* **Midnight Slicing**: Splits multi-day trips cleanly at midnight (00:00:00 - 24:00:00 UTC).
* **Exact 24.0h Daily Invariant**: Guarantees $\text{Off} + \text{Sleeper} + \text{Driving} + \text{OnDuty} = 24.0\text{ hours}$ for every generated sheet.
* **Recap Calculation**: Computes hours on-duty today, total hours last 7 days, and available cycle hours tomorrow against the 70-hour limit.

---

## Local Development & Setup

### 1. Virtual Environment & Dependencies
```powershell
cd backend

# Create virtual environment (uv recommended)
uv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
uv pip install -r requirements.txt
```

### 2. Database Migrations
```powershell
python manage.py migrate
```

### 3. Start ASGI Server with Uvicorn
```powershell
uvicorn config.asgi:application --host 127.0.0.1 --port 8000 --reload
```
* **API URL**: `http://127.0.0.1:8000`
* **OpenAPI Docs (Swagger)**: `http://127.0.0.1:8000/api/docs/`
* **Health Check**: `http://127.0.0.1:8000/api/health/`

---

## Running Tests

### Unit & Compliance Tests (13 Tests)
```powershell
.\venv\Scripts\python.exe manage.py test apps.trips
```

### End-to-End Simulation Test
```powershell
.\venv\Scripts\python.exe verify_e2e.py
```
