# Frontend Library

This directory contains the core data management logic for the Dota Scout Assistant application.

## File Structure

### Core Files

- **`app-data.ts`** (15KB, 543 lines)
  - Main `AppData` class - single source of truth for application state
  - CRUD operations for teams, matches, and players
  - Orchestrates data loading and persistence
  - Entry point for all data operations

- **`app-data-types.ts`** (3.1KB)
  - All TypeScript interfaces and types for AppData
  - Includes: `Team`, `Match`, `Player`, `Hero`, `Item`, `League`
  - UI types: `TeamDisplayData`, `AppDataState`
  - Cache types: `LeagueMatchesCache`, `LeagueMatchInfo`

### Helper Modules

- **`reference-data-loader.ts`** (2.5KB)
  - Loads global reference data (heroes, items, leagues)
  - Functions: `loadHeroes()`, `loadItems()`, `loadLeagues()`
  - Called once on app initialization

- **`storage-manager.ts`** (5.8KB)
  - Handles localStorage persistence
  - Functions: `saveTeamsToStorage()`, `loadTeamsFromStorage()`
  - Maintains backwards compatibility with old storage format

- **`team-loader.ts`** (899B)
  - Fetches individual team data from Steam API
  - Function: `fetchTeamData(teamId)`
  - Used during team addition/refresh

- **`league-matches-loader.ts`** (3.9KB)
  - Processes league matches data from Steam API
  - Extracts match IDs, team IDs, and player IDs
  - Implements caching to avoid redundant fetches
  - Functions: `processLeagueMatches()`, `fetchAndProcessLeagueMatches()`, `getOrFetchLeagueMatches()`

- **`match-loader.ts`** (7.5KB)
  - Fetches and processes full match data from OpenDota API
  - Converts raw API data into AppData Match format
  - Includes draft, player stats, and match statistics
  - Implements in-flight request deduplication
  - Function: `fetchAndProcessMatch(matchId)`

- **`team-display-formatter.ts`** (1.4KB)
  - Converts internal `Team` data to UI display format (`TeamDisplayData`)
  - Functions: `formatTeamForDisplay()`, `formatTeamsForDisplay()`
  - Handles error message formatting

### Legacy Files

- **`fetch-cache.ts`** (1.5KB) - Legacy caching utilities
- **`optimistic-operations.ts`** (6.8KB) - Legacy optimistic update logic

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AppData                              │
│                   (Main orchestrator)                        │
└──────────────┬────────────────────────────────┬─────────────┘
               │                                │
       ┌───────▼────────┐              ┌───────▼────────┐
       │  Data Loading  │              │  Persistence   │
       └───────┬────────┘              └───────┬────────┘
               │                                │
     ┌─────────┼──────────┐           ┌────────▼────────┐
     │         │          │           │ storage-manager │
     │         │          │           └─────────────────┘
┌────▼───┐ ┌──▼──────┐ ┌─▼──────────────┐
│ team-  │ │reference│ │ league-matches │
│ loader │ │  -data  │ │   -processor   │
│        │ │ -loader │ │                │
└────────┘ └─────────┘ └────────────────┘
                │
        ┌───────▼──────────┐
        │ team-display     │
        │  -formatter      │
        └──────────────────┘
```

## Data Flow

### App Initialization

1. `AppDataProvider` creates `AppData` instance
2. Calls `loadHeroesData()`, `loadItemsData()`, `loadLeaguesData()` in parallel
3. Calls `loadFromStorage()` to restore saved teams
4. React Context makes `AppData` available to components

### Adding a Team

1. UI calls `appData.loadTeam(teamId, leagueId)`
2. `AppData` creates placeholder team with `isLoading: true`
3. Fetches team data (via `team-loader`) and league matches (via `league-matches-loader`) in parallel
4. Updates team with fetched data and sets `isLoading: false`
5. Calls `saveToStorage()` to persist

### Displaying Teams

1. UI calls `appData.getAllTeamsForDisplay()`
2. `AppData` delegates to `formatTeamsForDisplay()`
3. Formatter converts each `Team` to `TeamDisplayData` with error messages
4. UI renders the formatted data

## Usage Example

```typescript
import { useAppData } from '@/contexts/app-data-context';

function MyComponent() {
  const appData = useAppData();

  // Get teams for display
  const teams = appData.getAllTeamsForDisplay();

  // Add a new team
  await appData.loadTeam(9517508, 18324);

  // Refresh a team
  await appData.refreshTeam(9517508, 18324);

  // Remove a team
  appData.removeTeam('9517508-18324');
  appData.saveToStorage();
}
```

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single, well-defined responsibility
2. **Maintainability**: Smaller files (< 200 lines each) are easier to understand and modify
3. **Testability**: Helper functions can be unit tested independently
4. **Reusability**: Formatters and loaders can be used in different contexts
5. **Scalability**: Easy to add new helpers without bloating the main file

## Future Improvements

- Extract team operations (`loadTeam`, `refreshTeam`) into `team-operations.ts`
- Create computed data helpers for match/player statistics
- Add more granular loading states per entity
- Implement data validation layer
