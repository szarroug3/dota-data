# App Data Migration Plan — 2025-10-10

This document captures the concrete steps to finish the **Match History** migration and enforce a clean separation of concerns across the app.
It builds on `docs/app-data-refactor-migration.md` and turns it into an executable, checkable plan.

## Goals
- **Clean, maintainable, easy-to-read code**
- **Strict separation of concerns**
  - All computation and data derivation live in the **App Data layer**.
  - Components are **presentational only** (visuals, formatting, event wiring).
  - No on-demand compute in components.
- **Zero lint warnings & zero type errors**

---

## Current Observations (from repo review)
- Both `src/contexts/*` and `src/frontend/contexts/*` exist; scope overlaps cause confusion.
- Fetching logic and derived/aggregate calculations appear in multiple places.
- Player migration is largely complete; **Match History** is in-flight.
- Lint/TS config present but can be tightened to enforce boundaries.

---

## Guiding Principles
1. **Single source of truth**: one stateful provider (`AppDataProvider`) feeding normalized entity stores.
2. **Pure selectors**: *all* derived data implemented as pure functions in `app-data/selectors/`.
3. **Typed I/O**: API payloads validated (Zod) → normalized entities → selectors → props.
4. **Presentational components only**: components receive ready-to-render props, no store or services imports.
5. **Deterministic data flow**: `services → entities (normalize) → selectors (derive) → components`.
6. **Performance**: memoize selectors, use indexes for O(1)/O(log n) reads; avoid compute in render.

---

## Target Folder Layout
```
src/
  app-data/
    AppDataProvider.tsx         // the only stateful app-wide provider
    entities/                   // normalized stores + add/merge helpers
      heroes/
      players/
      teams/
      matches/
    services/                   // API clients + Zod validation
      http.ts
      matches.service.ts
      players.service.ts
      ...
    selectors/                  // pure derived data
      matches.selectors.ts
      players.selectors.ts
      teams.selectors.ts
      heroes.selectors.ts
  frontend/
    shared/                     // shadcn/tailwind primitives only
      components/
      layout/
    matches/
      pages/                    // containers read selectors & pass props
      components/               // presentational, prop-driven
    players/
      pages/
      components/
    teams/
      pages/
      components/
  types/                        // domain & API types
  utils/                        // pure helpers only
```

**Import rules**
- `components/*` → may import from `frontend/shared/*`, `types/*`.
- `pages/*` (containers) → may import from `app-data/selectors/*`, `types/*`.
- **Forbidden**: `components/*` importing `app-data/services/*` or any context hooks.

---

## Phased Plan (incremental PRs)
### Phase 1 — Lock the Architecture
- [ ] Consolidate contexts: remove or re-export `src/frontend/contexts/*`; keep only `src/contexts/*` for legacy, then fold into `AppDataProvider`.
- [ ] Create `src/app-data/entities/*` with normalized maps and add/merge helpers.
- [ ] Establish `src/app-data/selectors/*` and move **all match-history derivations** here.
- [ ] Introduce `src/app-data/services/*` with typed clients (Zod schemas).

### Phase 2 — Wire Data Flow
- [ ] Ensure data-fetching contexts **only load & commit** to entities; no compute.
- [ ] Containers (`frontend/*/pages/*`) read selectors, pass props to presentational components.
- [ ] Strip compute from presentational components (no cross-feature state).

### Phase 3 — Performance & Indexes
- [ ] Add fast indexes for common queries (by `playerId`, `teamId`, `heroId`, recent N, by league).
- [ ] Memoize heavy selectors; verify stable inputs/outputs.

### Phase 4 — Type Safety & Lint
- [ ] Tighten `tsconfig` (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitOverride).
- [ ] ESLint: no `any`, no unused exports, react-hooks/exhaustive-deps, no floating promises, prefer-const.
- [ ] Add **forbidden import** check: disallow `app-data/services` from `components/*` (simple script or custom rule).
- [ ] Achieve **zero** TypeScript errors and **zero** ESLint warnings.

### Phase 5 — Tests & CI
- [ ] Unit tests for selectors (golden tests for match-history aggregates).
- [ ] Snapshot tests for presentational components + basic a11y checks.
- [ ] CI gates: `pnpm type-check`, `pnpm lint:all`, `pnpm test` must pass.

---

## Concrete Task Breakdown (checklist)
1. **Deprecate duplicate contexts**  
   - [ ] Remove `src/frontend/contexts/*` or re-export temporarily from `src/contexts/*` with a deprecation header.
2. **Scaffold entities**  
   - [ ] Implement `entities/{matches,players,teams,heroes}/store.ts` with normalized maps & helpers.
3. **Move match-history derivations**  
   - [ ] `selectors/matches.selectors.ts`: `selectRecentMatches`, `selectMatchesByPlayer`, `selectMatchSummary`, `selectHeroUsage`.
4. **Unify services**  
   - [ ] `services/matches.service.ts`, `players.service.ts`, etc. with Zod validators.
5. **Refactor containers/pages**  
   - [ ] Convert feature pages to containers that use selectors; pass plain props to components.
6. **Strip compute from components**  
   - [ ] Remove `.filter/.map/.reduce` relying on global state from components; keep only UI transforms.
7. **Shared UI primitives**  
   - [ ] Centralize shared shadcn/Tailwind primitives in `frontend/shared/components`.
8. **Tighten TS & ESLint**  
   - [ ] Turn on strict flags; fix all `any`s; add rules and forbidden-import check.
9. **Add tests**  
   - [ ] Selector unit tests and component snapshots for key pages.
10. **Update docs**  
   - [ ] Keep this doc in sync; add a mini status table per phase.

---

## Definition of Done (migration)
- [ ] Components **never** import `app-data/services/*` or context hooks.
- [ ] All derived data available via `app-data/selectors/*`.
- [ ] `AppDataProvider` is the only stateful provider; data-fetch providers only hydrate entities.
- [ ] **Zero** ESLint warnings; **zero** TS errors with strict config.
- [ ] Tests: selectors covered; component snapshots stable.

---

## Next Step (Step 1 deliverable)
1. Land this document.
2. Create folders for `app-data/entities`, `app-data/selectors`, and `app-data/services` with README stubs (to be filled in next PR).
3. Prepare a small example selector (`selectRecentMatches`) with a TODO stub to illustrate call sites (added *after* folder scaffolding PR).

> After you merge Step 1 (this doc), I’ll deliver Step 2 as a zip that scaffolds the `app-data/*` folders and READMEs without touching runtime behavior.
