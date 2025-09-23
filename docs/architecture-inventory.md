## Architecture Inventory (Code vs. Architecture Doc)

### Scope

- Compared repository structure and key modules against `docs/architecture.md`.
- Read-only review; no code changes.

### Summary

- Overall alignment is strong. Backend routes exist per family, Zod validation is present at API client and most routes, caching is centralized, and frontend layering (contexts → fetching contexts → API client) is followed.
- Notable gaps and deviations are listed below.

### Inventory by Section

#### Overview & Principles

- Separation of concerns: MATCHES
  - Backend routes under `src/app/api/*` and frontend under `src/frontend/*`.
- Shared contracts: MATCHES
  - Shared types in `src/types/**`, shared utilities in `src/lib/**`.
- Accessibility & code quality: PARTIAL
  - Uses shadcn and Tailwind tokens. No dynamic imports found except in a few files noted below. Zero-`any` appears to hold (tests may use `any` in places).
- No backend guessing: PARTIAL
  - Some backend routes minimally shape responses; largely compliant.

#### Directory Structure

- Backend: MATCHES (`src/app/api/`)
- Frontend: MATCHES (`src/frontend/`)
- Frontend libs: MATCHES (`src/frontend/lib/api-client`, `src/frontend/lib/cache`)
- Shared libs: MATCHES (`src/lib/`)
- Types & validation: MATCHES (`src/types/`, `src/types/api-zod/`)
- Fixtures: MATCHES (`mock-data/`, `real-data/`)
- Tests: MATCHES (`src/tests/`)

#### Data Flow

- Context layering and API client orchestration: MATCHES (see Frontend families below)

#### Backend (src/app/api)

- Route families present: MATCHES
  - `heroes`, `items`, `leagues`, `matches`, `players`, `teams`, plus `cache/invalidate` and `share`.
- Validation: PARTIAL
  - Uses Zod schemas via `src/types/api-zod` in `items`, `players`, `teams`, `matches`. `heroes` returns raw without explicit parse.
- Rate limiting: GAP
  - Types defined in `src/types/rate-limit.ts`, but no concrete rate limit middleware/service usage found in routes.
- Caching: MATCHES
  - Centralized `src/lib/cache-service.ts` with `cache-backends/redis.ts` and `memory.ts`. `share/cache.ts` and invalidate route present.
- Error handling: MATCHES
  - Consistent JSON error shapes with status codes across routes.
- Keep handlers thin: MATCHES
  - External API logic lives under `src/lib/api/*`.

#### Frontend (src/frontend)

- Layering per family: MATCHES
  - Teams, Matches, Players each have `contexts/fetching`, `contexts/state`, and `api` modules calling the typed client.
  - Constants: `constants-context` + fetching context.
- Import boundaries: MATCHES
  - Stateless components avoid direct API/context imports; stateful containers consume contexts.
- API client ownership of fetch/validation: MATCHES
  - `src/frontend/lib/api-client/index.ts` handles fetch and validation helpers. Family `api/*.ts` delegates to it and `src/types/api-zod` schemas.
- Accessibility & UI: MATCHES
  - shadcn components in `src/components/ui/*`. Pages use `PageHeader` with title/description.

#### Families

- Teams: MATCHES
  - `src/frontend/teams/**` present; state context provides actions and data. High-performing heroes derived in `team-context.tsx`.
- Matches: MATCHES
  - `src/frontend/matches/**` with resizable layout, lists/details, fetching/state contexts.
- Players: MATCHES
  - `src/frontend/players/**` with fetching/state contexts and stateless components.
- Constants: MATCHES
  - `src/frontend/contexts/constants-context.tsx` and fetching context; translates IDs via backend-fetched data.

#### Types & Validation

- OpenAPI Zod client output at `src/types/api-zod/index.ts`: MATCHES
- API clients validate responses before exposing to contexts: MATCHES
- Domain/view types colocated under `src/types/**`: MATCHES

#### Caching

- Centralized service: MATCHES (`src/lib/cache-service.ts`) with backends.
- Frontend cache utilities present: MATCHES (`src/frontend/lib/cache`).
- Family TTLs: PARTIAL
  - TTL constants exist in frontend cache; backend TTL policy not explicitly enforced in code paths reviewed.
- Cache key pattern: PARTIAL
  - Frontend uses `family:resource:params:v{CACHE_VERSION}`; backend invalidation and share cache exist.

#### Error Handling & Logging

- Utilities in `src/utils/error-handling.ts`: MATCHES
- UI surfaces errors via context fields: MATCHES (contexts maintain error maps/states).

#### Security & Configuration

- No secrets in code observed; `.env` untouched: MATCHES
- Frontend contexts avoid direct `localStorage`; use `config-context`: MATCHES
- Server-only modules import boundaries: MATCHES via foldering/Next conventions.

#### Testing

- One-to-one tests mirroring source areas under `src/tests/**`: MATCHES (broad coverage visible for routes, contexts, components, cache).
- pnpm scripts for lint/type-check/test present: MATCHES (`package.json`).

#### Build & CI

- Commands present: MATCHES (`pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm dev`).
- Import boundaries respected; no dynamic imports beyond noted cases: PARTIAL.

#### Pages

- Dashboard, Match History, Player Stats pages: MATCHES
  - Page files render `PageHeader` and respective `*PageContainer` from `src/frontend/*`.

### Notable Gaps / Deviations

- Backend rate limiting not wired: Types exist in `src/types/rate-limit.ts`, but no middleware/service usage detected in API routes.
- Heroes route lacks explicit Zod validation: `src/app/api/heroes/route.ts` returns fetched data without `schemas.getApiHeroes.parse`.
- Minimal backend shaping vs. “no guessing”: Currently acceptable, but ensure future logic keeps normalization only.
- Dynamic imports
  - Found dynamic import usage in a few frontend files (via `import(` pattern). Consider refactoring to static imports per guideline if feasible.

### Code Quality Review (Scan)

- Duplicated fetching patterns: MATCHES (intentional abstraction but could be DRY-er)
  - `team-data-fetching-context.tsx`, `match-data-fetching-context.tsx`, and `player-data-fetching-context.tsx` repeat similar cache/error/in-flight-dedupe patterns. Consider extracting a small generic helper (e.g., createFetchingCache<T>) to reduce duplication while keeping family-specific hooks thin.

- Optimistic op patterns duplicated: PARTIAL
  - `use-match-operations.ts` and `use-player-operations.ts` have very similar shapes for optimistic entity creation, abort handling, and error mapping. A tiny shared helper (returning guards and cleanup) could cut boilerplate.

- Legacy/unused code: MATCHES (flagged for removal)
  - `usePlayerStatsHandlers` in `src/frontend/players/hooks/usePlayerStatsPage.ts` is explicitly `undefined as never` and commented as legacy. Safe to remove to reduce noise.

- Error handling consistency: MATCHES
  - Route error helpers unified and now detect both explicit "Rate limited" and numeric 429 messages.

- Logging granularity: PARTIAL
  - `console.error` used across routes and contexts; acceptable for now. If logs get noisy on Vercel, consider a simple tagged logger to adjust levels per environment.

- Unused TTL defaults: MATCHES
  - Centralized TTLs added at `src/lib/cache-ttls.ts`; all API modules now reference constants. Frontend local cache TTLs remain independently managed in `src/frontend/lib/cache` (OK by design).

- File size/complexity checks: MATCHES
  - Largest modules (e.g., `use-player-operations.ts`, `use-match-operations.ts`, `team-data-fetching-context.tsx`) are readable but long. Future refactors: split helpers (abort/optimistic/cache writes) into co-located files to lower cognitive load.

### Suggested Refactors (Non-blocking)

- Extract generic fetch/cache helper for fetching contexts to remove repetition.
- Consolidate optimistic operation helpers shared by matches/players.
- Remove `usePlayerStatsHandlers` legacy export.

### Strong Alignments

- Clear separation of backend and frontend layers and responsibilities.
- Frontend data fetching and state contexts strictly layered with typed API client.
- Centralized caching and cache invalidation support.
- Comprehensive tests mapped to source structure.

### Appendix: Pointers

- Backend examples with validation:
  - `src/app/api/items/route.ts`, `src/app/api/players/[id]/route.ts`, `src/app/api/matches/[id]/route.ts`, `src/app/api/teams/[id]/route.ts`.
- Frontend API clients:
  - `src/frontend/*/api/*.ts` use `requestAndValidate` with `src/types/api-zod` schemas.
- Caching:
  - Backend: `src/lib/cache-service.ts`; Frontend: `src/frontend/lib/cache`.
- Error handling:
  - `src/utils/error-handling.ts` + per-route mappers.
