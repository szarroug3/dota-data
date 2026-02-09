# Frontend Library

This directory contains the core data management logic for the Dota Scout Assistant application. Modules are grouped by **domain** to keep the codebase navigable.

## Directory Structure

### `app-data/`

Core AppData class, types, and all operation/derivation modules. Domain-specific modules live in subfolders; core and cross-cutting ops stay at root.

- **Root:** `app-data.ts`, `app-data-types.ts`, plus cross-cutting ops: `app-data-computed-ops.ts`, `app-data-crud-ops.ts`, `app-data-data-ops.ts`, `app-data-statistics-ops.ts`, `app-data-ui-ops.ts`, `app-data-metadata-helpers.ts`.
- **`derivations/`** – Pure derivation modules and barrel: `app-data-derivations.ts`, `app-data-match-derivations.ts`, `app-data-hero-derivations.ts`, `app-data-player-derivations.ts`.
- **`match/`** – Match ops, placeholder, participation: `app-data-match-ops.ts`, `app-data-match-placeholder.ts`, `app-data-match-participation-ops.ts`, `app-data-participation-helpers.ts`.
- **`player/`** – `app-data-player-ops.ts`, `app-data-player-metadata-ops.ts`.
- **`team/`** – `app-data-team-ops.ts`.
- **`hero/`** – `app-data-hero-performance-ops.ts`, `app-data-hero-summary-ops.ts`.
- **`storage/`** – `app-data-storage-ops.ts` (persistence).
- **`lifecycle/`** – `app-data-initialization-ops.ts`, `app-data-loading-ops.ts`.

### `match/`

Match-specific loading, event processing, and timeline utilities.

- **`match-loader.ts`** – Fetches and processes full match data from OpenDota API; in-flight deduplication; `fetchAndProcessMatch()`, `processMatchData()`.
- **`match-events-processor.ts`** – Game event generation and processing: `generateEvents()`, `processGameEvents()`.
- **`match-performance-timeline.ts`** – Chart data and bounds: `createMatchPerformanceTimelineChartData()`, `computeChartBounds()`, `ChartDataPoint`, `ChartBounds`.

### `player/`

Player loading and statistics.

- **`player-loader.ts`** – Fetches and processes player data: `fetchAndProcessPlayer()`.
- **`player-statistics-calculator.ts`** – Player/hero/team stats types and calculations: `PlayerStats`, `HeroStats`, `TeamPlayerStats`, `DateRangeSelection`.

### `team/`

Team and league loading and display formatting.

- **`team-loader.ts`** – Fetches team data from API: `fetchTeamData()`, `getTeamMatchIdsFromCache()`.
- **`team-display-formatter.ts`** – Converts `Team` to UI format: `formatTeamForDisplay()`, `formatTeamsForDisplay()`.
- **`league-matches-loader.ts`** – League matches from Steam API; caching and deduplication: `processLeagueMatches()`, `getOrFetchLeagueMatches()`.

### `storage/`

Local persistence and optimization.

- **`storage-manager.ts`** – localStorage read/write: `loadTeamsFromStorage()`, `saveTeamsToStorage()`. Defines `StoredMatchData`, `StoredPlayerData`, `StoredHero`.
- **`storage-manager-optimization.ts`** – `cleanupOldTeams()`, `optimizeStorageData()` for quota and size control.

### `reference/`

Global reference data loading.

- **`reference-data-loader.ts`** – Loads heroes, items, leagues: `loadHeroes()`, `loadItems()`, `loadLeagues()`. Used once on app init.

### Other

- **`api-client/`** – API client utilities.
- **`cache/`** – Caching utilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AppData (app-data/app-data.ts)            │
└──────────────┬────────────────────────────────┬─────────────┘
               │                                │
       ┌───────▼────────┐              ┌───────▼────────┐
       │  Data Loading  │              │  Persistence   │
       └───────┬────────┘              └───────┬────────┘
               │                                │
     ┌─────────┼──────────┐           ┌────────▼────────┐
     │         │          │           │ storage/       │
     │         │          │           └─────────────────┘
┌────▼───┐ ┌──▼──────┐ ┌─▼──────────────┐
│ team/  │ │reference│ │ team/          │
│        │ │  /      │ │ league-matches │
└────────┘ └─────────┘ └────────────────┘
                │
        ┌───────▼──────────┐
        │ team/            │
        │ team-display-    │
        │ formatter        │
        └──────────────────┘
```

## Data Flow

### App Initialization

1. `AppDataProvider` creates `AppData` instance (from `app-data/app-data.ts`).
2. Calls `loadHeroesData()`, `loadItemsData()`, `loadLeaguesData()` (via `reference/reference-data-loader`).
3. Calls `loadFromStorage()` to restore saved teams (via `storage/storage-manager`).
4. React Context exposes `AppData` to components.

### Adding a Team

1. UI calls `appData.loadTeam(teamId, leagueId)`.
2. `AppData` creates a placeholder team with `isLoading: true`.
3. Fetches team data (`team/team-loader`) and league matches (`team/league-matches-loader`) in parallel.
4. Updates team and sets `isLoading: false`; calls `saveToStorage()`.

### Displaying Teams

1. UI calls `appData.getAllTeamsForDisplay()`.
2. `AppData` uses `team/team-display-formatter` to produce `TeamDisplayData`.
3. UI renders the formatted data.

## Usage Example

```typescript
import { useAppData } from '@/frontend/contexts/app-data-context';

function MyComponent() {
  const appData = useAppData();

  const teams = appData.getAllTeamsForDisplay();
  await appData.loadTeam(9517508, 18324);
  await appData.refreshTeam(9517508, 18324);
  appData.removeTeam('9517508-18324');
  appData.saveToStorage();
}
```

## Testing

Unit tests mirror this layout under `src/tests/frontend/lib/`: e.g. `app-data/app-data.test.ts`, `match/match-loader.test.ts`, `team/team-loader.test.ts`, `storage/storage-manager-optimization.test.ts`. Add or move tests so each module’s test lives in the matching subfolder.

## Import Paths

Use `@` aliases; no barrel files. Examples:

- `import { AppData } from '@/frontend/lib/app-data/app-data';`
- `import type { Match, Team } from '@/frontend/lib/app-data/app-data-types';`
- `import { formatTeamForDisplay } from '@/frontend/lib/team/team-display-formatter';`
- `import type { StoredMatchData } from '@/frontend/lib/storage/storage-manager';`
