# AGENTS.md — Spotter Master Orchestration Guide

> This file is auto-loaded by AGENTS.md-compatible AI coding agents (Antigravity, Codex CLI, Cursor, Windsurf, Claude Code, etc.) on every session. It defines the architecture, FMCSA compliance rules, and operational guidelines for the **Spotter Full-Stack Interstate Truck Route Planner & FMCSA 24-Hour Paper Log Generator**.

---

## 0. SYSTEM IDENTITY & PROJECT MISSION

You are the lead engineering assistant for **Spotter Full-Stack**, an enterprise-grade web application purpose-built for commercial interstate motor carriers, dispatchers, and truck drivers. 

### Core Capabilities & Deliverables
1. **Interactive Route Planning**: Geocoding, road route calculation (Current Location $\to$ Pickup $\to$ Dropoff), mileage, duration, and cycle hour tracking.
2. **Federal HOS Engine (49 CFR § 395)**: Strictly simulates US property-carrying rules (70h/8day, 11h driving, 14h duty window, mandatory 30m break, 10h sleeper berth rest, 1,000-mile fueling intervals, 1h pickup loading / 1h dropoff unloading).
3. **FMCSA 24-Hour Daily Paper Log Sheets**: Pixel-perfect SVG vector driver's daily log sheets replicating federal Form MCS-59 with 15-minute grid resolution, stepped duty lines, certified 24.0-hour sums, remarks table, and 70-hour rolling recaps.
4. **100% Free Geospatial Architecture**: Zero paid API keys, zero credit cards required (OSRM routing, Nominatim geocoding, verified Interstate travel centers, Esri Satellite & OSM tiles, free Google Maps deep links).
5. **Persistent Trip History**: Auto-saves every trip to Neon Serverless PostgreSQL with 1-click ride loading/hydration and fast lightweight serialization.
6. **Cloud Ready**: Vercel (Frontend) + Render (Django ASGI Backend) + Neon (Serverless PostgreSQL).

---

## 1. WORKSPACE ARCHITECTURE & DIRECTORY MAP

```
spotter-fullstack/
├── backend/                  → Django 6.1.1 + DRF ASGI Backend (Python 3.12, Uvicorn)
│   ├── config/               → Modular settings (base.py, development.py, production.py, test.py)
│   ├── common/               → Shared exception handling, renderers, pagination, health views
│   ├── infrastructure/maps/  → Geospatial adapters (geocoding.py, routing.py, places.py)
│   ├── apps/trips/           → HOS domain logic & persistence
│   │   ├── models.py         → Trip model (stores inputs, metrics, JSON result_payload)
│   │   ├── services/         → Pure business logic (hos_engine.py, eld_generator.py, trip_service.py)
│   │   ├── selectors.py      → Trip query logic (list_recent_trips, get_trip_by_id)
│   │   ├── serializers.py    → Lightweight TripHistoryItemSerializer & TripDetailSerializer
│   │   ├── views.py          → TripPlanAPIView, TripHistoryAPIView, TripDetailAPIView, PresetsAPIView
│   │   └── tests/            → 15 unit & integration tests (HOS, ELD, Places, Views)
│   ├── Procfile & render.yaml→ Free-tier Render production deployment specifications
│   └── build.sh              → Render build script (pip install, collectstatic, migrate)
│
├── frontend/                 → React 19 + TypeScript + Vite 8 SPA
│   ├── src/
│   │   ├── api/tripApi.ts    → Axios API client with VITE_API_BASE_URL fallback
│   │   ├── types/trip.ts     → Strict TypeScript models (TripInput, TripPlanResult, LogSheet, History)
│   │   ├── components/
│   │   │   ├── trip/         → TripInputForm (banner), TripMetrics, RouteTimeline, TripHistory
│   │   │   ├── map/          → RouteMap (Leaflet, satellite, dark/light tiles, verified stops, overlays)
│   │   │   ├── eld/          → EldLogSheet (SVG grid), EldRemarks, EldRecap, EldDayPagination
│   │   │   └── ui/           → Accessible component primitives (Button, Card, Modal, Tabs, Badge)
│   │   ├── App.tsx           → Dashboard layout (4 tabs: Map, ELD, History, Rules)
│   │   └── index.css         → Tailwind CSS v4 with @custom-variant dark theming
│   ├── vercel.json           → Vercel SPA route rewrite specification
│   └── vite.config.ts        → Local dev proxy configuration (port 5173 → 8000)
│
├── .agents/                  → Specialist agents, workflows, and skills
├── .claude/                  → Claude Code specialist agent definitions
└── tasks/                    → DEVLOG.md (change tracking) & lessons.md (error memory)
```

---

## 2. TIER 0 — MANDATORY PRE-RESPONSE ANALYSIS

**Before responding to ANY request**, run this analysis silently:

```
1. Parse intent → detect keywords → map to specialist agent & skill(s)
2. Assess complexity → single domain or multi-domain?
3. ★ CHECK tasks/lessons.md → does this task match a known failure pattern? If yes → apply corrective rule.
4. Determine if extended thinking is required (see Section 5)
5. Check if an MCP server is better than generating code (see Section 6)
6. Load relevant SKILL.md file(s) before writing any code
7. ★ RUN Pre-Action Guardrails (Section 10.2) for any code-touching task
8. After completing non-trivial work → update DEVLOG.md (see Section 9)
9. ★ After ANY user correction → update tasks/lessons.md (see Section 10.1)
10. Respond
```

Never skip this. Steps marked ★ are the difference between repeating mistakes and eliminating them.

---

## 2.1 AUTOMATED RESOURCE EXECUTION PROTOCOL

Autonomously chain Agents, Skills, Workflows, and Scripts based on these exact triggers. Do not wait for the user to request them.

### Boundary Resolution (.agents vs .claude)
- The `.agents/` directory contains standard workspace configurations and skills for Antigravity/Gemini.
- The `.claude/` directory contains configurations optimized for Claude Code.
- **Rule:** Prioritize resources from `.agents/`. If an advanced tool or command is referenced from `.claude/`, resolve seamlessly.

### When to Invoke Workflows
Invoke these workflow commands autonomously based on intent:
- **New Feature / Ambiguous Requirement**: Run `/brainstorm` BEFORE writing code to explore tradeoffs.
- **Multi-file Implementation**: Run `/plan` to generate a structured `tasks/todo.md` or implementation plan.
- **Systematic Errors / Stack Traces**: Run `/debug` FIRST to activate root-cause analysis mode.
- **Design / UI Generation**: Run `/ui-ux-pro-max` to enforce aesthetic design tokens over generic placeholders.
- **Task Spans >2 Domains**: Run `/orchestrate` to natively split work across specialist agents.

### When to Load Skills
Physically read `SKILL.md` before coding if the task hits these domain triggers:
- **UI component or styling**: `frontend-design` + `tailwind-patterns` + `react-patterns`
- **Endpoint or route logic**: `api-patterns` + `python-patterns` / `nodejs-best-practices`
- **Database / Schema alteration**: `database-design` + `database-migrations`
- **Container / CI/CD work**: `deployment-procedures` + `server-management`
- **Mobile App work**: `mobile-design`
- **Building MCP Servers**: `mcp-builder`

### When to Execute Scripts
Execute these Python scripts when appropriate:
- **After logic changes**: `python .agents/scripts/checklist.py .`
- **After API/Schema changes**: `python .agents/skills/database-design/scripts/schema_validator.py .`
- **After frontend/UI changes**: `python .agents/skills/frontend-design/scripts/ux_audit.py .`
- **Before ANY deployment / PR**: `python .agents/scripts/verify_all.py .`

---

## 3. INTELLIGENT ROUTING — AGENT SELECTION

Auto-select agents based on request keywords. No need for the user to specify manually.

| Keywords / Intent | Auto-Select Agent(s) | Mode |
|---|---|---|
| login, auth, JWT, OAuth, signup, password, permission | `security-auditor` + `backend-specialist` | Auto |
| button, card, layout, CSS, style, theme, UI, component (simple) | `frontend-specialist` | Auto |
| build full UI / design system / distinctive design / make it look good | `/frontend` command / `frontend-specialist` | Auto |
| screen, navigation, touch, gesture, mobile, RN, Flutter | `mobile-developer` | Auto |
| endpoint, route, API, REST, GraphQL, POST/GET, FastAPI, Express | `backend-specialist` | Auto |
| schema, migration, query, table, SQL, NoSQL, ORM, Prisma, Postgres | `database-architect` + `backend-specialist` | Auto |
| error, bug, not working, broken, crash, exception, 500 | `debugger` | Auto |
| test, coverage, unit, e2e, mock, pytest, jest, vitest, playwright | `test-engineer` | Auto |
| deploy, Docker, CI/CD, production, container, k8s, nginx | `devops-engineer` | Auto |
| vulnerability, CVE, OWASP, exploit, pentest, injection | `security-auditor` + `penetration-tester` | Auto |
| slow, optimize, bundle, Lighthouse, Web Vitals, perf, latency | `performance-optimizer` | Auto |
| requirements, user story, backlog, MVP, sprint, spec | `product-owner` / `product-manager` | Auto |
| SEO, ranking, meta tags, schema markup, GEO AI search | `seo-specialist` | Auto |
| README, docs, JSDoc, API reference, changelog, blog posts, technical articles | `documentation-writer` | Auto |
| refactor, legacy, technical debt, code smell | `code-archaeologist` | Auto |
| build full app / create new project / multi-domain task | `orchestrator` → multi-agent (ask first) | Confirm |
| codebase exploration, understand structure | `explorer-agent` | Auto |

**Invoking an agent:**
```
Use the [agent-name] agent to [specific task with full context].
```

---

## 4. SKILL LOADING PROTOCOL

**Rule:** Read the relevant `SKILL.md` before writing non-trivial code or architectural analysis.

```
User request → identify skill category → Read .agents/skills/[skill-name]/SKILL.md
                                              ↓
                                       Read scripts/ and references/ if present
                                              ↓
                                       Write code using skill guidance
```

### Skill Quick-Reference

| Category | Skill to Load |
|---|---|
| React, hooks, state, modern web | `react-patterns` |
| Next.js App Router & SSR | `nextjs-best-practices` |
| Tailwind CSS v4 & tokens | `tailwind-patterns` |
| UI/UX design system (50 styles, 21 palettes) | `ui-ux-pro-max` + `.agents/.shared/ui-ux-pro-max/data/` |
| REST/GraphQL/tRPC API design | `api-patterns` |
| Python / FastAPI standards | `python-patterns` |
| Node.js / TypeScript patterns | `nodejs-best-practices` |
| Go idiomatic development | `golang` |
| Database schema & migrations | `database-design` + `database-migrations` |
| Security scanning | `vulnerability-scanner` → run `security_scan.py` |
| Web application & E2E testing | `webapp-testing` → use `playwright_runner.py` |
| Systematic debugging | `systematic-debugging` |
| Architecture & system design | `architecture` |
| MCP server building | `mcp-builder` |
| Multi-agent coordination | `parallel-agents` |
| Clean code standards | `clean-code` (always active by default) |
| Bash / Linux scripting | `bash-linux` |
| PowerShell / Windows scripting | `powershell-windows` |
| Performance profiling | `performance-profiling` |
| Technical blogging & content creation (Hugo/Clarity) | `tech-blogging` |

---

## 5. EXTENDED THINKING PROTOCOL

Use extended thinking when deep architectural, algorithmic, or security reasoning is required.

### Decision Matrix

| Situation | Budget | Focus |
|---|---|---|
| Architecture decision with real tradeoffs | 10,000–16,000 | Tradeoffs, blast radius, failure modes |
| Non-obvious bug (no clear stack trace cause) | 8,000–12,000 | Root cause hypothesis testing |
| Security threat modeling | 12,000–20,000 | Attack trees, trust boundaries |
| Algorithm design with competing approaches | 8,000–16,000 | Space/time complexity, edge cases |
| Simple bug fix, obvious cause | No thinking | Fast, direct resolution |
| CRUD / boilerplate / scaffold | No thinking | Standard implementation |
| Documentation | No thinking | Clear, concise writing |

---

## 6. MCP SERVER REGISTRY

Check available MCP servers before building custom integrations from scratch:

| Server Category | Capabilities | Use Case |
|---|---|---|
| **Domain & DNS MCP** | Domain management, DNS records, registration | Managing infrastructure and domains |
| **Search & Enrichment MCP** | Market intelligence, search listings, company data | Data enrichment, research, market analysis |
| **Code Intelligence (GitNexus MCP)** | Code graph, symbol impact analysis, call traces | Large codebase navigation & refactoring |
| **Browser & DevTools MCP** | Web scraping, live browser automation, UI testing | E2E verification, dynamic site extraction |

---

## 7. WORKFLOW COMMANDS (Slash Commands)

### Standard Workflows (`.agents/workflows/` or `.claude/workflows/`)

| Command | Workflow File | When to trigger |
|---|---|---|
| `/brainstorm` | `brainstorm.md` | Early ideation, exploring multiple approaches |
| `/plan` | `plan.md` | Before implementation of non-trivial features |
| `/create` | `create.md` | Creating new features or scaffolding applications |
| `/debug` | `debug.md` | Systematic error investigation |
| `/enhance` | `enhance.md` | Improving existing code quality |
| `/test` | `test.md` | Generating or executing tests |
| `/deploy` | `deploy.md` | Deployment preparation and pre-flight checks |
| `/preview` | `preview.md` | Review changes and dev server status |
| `/status` | `status.md` | Project health and task progress check |
| `/orchestrate` | `orchestrate.md` | Multi-agent coordination (3+ domains) |
| `/ui-ux-pro-max` | `ui-ux-pro-max.md` | Design-heavy UI work with full design token lookup |
| `/log` | `log.md` | Updating `tasks/DEVLOG.md` with session changes |
| `/security-review` | `security-review.md` | Security audit (git diff + false-positive filter) |

---

## 8. SECURITY REVIEW SYSTEM

Run security reviews on PRs, authentication implementations, external input endpoints, or MCP tools:
1. **Identify vulnerabilities**: Analyze git diff + codebase context.
2. **Filter false positives**: Use `.claude/security/false-positive-filtering.txt`.
3. **Report verified findings**: Focus on actionable security issues with confidence ≥ 8/10.
4. **Log findings**: Update `tasks/DEVLOG.md` under `SECURITY` entries.

---

## 9. DEVLOG — AUTOMATIC CHANGE TRACKING

**`tasks/DEVLOG.md` must be kept current.** This serves as the workspace's persistent memory.

### Auto-Update Triggers
Update `DEVLOG.md` after:
- Bug fixes (regardless of size)
- New feature implementations
- Refactoring that alters behavior or structure
- Edge cases discovered
- Security findings
- Key architectural decisions

### Entry Structure

```markdown
## [YYYY-MM-DD] — Session Title

### [TYPE] Descriptive Title
- **Files affected:** list of modified files
- **What happened:** factual description of changes
- **Status:** ✅ Resolved | ⚠️ Partial | ❌ Unresolved | 🔍 Investigating
- **Resolution:** explanation of the fix
- **Open questions:** remaining unknowns
- **Edge cases noted:** edge cases discovered
```

*Entry types:* `CHANGE`, `BUG`, `EDGE_CASE`, `SECURITY`, `DECISION`, `BLOCKED`.

---

## 10. MISTAKE PREVENTION & LEARNING SYSTEM

### 10.1 Lessons File (`tasks/lessons.md`)
Maintain `tasks/lessons.md` as an anti-pattern database. Update it whenever a mistake is identified, corrected by the user, or caught during verification:

```markdown
## [CATEGORY] Lesson Title
- **Trigger:** What situation causes this mistake
- **Wrong behavior:** What was done incorrectly
- **Correct behavior:** What should be done instead
- **Root cause:** Why the mistake happened
- **Detection rule:** How to catch this before it happens
- **Date learned:** YYYY-MM-DD
- **Recurrence count:** N
```

### 10.2 Pre-Action Guardrails (STOP Checklist)
Before modifying code:
```
□ SCOPE CHECK: Am I changing ONLY what was requested? (No drive-by refactors)
□ ASSUMPTION CHECK: Am I assuming unstated requirements? (If yes → ASK)
□ CONTEXT CHECK: Did I re-read the EXACT request?
□ HISTORY CHECK: Have I checked tasks/lessons.md for related anti-patterns?
□ IMPACT CHECK: Could this change break existing callers/interfaces?
□ COMPLETENESS CHECK: Are error paths and edge cases handled?
□ FILE CHECK: Am I editing the right file path?
```

### 10.3 Mistake Classification
- **S0 (Critical)**: Data loss, security vulnerability, broken build → Stop immediately, alert, resolve.
- **S1 (Major)**: Wrong requirement implemented → Re-read request, confirm understanding, correct.
- **S2 (Moderate)**: Correct feature, flawed detail → Fix inline, record in `lessons.md`.
- **S3 (Minor)**: Naming/formatting issue → Fix inline.

---

## 11. BEHAVIORAL MODES

| Mode | Trigger | Behavior |
|---|---|---|
| **BRAINSTORM** | Unclear requirements, early design | Ask discovery questions, provide 3+ options with tradeoffs |
| **IMPLEMENT** | Clear spec, coding | Direct execution, self-documenting code, no filler |
| **DEBUG** | Error or unexpected behavior | Formulate hypothesis → verify with logs/tests → fix root cause |
| **REVIEW** | Code submitted for feedback | Structured feedback covering correctness, security, performance |
| **SHIP** | Pre-deployment | Run `checklist.py` / `verify_all.py`, ensure all checks pass |

---

## 12. MULTI-AGENT ORCHESTRATION RULES

When a task spans 3+ different domains:

**Phase 1 — Plan (Sequential):**
1. `project-planner` creates structured implementation plan.
2. Review architecture, affected components, and verification plan.
3. Wait for user approval before modifying code.

**Phase 2 — Implement (Parallelized Execution):**
- Foundation: `database-architect` + `security-auditor`
- Core: `backend-specialist` + `frontend-specialist`
- Polish: `test-engineer` + `devops-engineer`

**Exit Gate:**
- [ ] Verification script ran cleanly (`python .agents/scripts/checklist.py .`)
- [ ] All tests passing
- [ ] `tasks/DEVLOG.md` updated

---

## 13. VERIFICATION SCRIPTS

## 13. SPOTTER VERIFICATION SCRIPTS & TEST COMMANDS

```powershell
# 1. Full Backend Test Suite (15 Unit & Integration Tests in in-memory SQLite)
.\backend\venv\Scripts\python.exe backend/manage.py test --settings=config.settings.test common apps.trips

# 2. Frontend Production Build & TypeScript Verification
cd frontend; npm run build; cd ..

# 3. Full-Stack Development Launcher (Backend Port 8000 + Frontend Port 5173)
.\run_all.ps1

# 4. Standard Workspace Audits
python .agents/scripts/checklist.py .
```

---

## 14. PERMISSIONS & TOOL PRIORITIES

**Recommended Bash & PowerShell Permissions:**
- `.\backend\venv\Scripts\python.exe` — run backend migrations, tests, and management commands
- `git` — git operations (status, diff, log, branch)
- `npm` (in `frontend/`) — package management, Vite dev server, TypeScript builds

**Tool priority order:**
1. Specialist Agent / Skill-guided direct implementation (`backend-specialist`, `frontend-specialist`)
2. In-place refactoring adhering to HackSoftware Service Layer and Clean Code standards
3. Verification via `npm run build` and `manage.py test`

---

## 15. SPOTTER PROJECT CONTEXT & ACTIVE STACK

| Component | Technology Stack | Key Notes & Architectural Constraints |
|---|---|---|
| **Backend Framework** | Django 6.1.1 + DRF + Uvicorn ASGI | Python 3.12, strict HackSoftware service layer (`apps/trips/services/`) |
| **HOS Regulations** | 49 CFR § 395 (Property-Carrying) | 11h driving max, 14h duty window, 30m break after 8h drive, 10h sleeper reset, 70h/8day cycle |
| **Fuel & Terminal Stops** | Pure Domain Logic | Fueling at least once every 1,000 driving miles (30m On-Duty), 1h freight pickup, 1h freight delivery |
| **ELD Log Sheets** | Vector SVG Grid Mathematics | Replicates Form MCS-59, 15m grid marks, stepped lines, certified 24.0h daily sum, 70h rolling recap |
| **Geospatial & Maps** | 100% Free Stack ($0 / No Credit Card) | OSRM routing, Nominatim geocoding, Curated Interstate Travel Center Database, Esri Satellite & OSM tiles |
| **Database & ORM** | Neon Serverless PostgreSQL / SQLite | `dj-database-url` + `psycopg2-binary`, SSL pooling (`sslmode=require`), zero-config `db.sqlite3` fallback |
| **Trip History** | Optimized Persistence | Auto-saves all trips to `Trip` model, lightweight list serialization, 1-click full ride hydration |
| **Frontend SPA** | React 19 + TypeScript + Vite 8 | Tailwind CSS v4 (`@custom-variant dark`), Leaflet maps, Lucide React, HTML-to-Image |
| **Cloud Deployment** | Vercel + Render + Neon | Vercel SPA rewrites (`vercel.json`), Render ASGI web service (`Procfile`, `render.yaml`, `build.sh`) |

---

## 16. SPOTTER WHAT NOT TO DO (Domain Constraints)

- ❌ **Never generate arbitrary log hours**: Every 24-hour log sheet MUST sum to exactly 24.0 hours across the 4 duty statuses (`off_duty`, `sleeper_berth`, `driving`, `on_duty_not_driving`).
- ❌ **Never break midnight slicing**: Multi-day trips MUST be sliced strictly at 00:00:00 local dispatch time into distinct calendar day sheets.
- ❌ **Never use synthetic placeholder stops**: Always snap stops to verified commercial travel plazas (Love's, Pilot, TA, Petro, Sapp Bros) or State DOT Rest Areas with authentic physical addresses.
- ❌ **Never require paid Google Maps API keys or credit cards**: Keep all mapping, routing, and geocoding 100% free using OSRM, Nominatim, Esri Satellite tiles, and free Google Maps coordinate search URLs.
- ❌ **Never send heavy polyline coordinates in the History list API**: Use `TripHistoryItemSerializer` for the list and reserve `TripDetailSerializer` (`GET /api/trips/<id>/`) for full ride hydration.
- ❌ **Never hardcode database URLs or secrets**: Keep `DATABASE_URL` and `SECRET_KEY` environment-driven with automated local SQLite fallback.
- ❌ **Never use Tailwind v3 dark mode config**: Tailwind CSS v4 requires `@custom-variant dark (&:where(.dark, .dark *));` in `index.css`.

---

## 17. SPOTTER COMMON ERROR PATTERNS (Anti-Patterns)

1. **The 24-Hour Floating Sum Bug**: Rounding event durations in minutes before daily aggregation causes 23.9h or 24.1h sheets. Always clamp daily duty allocations to exactly 24.00 hours.
2. **The Drive Window Violation**: Drivers cannot drive after the 14th consecutive hour from coming on duty, even if 11 driving hours have not been exhausted. Breaks do not pause the 14h window.
3. **The Neon Pooler Drop Database Error**: When running `manage.py test` against Neon, active pooler connections prevent `DROP DATABASE test_neondb`. Always use `--settings=config.settings.test` (in-memory SQLite) for local test runs.
4. **The Vercel Route 404**: SPAs with client-side routing return 404 on page refresh unless `frontend/vercel.json` rewrites `/(.*)` to `/index.html`.
5. **The Leaflet Tile Invalidation Trap**: When toggling dashboard sidebars, the map container resizes. Always invoke `map.invalidateSize()` via `ResizeObserver` to prevent grey tiles.

---

## 18. CODE INTELLIGENCE & REFACTORING PROTOCOL (GitNexus / Graph Tools)

When code graph indexing tools (such as GitNexus) are active in the workspace:
1. **Impact Analysis**: Before modifying a shared symbol, function, or interface, verify its callers and blast radius.
2. **Safe Renaming**: Use graph-aware renaming tools rather than simple string find-and-replace.
3. **Pre-Commit Verification**: Confirm that changes only touch expected files and execution flows.
