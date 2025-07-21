# Frontend Developer Todo List

# Data Flow Summary: Team → League-Specific Matches → Team-Side Players

## 🎯 **Core Data Flow**

### **1. User Adds Team**
- **Input**: `teamId` + `leagueId`
- **Action**: Fetch team data from `teams/[id]`
- **Result**: Team data with list of all matches (multiple leagues)

### **2gue-Specific Match Filtering**
- **Input**: Team's complete match list
- **Filter**: Only matches where `match.leagueId === leagueId`
- **Result**: Subset of matches for specific league

### **3. Match Data Fetching**
- **Input**: League-filtered match IDs
- **Action**: Fetch detailed match data from `matches/[id]`
- **Challenge**: Match data doesnt include team ID, so we dont know which side (radiant/dire) the team was on

### **4. Team Side Determination**
- **Logic**: Compare match result with team perspective
  - If teamwon" AND radiant won → team was radiant
  - If team won" AND dire won → team was dire
  - If team lost" AND radiant won → team was dire
  - If team "lost" AND dire won → team was radiant

### **5. Player Extraction**
- **Input**: Match data + determined team side
- **Action**: Extract only players from team's side (radiant or dire)
- **Result**: Team's players from that specific match

### **6. Player Aggregation**
- **Input**: Players from all league-specific matches
- **Action**: Deduplicate by account ID, aggregate stats across matches
- **Result**: Complete player roster for team in that league

---

## 🔄 **Additional Use Cases**

### **Manual Match Addition**
- **User Action**: Add match by `matchId`
- **Challenge**: Dont know which side team was on
- **Solution**: Guess based on existing player data from team
- **Fallback**: If no player data exists, can't determine team side

### **Manual Player Addition**
- **User Action**: Add player manually
- **No Special Logic**: Direct addition, no complex data dependencies

---

## 🎭 **Key Insights**

### **Team Perspective vs Match Data**
- **Team Data** (`teams/[id]`): From team's perspective (won/"lost")
- **Match Data** (`matches/[id]`): Raw match data (radiant_win, player slots)
- **Connection**: Use team's win/loss info to determine which side they were on

### **League-Specific Filtering**
- Teams participate in multiple leagues
- Only show matches from selected league
- Players aggregated only from league-specific matches

### **Player Deduplication**
- Same player can appear in multiple matches
- Aggregate stats across all league matches
- Maintain single player record per account ID

This creates a **hierarchical, league-specific data flow** where team selection drives match filtering, which drives player extraction and aggregation.

---

# 🏗️ **Context Architecture & Implementation**

## 🎭 **Context Hierarchy & Responsibilities**

### **1. Data Fetching Contexts** (API Layer)
**Purpose**: Raw API interactions and caching
**Responsibilities**:
- Handle all HTTP requests to external APIs
- Manage caching with TTL (Time To Live)
- Track errors per entity (team, match, player)
- Provide loading states for API operations
- Handle rate limiting and request optimization

**Implemented Contexts**:
- **TeamDataFetchingContext**: `teams/[id]` endpoint - [`src/contexts/team-data-fetching-context.tsx`](../src/contexts/team-data-fetching-context.tsx)
- **MatchDataFetchingContext**: `matches/[id]` endpoint - [`src/contexts/match-data-fetching-context.tsx`](../src/contexts/match-data-fetching-context.tsx)
- **PlayerDataFetchingContext**: `players/[id]` endpoints - [`src/contexts/player-data-fetching-context.tsx`](../src/contexts/player-data-fetching-context.tsx)
- **HeroDataFetchingContext**: `heroes` endpoint - [`src/contexts/hero-data-fetching-context.tsx`](../src/contexts/hero-data-fetching-context.tsx)

**Key Features**:
- Cache-first strategy with background refresh
- Per-ID error tracking (Map<string, string>)
- Cache invalidation and management
- Network error handling with retry logic

### **2Management Contexts** (Business Logic Layer)
**Purpose**: State management and data organization
**Responsibilities**:
- Manage application state for entities
- Coordinate with data fetching contexts
- Provide clean interfaces for UI components
- Handle optimistic updates and error recovery
- Implement filtering, sorting, and aggregation logic

**Implemented Contexts**:
- **TeamContext**: Team CRUD operations, league-specific filtering - [`src/contexts/team-context.tsx`](../src/contexts/team-context.tsx)
- **MatchContext**: Match filtering, sorting, selection - [`src/contexts/match-context.tsx`](../src/contexts/match-context.tsx)
- **PlayerContext**: Player aggregation, performance metrics - [`src/contexts/player-context.tsx`](../src/contexts/player-context.tsx)
- **HeroContext**: Hero state management and filtering - [`src/contexts/hero-context.tsx`](../src/contexts/hero-context.tsx)

**Key Features**:
- Optimistic updates for immediate user feedback
- League-specific data filtering
- Player aggregation across matches
- Error recovery mechanisms
- State synchronization between contexts

### **3. Data Coordinator Context** (Orchestration Layer)
**Purpose**: Coordinate complex operations across multiple contexts
**Responsibilities**:
- Orchestrate multi-step data operations
- Handle dependencies between contexts
- Manage complex state transitions
- Provide unified loading and error states
- Coordinate data fetching across multiple entities

**Implementation**: [`src/contexts/data-coordinator-context.tsx`](../src/contexts/data-coordinator-context.tsx)

**Key Features**:
- Multi-step team addition process
- Cross-context state synchronization
- Unified error handling
- Complex data transformation pipelines
- Background data refresh coordination

---

## 🔗 **Context Coordination Pattern**

### **Data Flow Architecture**
```
Data Fetching Contexts (API Layer)
    ↓
Data Management Contexts (Business Logic)
    ↓
Data Coordinator Context (Orchestration)
    ↓
UI Components (Presentation)
```

### **Example: Adding a Team**
1. **User Action**: Add team with `teamId` and `leagueId`
2. **Data Coordinator**: Orchestrates the multi-step process
3**TeamDataFetchingContext**: Fetches team data from API
4. **TeamContext**: Manages team state and operations
5. **MatchDataFetchingContext**: Fetches match data for team6 **MatchContext**: Filters matches by league
7**PlayerContext**: Aggregates players from league-specific matches
8UI**: Updates with complete team data

### **Context Dependencies**
- **Data Management Contexts** depend on **Data Fetching Contexts**
- **Data Coordinator Context** depend on **Data Management Contexts**
- **UI Components** depend on **Data Coordinator Context**

---

## 🎯 **Implementation Status**

### **✅ Completed**

#### **Data Fetching Contexts**
- **TeamDataFetchingContext**: ✅ Complete with caching and error handling
- **MatchDataFetchingContext**: ✅ Complete with caching and error handling  
- **PlayerDataFetchingContext**: ✅ Complete with caching and error handling
- **HeroDataFetchingContext**: ✅ Complete with caching and error handling

#### **Data Management Contexts**
- **TeamContext**: ✅ Complete with modular hooks, CRUD operations, league-specific filtering
  - Modular custom hooks for state, utilities, operations, league-specific operations, and error handling
  - Clean provider with proper type usage
  - Comprehensive test coverage
- **MatchContext**: ✅ Complete with filtering, sorting, selection, and user-action driven data fetching
  - Fresh implementation following established patterns
  - All required actions and state management
  - Comprehensive test coverage
- **PlayerContext**: ✅ Complete with player aggregation and performance metrics
  - Modular implementation with clear separation of concerns
  - Player filtering, selection, and management operations
  - Comprehensive test coverage with proper provider setup
- **HeroContext**: ✅ Complete with hero state management and filtering
  - Modular implementation following established patterns
  - Hero filtering, selection, and management operations
  - Comprehensive test coverage with proper provider setup

#### **UI-Focused Data Hooks**
- **useTeamData**: ✅ Complete - UI-friendly abstraction over team context
- **useMatchData**: ✅ Complete - UI-friendly abstraction over match context  
- **usePlayerData**: ✅ Complete - UI-friendly abstraction over player context
  - Comprehensive hook with internal selectors, state management, and action wrappers
  - Follows same pattern as useTeamData and useMatchData
  - Full type safety and test coverage
- **useHeroData**: ✅ Complete - UI-friendly abstraction over hero context
  - Comprehensive hook with internal selectors, state management, and action wrappers
  - Follows same pattern as other data hooks
  - Full type safety and test coverage with proper provider setup

#### **Data Coordinator Context**
- ✅ Basic orchestration implemented
- ✅ Multi-step team addition process
- ✅ Cross-context state synchronization

#### **Provider Architecture & Setup**
- ✅ **ClientRoot Provider Tree**: Complete provider hierarchy with proper ordering
  - All data fetching providers placed before their respective context providers
  - Proper provider nesting and dependency management
  - Comprehensive test coverage with mocks for external dependencies
- ✅ **Provider Order**: Fixed provider order to resolve context dependency errors
  - PlayerDataFetchingProvider and HeroDataFetchingProvider added
  - Proper provider nesting ensures all contexts are available
- ✅ **Test Infrastructure**: Complete test setup with proper mocking
  - Jest configuration extracted to separate files
  - TypeScript Jest configuration properly set up
  - Window matchMedia mock for theme provider
  - Hero data fetching context mocked in tests
  - All tests passing with zero warnings
- ✅ **Configuration**: Clean separation of Jest and TypeScript configurations
  - `jest.config.js` with proper test patterns
  - `tsconfig.jest.json` for TypeScript Jest configuration
  - Frontend app-level tests now properly recognized

#### **Testing & Quality**
- ✅ Comprehensive test coverage for all contexts
- ✅ Full TypeScript implementation with strict typing
- ✅ Linting and type-checking compliance
- ✅ Hook cleanup - removed auto-refresh logic from all data hooks
- ✅ Zero warning tolerance enforced
- ✅ All test suites passing with proper provider setup
- ✅ **Jest Configuration**: Extracted from package.json to separate config files
  - `jest.config.js` with proper test patterns
  - `tsconfig.jest.json` for TypeScript Jest configuration
  - Frontend app-level tests now properly recognized

#### **Hydration & Data Loading**
- ✅ **Automatic Data Loading**: Teams and their matches now load automatically on page load
- ✅ **TeamHydrationHandler**: Component handles hydration after DataCoordinatorProvider
- ✅ **One-time Execution**: Prevents repeated API calls using `useRef` pattern
- ✅ **Clean Separation**: Hydration logic separated from provider logic for better architecture
- ✅ **Provider Dependencies**: Fixed provider order to resolve context dependency errors
- ✅ **User Experience**: Seamless loading of saved teams and their match data without manual intervention

#### **Match History UI Foundation**
- ✅ **Folder Structure**: Organized match-history components into logical subfolders
  - `filters/` - Match filtering components
  - `list/` - Match list views and related components
  - `details/` - Match details panel components
  - `summary/` - Hero summary table
  - `common/` - Shared utility components (buttons, states)
- ✅ **Show Hidden Matches Feature**: Complete implementation with modal and state management
  - `HiddenMatchesModal` - Lists hidden matches with unhide functionality
  - Local state management for hidden matches and modal visibility
  - Proper TypeScript types and zero lint warnings
- ✅ **Code Quality**: All lint warnings resolved and proper type safety
  - Removed unused variables and components
  - Extracted functions to reduce complexity
  - Proper TypeScript interfaces for all props
  - Zero warning tolerance maintained

### **Match History UI Redesign Phase 1 - COMPLETE**
- ✅ **Component Architecture**: Simplified component structure with stateless components
  - Removed wrapper components (MatchHistoryContent, MatchHistoryMainContent)
  - Inlined render logic into MatchHistoryPage for cleaner structure
  - Clean separation of concerns with reusable components
- ✅ **Advanced Filtering System**: Complete implementation with multi-select heroes filter
  - Multi-select heroes dropdown with searchable interface
  - Real hero data integration using hero context
  - Alphabetical sorting of heroes by localized name
  - Full-width responsive filter layout
  - All filter types: date range, result, opponent, team side, heroes, pick order
- ✅ **View Mode Persistence**: localStorage-based view mode management
  - `useViewMode` hook for view mode state management
  - Persistence across browser sessions
  - Integration with config context for centralized state
- ✅ **Responsive Design**: Mobile-first implementation
  - Desktop: Side-by-side match list and details panel
  - Mobile: Collapsible match list with details panel
  - Adaptive filter layout for different screen sizes
- ✅ **Shadcn UI Integration**: Custom multi-select component
  - `MultiSelectCombobox` component using shadcn/ui patterns
  - Proper accessibility with ARIA labels and keyboard navigation
  - ESLint disabled for shadcn components to avoid linting issues
- ✅ **Code Quality & Architecture**: Modular and maintainable codebase
  - `filterMatches` utility function for match filtering logic
  - Stateless components for clean separation of concerns
  - Comprehensive TypeScript implementation
  - Zero linting warnings with proper ESLint configuration
  - Updated test infrastructure with proper provider mocking

### ✅ Recently Completed
- Refactored MatchDetailsPanel to use a single Card container with a view mode selector at the top, and updated MatchDetailsPanelSummary to remove nested cards and use a simple layout.
- Fixed linter warnings in MatchHistoryPage.tsx and match-context.tsx by refactoring complex functions into smaller helpers.

### 🔄 In Progress / Up Next
- **Resizable Layout Implementation**: Replace the fixed grid layout with shadcn's Resizable component
  - Two panels: Match List (left) and Match Details (right)
  - Users can drag to resize panels to their preference
  - Adaptive content based on available space:
    - **Wide List Panel**: Show full match info (opponent, date, duration, result, team side)
    - **Medium List Panel**: Show condensed info (opponent, result, duration)
    - **Narrow List Panel**: Show minimal info (opponent, result icon)
  - **Wide Details Panel**: Show comprehensive match details with all sections
  - **Narrow Details Panel**: Show essential info only (match header, score, key stats)
  - Responsive breakpoints for mobile (stacked layout)
  - Smooth transitions and proper accessibility

### **🔄 In Progress**
- **Match History UI Redesign Phase 2**: Data processing and enhanced match details implementation
- **Hero Summary Table**: 2x2 grid implementation for picks/bans from filtered matches
- **Test Infrastructure**: Fixing hero data fetching context mocks in test environment
- **Real API Integration**: Mock data in place, ready for real API endpoints

### **📋 Next Steps**

#### **1. Match History UI Redesign** (Priority: High)
**Current State**: ✅ Phase 1 Complete - Simplified component structure with advanced filtering and responsive design
**Phase 1**: ✅ UI Implementation - Removed wrapper components and implemented responsive layout
**Phase 2**: Data Enhancement - Add data processing in match context

**Phase 1 Implementation Status**:

##### **✅ 1.1 Component Cleanup - COMPLETE**
- **✅ Removed MatchHistoryContent wrapper** - Simplified component structure
- **✅ Inlined logic** - Moved render logic back into MatchHistoryPage
- **✅ Cleaned up props** - Reduced prop drilling and complexity
- **✅ Removed old components** - Deleted unused MatchList, MatchListView components

##### **✅ 1.2 Responsive Layout Implementation - COMPLETE**
**Desktop Layout**: ✅ Implemented
```
+====================================================================+
| [Filters: Date | Result | Opponent | Team Side | Heroes | 1st/2nd ]|
+====================================================================+
| +---------------------------+  +-------------------------------+  |
| |      Match List           |  |      Match Details Panel      |  |
| | (scrollable, left column) |  | (scrollable, right column)    |  |
| |---------------------------|  |-------------------------------|  |
| | [Match List Items]        |  | [Main Match Info]             |  |
| | [Card/List/Grid]          |  | [Player Table, Actions, etc.] |  |
| | [Hide] [Refresh] buttons  |  | [Parse Match] [Analytics]     |  |
| +---------------------------+  +-------------------------------+  |
+--------------------------------------------------------------------+
|                                                                |
| [Hero Summary Table: All Filtered Matches]                     |
| (Active Team Picks | Opponent Team Picks)                      |
| (Active Team Bans  | Opponent Team Bans)                       |
+----------------------------------------------------------------+
```

**Mobile Layout**: ✅ Implemented
```
+====================================================================+
| [Filters: ... ]                                                    |
+====================================================================+
| [Match List Dropdown]                                              |
| [▼ Show/Hide Match List]                                          |
| (collapsed by default, shows count of matches)                     |
+--------------------------------------------------------------------+
| [Match Details Panel]                                              |
| [Player Table, Actions, etc.]                                      |
+--------------------------------------------------------------------+
| [Hero Summary Table: All Filtered Matches]                         |
| (Active Team Picks | Opponent Team Picks)                          |
| (Active Team Bans  | Opponent Team Bans)                           |
+--------------------------------------------------------------------+
```

##### **✅ 1.3 Key Features Implementation - COMPLETE**
- **✅ List View Options**: Card/List/Grid views with view mode persistence (localStorage)
- **✅ Match Details Panel**: Multiple view options (Detailed/Minimal/Summary/Analytics)
- **✅ Advanced Filters**: Date range, result, opponent, team side, heroes, pick order
- **✅ Hero Summary Table**: 2x2 grid with picks/bans from filtered matches
- **✅ Match Actions**: Hide, refresh, parse functionality
- **✅ Responsive Design**: Mobile-first with collapsible match list

##### **🔄 1.4 Data Processing (Phase 2) - IN PROGRESS**

**Complete Context Architecture Analysis**: 
- **✅ MatchContext**: Comprehensive state management, filtering, and basic actions
- **✅ MatchDataFetchingContext**: `fetchMatchData()`, cache management, and error handling
- **✅ DataCoordinatorContext**: Coordinates between contexts and manages workflows
- **✅ ConstantsContext**: Hero/item data management, filtering, and utilities
- **✅ ConstantsDataFetchingContext**: Hero/item data fetching and caching
- **✅ TeamContext**: Team data management, league operations, and team selection
- **✅ TeamDataFetchingContext**: Team data fetching and caching
- **✅ PlayerContext**: Player data management, filtering, and operations
- **✅ PlayerDataFetchingContext**: Player data fetching and caching
- **✅ Type System**: Complete type definitions for all data structures
- **🔄 Missing**: Data generation functions for display components

**✅ COMPLETED: Type System Updates**
- **✅ MatchContextValue**: Updated with comprehensive types and new function signatures
- **✅ PlayerContextValue**: Already comprehensive, no changes needed
- **✅ TeamContextValue**: Already comprehensive, no changes needed  
- **✅ ConstantsContextValue**: Already comprehensive, no changes needed

**Current Available Functions by Context**:
```typescript
// ✅ MatchContext - Already Available
- matches, filteredMatches, selectedMatchId, selectedMatch
- filters, hiddenMatchIds, preferences, heroStatsGrid
- isLoadingMatches, isLoadingMatchDetails, isLoadingHeroStats
- matchesError, matchDetailsError, heroStatsError
- setFilters, selectMatch, hideMatch, showMatch
- addMatches, refreshMatches, refreshMatchDetails
- clearErrors, updatePreferences

// ✅ MatchDataFetchingContext - Already Available  
- fetchMatchData(matchId: string, force?: boolean)
- clearMatchCache, clearAllCache, isMatchCached
- clearMatchError, clearAllErrors, getMatchError

// ✅ ConstantsContext - Already Available
- heroes, filteredHeroes, selectedHeroId, selectedHero
- items, filteredItems, selectedItemId, selectedItem
- heroFilters, setHeroFilters
- isLoadingHeroes, isLoadingItems, isLoadingHeroData, isLoadingItemData
- heroesError, itemsError, heroDataError, itemDataError
- refreshHeroes, refreshItems, refreshHero, refreshItem
- setSelectedHero, setSelectedItem, clearHeroFilters
- findHero, findItem, heroExists, itemExists
- applyHeroFilters, areAllHeroFiltersEmpty
- convertOpenDotaHeroToHero, getItemImageByTitle

// ✅ ConstantsDataFetchingContext - Already Available
- fetchHeroesData(force?: boolean), fetchItemsData(force?: boolean)
- clearHeroesCache, clearItemsCache, clearAllCache
- clearHeroesError, clearItemsError, clearAllErrors
- isHeroesCached, isItemsCached, getHeroesError, getItemsError

// ✅ TeamContext - Already Available
- teamList, activeTeam, isLoading, error
- addTeam(teamId, leagueId), removeTeam(teamId, leagueId)
- setActiveTeam(teamId, leagueId), refreshTeam(teamId, leagueId)
- getTeamsByLeague(leagueId), getAllLeagues()
- processTeamData, findTeamData

// ✅ TeamDataFetchingContext - Already Available
- fetchTeamData(teamId, force?), fetchLeagueData(leagueId, force?)
- clearTeamCache, clearLeagueCache, clearAllCache
- clearTeamError, clearLeagueError, clearAllErrors
- isTeamCached, isLeagueCached, getTeamError, getLeagueError

// ✅ PlayerContext - Already Available
- players, filteredPlayers, selectedPlayerId, selectedPlayer
- filters, setFilters
- isLoadingPlayers, isLoadingPlayerData
- playersError, playerDataError
- setSelectedPlayer, addPlayer, removePlayer, refreshPlayer
- clearErrors, playerMatchesFilters

// ✅ PlayerDataFetchingContext - Already Available
- fetchPlayerData(playerId, force?), fetchPlayerMatches(playerId, force?)
- clearPlayerCache, clearPlayerMatchesCache, clearAllCache
- clearPlayerError, clearPlayerMatchesError, clearAllErrors
- isPlayerCached, isPlayerMatchesCached, getPlayerError, getPlayerMatchesError

// ✅ DataCoordinatorContext - Already Available
- activeTeam, operationState, errorState
- selectTeam, addTeamWithFullData, refreshTeamWithFullData
- analyzeMatchesForTeam, aggregatePlayersForTeam
- fetchMatchesForTeam, synchronizeContexts
- clearAllContexts, refreshAllData, handleContextError
- retryOperation, clearAllErrors, getUIStatus, handleUserAction
- coordinateTeamContext, coordinateMatchContext, coordinatePlayerContext, coordinateHeroContext
```

**Implementation Plan - What We Actually Need**:

#### **Required Data Types and Structures**

**Core Types:**
```typescript
// === MATCH TYPES ===
interface Match {
  id: string;
  teamId: string;
  leagueId: string;
  opponent: string;
  result: 'win' | 'loss';
  date: string; // ISO string
  duration: number; // in seconds
  teamSide: 'radiant' | 'dire';
  pickOrder: 'first' | 'second';
  players: Player[];
  heroes: string[]; // hero IDs
}

interface MatchDetails extends Match {
  radiantTeam: string;
  direTeam: string;
  radiantScore: number;
  direScore: number;
  gameMode: string;
  lobbyType: string;
  radiantPlayers: MatchPlayer[];
  direPlayers: MatchPlayer[];
  radiantPicks: string[];
  radiantBans: string[];
  direPicks: string[];
  direBans: string[];
  events: MatchEvent[];
  analysis: MatchAnalysis;
}

interface MatchPlayer {
  playerId: string;
  playerName: string;
  heroId: string;
  heroName: string;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  lastHits: number;
  denies: number;
  netWorth: number;
  items: string[];
  role: string;
}

interface MatchEvent {
  timestamp: number;
  type: 'kill' | 'death' | 'assist' | 'tower' | 'roshan' | 'ward' | 'item';
  playerId?: string;
  heroId?: string;
  position?: { x: number; y: number };
  details?: Record<string, string | number | boolean | null>;
}

interface MatchAnalysis {
  keyMoments: MatchMoment[];
  teamFights: TeamFight[];
  objectives: Objective[];
  performance: PerformanceMetrics;
}

interface MatchMoment {
  timestamp: number;
  type: 'teamfight' | 'objective' | 'gank' | 'push';
  description: string;
  impact: 'high' | 'medium' | 'low';
  participants: string[];
}

interface TeamFight {
  startTime: number;
  endTime: number;
  location: { x: number; y: number };
  radiantDeaths: number;
  direDeaths: number;
  winner: 'radiant' | 'dire' | 'draw';
}

interface Objective {
  type: 'tower' | 'roshan' | 'barracks' | 'ancient';
  timestamp: number;
  team: 'radiant' | 'dire';
  location: { x: number; y: number };
}

interface PerformanceMetrics {
  radiantAdvantage: number[];
  direAdvantage: number[];
  goldGraph: { time: number; radiant: number; dire: number }[];
  xpGraph: { time: number; radiant: number; dire: number }[];
}

// === PLAYER TYPES ===
interface Player {
  id: string;
  name: string;
  accountId: number;
  teamId: string;
  role: string;
  totalMatches: number;
  winRate: number;
  lastUpdated: string;
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  heroId: string;
  heroName: string;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  lastHits: number;
  denies: number;
  netWorth: number;
  gpm: number;
  xpm: number;
  items: string[];
  role: string;
}

interface PlayerPerformance {
  playerId: string;
  playerName: string;
  kda: number; // (kills + assists) / deaths
  gpm: number;
  xpm: number;
  netWorth: number;
  lastHits: number;
  denies: number;
  level: number;
  items: string[];
  role: string;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

interface TeamPerformance {
  radiant: TeamPerformanceData;
  dire: TeamPerformanceData;
  overall: {
    averageGpm: number;
    averageXpm: number;
    objectives: number;
    teamFights: number;
  };
}

interface TeamPerformanceData {
  averageGpm: number;
  averageXpm: number;
  objectives: number;
  teamFights: number;
  players: PlayerPerformance[];
}

// === HERO TYPES ===
interface Hero {
  id: string;
  name: string;
  localizedName: string;
  primaryAttribute: 'strength' | 'agility' | 'intelligence';
  attackType: 'melee' | 'ranged';
  roles: string[];
  complexity: number;
  imageUrl: string;
}

interface HeroSummary {
  heroId: string;
  heroName: string;
  heroImageUrl: string;
  count: number;
  winRate: number;
  usagePercentage: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

interface HeroSummaryData {
  activeTeamPicks: HeroSummary[];
  opponentTeamPicks: HeroSummary[];
  activeTeamBans: HeroSummary[];
  opponentTeamBans: HeroSummary[];
  totalMatches: number;
  activeTeamWinRate: number;
  opponentTeamWinRate: number;
}

interface HeroUsageStats {
  [heroId: string]: {
    pickCount: number;
    banCount: number;
    winCount: number;
    totalGames: number;
    pickRate: number;
    banRate: number;
    winRate: number;
  };
}

// === TEAM TYPES ===
interface Team {
  id: string;
  name: string;
  leagueId: string;
  leagueName: string;
  isActive: boolean;
  isLoading: boolean;
  error?: string;
}

interface TeamData {
  team: Team;
  league: {
    id: string;
    name: string;
  };
  matches: Match[];
  players: Player[];
  summary: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    overallWinRate: number;
    lastMatchDate: string | null;
    averageMatchDuration: number;
    totalPlayers: number;
  };
}

interface TeamPerformanceStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  averageGpm: number;
  averageXpm: number;
  averageObjectives: number;
  averageTeamFights: number;
}

// === DRAFT TYPES ===
interface DraftEvent {
  timestamp: number;
  type: 'pick' | 'ban';
  team: 'radiant' | 'dire';
  heroId: string;
  heroName: string;
  order: number;
}

interface PicksAndBans {
  radiant: {
    picks: string[];
    bans: string[];
  };
  dire: {
    picks: string[];
    bans: string[];
  };
  order: DraftEvent[];
}

// === TIMING TYPES ===
interface TimingData {
  matchDuration: number;
  keyMoments: KeyMoment[];
  objectives: Objective[];
  teamFights: TeamFight[];
  intervals: {
    early: number; // 0-10 minutes
    mid: number;   // 10-30 minutes
    late: number;  // 30+ minutes
  };
}

interface KeyMoment {
  timestamp: number;
  type: 'objective' | 'teamfight' | 'gank' | 'push';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// === UTILITY TYPES ===
interface LoadingState {
  isLoadingMatches: boolean;
  isLoadingMatchDetails: boolean;
  isLoadingHeroStats: boolean;
  isLoadingPlayers: boolean;
  isLoadingTeams: boolean;
  isLoadingHeroes: boolean;
  isLoadingItems: boolean;
  overall: boolean;
}

interface OperationProgress {
  isInProgress: boolean;
  currentStep: number;
  totalSteps: number;
  operationType: string | null;
  progress: {
    teamFetch: boolean;
    matchFetch: boolean;
    playerFetch: boolean;
    heroFetch: boolean;
    dataTransformation: boolean;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// === FILTER TYPES ===
interface MatchFilters {
  dateRange: {
    start: string | null;
    end: string | null;
  };
  result: 'all' | 'win' | 'loss';
  opponent: string;
  heroes: string[];
  players: string[];
  duration: {
    min: number | null;
    max: number | null;
  };
}

interface PlayerFilters {
  dateRange: { start: string | null; end: string | null };
  heroes: string[];
  roles: string[];
  result: 'all' | 'win' | 'lose';
  performance: {
    minKDA: number | null;
    minGPM: number | null;
    minXPM: number | null;
  };
}

interface HeroFilters {
  primaryAttribute: string[];
  attackType: string[];
  roles: string[];
  complexity: string[];
  difficulty: string[];
  pickRate: { min: number | null; max: number | null };
  winRate: { min: number | null; max: number | null };
}
```

**Data Requirements by Type:**

**Match Types:**
- `Match`: Basic match data (id, teams, result, date, duration, players, heroes)
- `MatchDetails`: Extended match data (full player details, picks/bans, events, analysis)
- `MatchPlayer`: Individual player performance in a match
- `MatchEvent`: Individual events during a match (kills, objectives, etc.)
- `MatchAnalysis`: Complete match analysis (key moments, team fights, performance)

**Player Types:**
- `Player`: Basic player information (id, name, team, role, stats)
- `PlayerStats`: Detailed player performance in a specific match
- `PlayerPerformance`: Calculated player performance metrics
- `TeamPerformance`: Team-wide performance data

**Hero Types:**
- `Hero`: Basic hero information (id, name, attributes, roles)
- `HeroSummary`: Aggregated hero statistics (usage, win rate, performance)
- `HeroSummaryData`: Complete hero summary for both teams
- `HeroUsageStats`: Detailed hero usage statistics

**Team Types:**
- `Team`: Basic team information (id, name, league)
- `TeamData`: Complete team data with matches, players, and summary
- `TeamPerformanceStats`: Calculated team performance metrics

**Draft Types:**
- `DraftEvent`: Individual draft event (pick/ban with timing)
- `PicksAndBans`: Complete draft data for both teams

**Timing Types:**
- `TimingData`: Match timing information with key moments
- `KeyMoment`: Individual key moment with impact assessment

**Utility Types:**
- `LoadingState`: Unified loading state across all contexts
- `OperationProgress`: Progress tracking for multi-step operations
- `ValidationResult`: Data validation results

**Filter Types:**
- `MatchFilters`: Match filtering criteria
- `PlayerFilters`: Player filtering criteria
- `HeroFilters`: Hero filtering criteria

#### **Step 1: Data Generation Functions** (Display Components)
**Purpose**: Generate data for stateless display components
**Order**: First priority since components need this data

1. **Match Details Generation** (Used by MatchDetailsPanel components)
   - `generateMatchDetails(match: Match): MatchDetails` - Transform basic match to detailed match
     - **Data Required**: Full match details including radiant/dire teams, scores, players, picks/bans, events, analysis
     - **Output**: Complete MatchDetails object with all match information
   - `generateDraftEvents(match: Match): DraftEvent[]` - Generate draft and pick/ban events
     - **Data Required**: Pick/ban order, timestamps, hero selections, team sides
     - **Output**: Array of draft events with timing and selection data
   - `generatePicksAndBans(match: Match): PicksAndBans` - Generate picks and bans data
     - **Data Required**: Hero selections for both teams, pick/ban order, team sides
     - **Output**: Structured picks and bans data for both teams

2. **Player Data Generation** (Used by MatchDetailsPanelPlayers)
   - `generatePlayerStats(match: Match, playerId: string): PlayerStats` - Generate player performance stats
     - **Data Required**: Player performance data (KDA, net worth, last hits, denies, level, items)
     - **Output**: Complete player statistics for the specific player
   - `generatePlayerPerformance(match: Match, playerId: string): PlayerPerformance` - Generate KDA, net worth, etc.
     - **Data Required**: Player's kills, deaths, assists, net worth, GPM, XPM, items, role
     - **Output**: Performance metrics and analysis for the player
   - `generateTeamPerformance(match: Match): TeamPerformance` - Generate team performance data
     - **Data Required**: Team-wide statistics, gold/XP graphs, team fight data, objectives
     - **Output**: Team performance analysis and statistics

3. **Hero Summary Data Generation** (Used by HeroSummaryTable)
   - `generateHeroSummaryData(matches: Match[]): HeroSummaryData` - Generate aggregated hero data for summary table
     - **Data Required**: All matches with hero selections, win/loss data, team sides
     - **Output**: Complete hero summary data structure with active/opponent picks and bans
   - `generateActiveTeamPicks(matches: Match[]): HeroSummary[]` - Generate active team pick statistics
     - **Data Required**: Matches where active team picked each hero, win/loss data
     - **Output**: Array of hero summaries with pick count, win rate, usage percentage
   - `generateOpponentTeamPicks(matches: Match[]): HeroSummary[]` - Generate opponent team pick statistics
     - **Data Required**: Matches where opponent team picked each hero, win/loss data
     - **Output**: Array of hero summaries with pick count, win rate, usage percentage
   - `generateActiveTeamBans(matches: Match[]): HeroSummary[]` - Generate active team ban statistics
     - **Data Required**: Matches where active team banned each hero, win/loss data
     - **Output**: Array of hero summaries with ban count, win rate, ban percentage
   - `generateOpponentTeamBans(matches: Match[]): HeroSummary[]` - Generate opponent team ban statistics
     - **Data Required**: Matches where opponent team banned each hero, win/loss data
     - **Output**: Array of hero summaries with ban count, win rate, ban percentage
   - `calculateHeroWinRate(heroId: string, matches: Match[], isActiveTeam: boolean): number` - Calculate win rate for specific hero
     - **Data Required**: Matches where the specified team used the hero, win/loss results
     - **Output**: Win rate percentage (0-100)
   - `calculateHeroUsageCount(heroId: string, matches: Match[], isActiveTeam: boolean): number` - Calculate usage count for specific hero
     - **Data Required**: Matches where the specified team used the hero
     - **Output**: Total usage count for the hero

4. **Timing & Analysis Generation** (Used by MatchDetailsPanelTimings)
   - `generateMatchTimings(match: Match): TimingData` - Generate match timing data
     - **Data Required**: Match duration, key event timestamps, objective timings
     - **Output**: Structured timing data with key moments and intervals
   - `generateMatchEvents(match: Match): MatchEvent[]` - Generate match events
     - **Data Required**: All match events (kills, deaths, objectives, team fights)
     - **Output**: Array of match events with timestamps and details
   - `generateMatchAnalysis(match: Match): MatchAnalysis` - Generate analysis and key moments
     - **Data Required**: Match performance data, key moments, team fight analysis
     - **Output**: Complete match analysis with insights and key moments

#### **Step 2: Utility Functions** (Formatting & Calculations)
**Purpose**: Provide formatting and calculation utilities
**Order**: After data generation (utilities may depend on generated data)

5. **Formatting Utilities**
   - `formatMatchDuration(duration: number): string` - Format match duration (e.g., "45:30")
     - **Data Required**: Match duration in seconds
     - **Output**: Formatted duration string (MM:SS format)
   - `formatMatchDate(date: string): string` - Format match date (e.g., "Jan 15, 2024")
     - **Data Required**: Match date as ISO string
     - **Output**: Formatted date string for display
   - `formatRelativeTime(date: string): string` - Format relative time (e.g., "2 hours ago")
     - **Data Required**: Match date as ISO string
     - **Output**: Relative time string (e.g., "2 hours ago", "3 days ago")
   - `formatMatchId(matchId: string): string` - Format match ID for display
     - **Data Required**: Raw match ID
     - **Output**: Formatted match ID for display

6. **Calculation Utilities**
   - `calculateWinRate(matches: Match[]): number` - Calculate win rate percentage
     - **Data Required**: Array of matches with win/loss results
     - **Output**: Win rate percentage (0-100)
   - `calculateAverageDuration(matches: Match[]): number` - Calculate average match duration
     - **Data Required**: Array of matches with duration data
     - **Output**: Average duration in seconds
   - `calculateHeroUsage(matches: Match[]): HeroUsageStats` - Calculate hero usage statistics
     - **Data Required**: Array of matches with hero selections and team sides
     - **Output**: Hero usage statistics (pick rate, ban rate, win rate per hero)
   - `calculateTeamPerformance(matches: Match[]): TeamPerformanceStats` - Calculate team performance metrics
     - **Data Required**: Array of matches with team performance data
     - **Output**: Team performance statistics (average GPM, XPM, objectives, etc.)

#### **Step 3: Enhanced State Management** (Advanced Features)
**Purpose**: Add advanced state management features
**Order**: After utilities (may use utility functions)

7. **Advanced State Functions**
   - `getLoadingState(): LoadingState` - Get comprehensive loading state
     - **Data Required**: Current loading states from all contexts
     - **Output**: Unified loading state object
   - `retryFailedOperation(): Promise<void>` - Retry last failed operation
     - **Data Required**: Last failed operation details and error state
     - **Output**: Promise that resolves when retry completes
   - `getOperationProgress(): OperationProgress` - Get progress for multi-step operations
     - **Data Required**: Current operation state and progress data
     - **Output**: Progress information for ongoing operations
   - `validateMatchData(match: Match): ValidationResult` - Validate match data integrity
     - **Data Required**: Match data to validate
     - **Output**: Validation result with errors/warnings

#### **Step 4: Integration & Testing** (Final Steps)
**Purpose**: Integrate with existing components and ensure quality
**Order**: After all functions are implemented

8. **Component Integration**
    - Update `MatchHistoryPage` to use new context functions
    - Replace local state management with context functions where appropriate
    - Update stateless components to use generated data functions
    - Ensure all components receive proper data through props

9. **Testing & Quality Assurance**
    - Add unit tests for all new context functions
    - Add integration tests for component data flow
    - Ensure zero linting warnings
    - Verify TypeScript type safety
    - Test error handling and edge cases

**Updated MatchContext Interface**:
```typescript
interface MatchContextValue {
  // === EXISTING DATA MANAGEMENT (✅ Already Available) ===
  matches: Match[];
  filteredMatches: Match[];
  selectedMatchId: string | null;
  selectedMatch: MatchDetails | null;
  hiddenMatchIds: string[];
  filters: MatchFilters;
  heroStatsGrid: HeroStatsGrid;
  preferences: MatchPreferences;
  isLoadingMatches: boolean;
  isLoadingMatchDetails: boolean;
  isLoadingHeroStats: boolean;
  matchesError: string | null;
  matchDetailsError: string | null;
  heroStatsError: string | null;
  
  // === EXISTING ACTIONS (✅ Already Available) ===
  setFilters: (filters: MatchFilters) => void;
  selectMatch: (matchId: string) => void;
  hideMatch: (matchId: string) => void;
  showMatch: (matchId: string) => void;
  addMatches: (matches: Match[]) => void;
  refreshMatches: () => Promise<void>;
  refreshMatchDetails: (matchId: string) => Promise<void>;
  clearErrors: () => void;
  updatePreferences: (preferences: Partial<MatchPreferences>) => void;
  
  // === NEW DATA GENERATION (🔄 To Implement) ===
  generateMatchDetails: (match: Match) => MatchDetails;
  generateDraftEvents: (match: Match) => DraftEvent[];
  generatePicksAndBans: (match: Match) => PicksAndBans;
  generatePlayerStats: (match: Match, playerId: string) => PlayerStats;
  generatePlayerPerformance: (match: Match, playerId: string) => PlayerPerformance;
  generateTeamPerformance: (match: Match) => TeamPerformance;
  generateHeroSummaryData: (matches: Match[]) => HeroSummaryData;
  generateActiveTeamPicks: (matches: Match[]) => HeroSummary[];
  generateOpponentTeamPicks: (matches: Match[]) => HeroSummary[];
  generateActiveTeamBans: (matches: Match[]) => HeroSummary[];
  generateOpponentTeamBans: (matches: Match[]) => HeroSummary[];
  calculateHeroWinRate: (heroId: string, matches: Match[], isActiveTeam: boolean) => number;
  calculateHeroUsageCount: (heroId: string, matches: Match[], isActiveTeam: boolean) => number;
  generateMatchTimings: (match: Match) => TimingData;
  generateMatchEvents: (match: Match) => MatchEvent[];
  generateMatchAnalysis: (match: Match) => MatchAnalysis;
  
  // === NEW UTILITIES (🔄 To Implement) ===
  formatMatchDuration: (duration: number) => string;
  formatMatchDate: (date: string) => string;
  formatRelativeTime: (date: string) => string;
  formatMatchId: (matchId: string) => string;
  calculateWinRate: (matches: Match[]) => number;
  calculateAverageDuration: (matches: Match[]) => number;
  calculateHeroUsage: (matches: Match[]) => HeroUsageStats;
  calculateTeamPerformance: (matches: Match[]) => TeamPerformanceStats;
  
  // === NEW ADVANCED STATE (🔄 To Implement) ===
  getLoadingState: () => LoadingState;
  retryFailedOperation: () => Promise<void>;
  getOperationProgress: () => OperationProgress;
  validateMatchData: (match: Match) => ValidationResult;
}
```

**Benefits of This Updated Plan**:
1. **Leverages Existing Infrastructure**: Uses already-implemented context architecture
2. **Focused Implementation**: Only implements what's actually missing
3. **Component Ready**: Data generation functions are what components actually need
4. **No Duplication**: Avoids reimplementing existing functionality
5. **Logical Flow**: Data generation → Utilities → Advanced features → Integration
6. **Rich Context Ecosystem**: Can leverage existing hero/item/team/player data

**Expected Timeline**:
- **Step 1**: 2-3 days (data generation functions)
- **Step 2**: 1-2 days (utilities)
- **Step 3**: 1 day (advanced state)
- **Step 4**: 1-2 days (integration & testing)
- **Total**: 5-8 days for complete implementation

**✅ Required Components - COMPLETE**:
- **✅ `MatchesList`** - Renders card/list/grid views with view mode persistence
- **✅ `MatchListView`** - Individual match display with responsive design
- **✅ `MatchDetailsPanel`** - Match details with multiple view options
- **✅ `MatchFilters`** - All filter controls with multi-select heroes dropdown
- **🔄 `HeroSummaryTable`** - 2x2 hero summary grid (in progress)
- **🔄 `AnalyticsModal`** - Charts and analytics (planned)
- **✅ Utility components**: `HideButton`, `RefreshButton`, `ParseButton` (implemented)

**Hero Summary Data Flow Architecture**:
```
MatchHistoryPage (Stateful)
├── Filters: Match[] (filtered matches)
├── HeroSummaryTable (Stateless)
    ├── Props: matches: Match[]
    ├── Data Source: generateHeroSummaryData(filteredMatches)
    ├── Internal Logic: aggregateHeroes() function
    └── Display: 2x2 grid with sorting and color-coded progress bars
```

**Hero Summary Implementation Details**:
- **Data Source**: Uses `filteredMatches` from MatchHistoryPage state
- **Data Generation**: `generateHeroSummaryData()` in match context processes matches
- **Component Props**: `matches: Match[]` - receives filtered matches from parent
- **Internal Processing**: Component aggregates hero data using `aggregateHeroes()` function
- **Display Features**: 
  - 2x2 grid layout (Active Picks | Opponent Picks | Active Bans | Opponent Bans)
  - Sortable columns (Win Rate, Count, Name)
  - Color-coded progress bars (blue for high-performance heroes)
  - Hero avatars with proper fallback initials
  - Responsive design with consistent column widths
- **Performance**: Uses `useMemo` for efficient data aggregation and sorting
- **State Management**: Each section maintains independent sort state

##### **✅ 1.5 Advanced Filtering - COMPLETE**
- **✅ Multi-select Heroes Filter**: Searchable dropdown with all heroes played in matches
- **✅ Full-width Filters Layout**: Responsive grid layout for all filter controls
- **✅ Real Hero Data Integration**: Uses hero context for actual hero data
- **✅ Alphabetical Sorting**: Heroes sorted alphabetically by localized name
- **✅ Shadcn UI Components**: MultiSelectCombobox component created and integrated

##### **✅ 1.6 Code Quality & Architecture - COMPLETE**
- **✅ Modular Hooks**: `useViewMode` hook for view mode persistence
- **✅ Utility Functions**: `filterMatches` utility for match filtering logic
- **✅ Stateless Components**: Clean separation of concerns
- **✅ Type Safety**: Full TypeScript implementation
- **✅ Linting Compliance**: Zero warnings with proper ESLint configuration
- **✅ Test Infrastructure**: Updated test setup with proper provider mocking

#### **2. Dashboard Component** (Priority: Medium)
**Purpose**: Main application overview and team management
**Location**: `src/components/dashboard/`
**Key Features**:
- Team addition and management interface
- League selection and filtering
- Overview cards showing team, match, and player counts
- Quick actions for data refresh and context clearing
- Error display and retry mechanisms

#### **3. Player Stats Component** (Priority: Medium)
**Purpose**: Player analysis and performance metrics
**Location**: `src/components/player-stats/`
**Key Features**:
- Player list with performance metrics
- Individual player detailed view
- Performance charts and trends
- Hero usage analysis
- Player comparison tools

#### **4. Enhance Data Coordinator Context** (Priority: Low)
**Current State**: Basic orchestration implemented, needs comprehensive enhancement
**Required Actions**:
- **Multi-step Operations**: Implement complex workflows like team addition with match fetching
- **Cross-context Synchronization**: Ensure state consistency across all contexts
- **Unified Error Handling**: Centralized error management and recovery
- **Complex Data Transformation**: Handle data transformation pipelines
- **Background Refresh Coordination**: Coordinate data refresh across multiple contexts
- **Progress Tracking**: Add progress indicators for multi-step operations
- **Batch Operations**: Support for batch data fetching and processing

#### **5. Real API Integration** (Priority: Low)
**Current State**: Mock data in place, ready for real API endpoints
**Required Actions**:
- Replace mock data with real API calls
- Implement proper error handling for network issues
- Add retry logic for failed requests
- Implement rate limiting for API calls
- Add loading states for API operations

---

## 🎯 **Recent Accomplishments**

### **Test Infrastructure & Quality Assurance** ✅
- **All Tests Passing**: Fixed all failing tests including cache service, page header, config context, and AppLayout tests
- **Type Checking**: Resolved all TypeScript type-checking issues with proper type definitions
- **Linting Compliance**: Zero linting warnings across the entire codebase
- **Test Coverage**: Comprehensive test coverage for all contexts and components
- **Mock Data Alignment**: Updated test mocks to match actual type definitions
- **Component Testing**: Fixed component tests to match actual implementations

### **Hydration Match Fetching Implementation** ✅
- **Automatic Data Loading**: Teams and their matches now load automatically on page load
- **Provider Architecture**: Created `TeamHydrationHandler` component to handle hydration after `DataCoordinatorProvider`
- **One-time Execution**: Prevents repeated API calls using `useRef` pattern
- **Clean Separation**: Hydration logic separated from provider logic for better architecture
- **Provider Dependencies**: Fixed provider order to resolve context dependency errors
- **User Experience**: Seamless loading of saved teams and their match data without manual intervention

### **Provider Architecture & Test Infrastructure** ✅
- **Complete Provider Tree**: Fixed provider order and dependencies in ClientRoot
- **Test Infrastructure**: Extracted Jest config to separate files with proper TypeScript support
- **Mock Setup**: Added window.matchMedia mock and hero data fetching context mocks
- **Test Coverage**: All tests passing with zero warnings and proper provider setup
- **Configuration**: Clean separation of Jest and TypeScript configurations

### **Player Context Implementation** ✅
- **Comprehensive Hook**: Created `usePlayerData` following established patterns
- **Modular Architecture**: Clear separation between data fetching and management
- **Type Safety**: Full TypeScript implementation with strict typing
- **Test Coverage**: Comprehensive tests with proper provider setup
- **Quality Assurance**: Zero linting warnings and type-checking errors

### **Hook Architecture Standardization** ✅
- **Consistent Pattern**: All data hooks follow same modular structure
- **UI-Focused Design**: Clean interfaces optimized for component usage
- **Error Handling**: Unified error management across all hooks
- **Loading States**: Consistent loading state management
- **Action Wrappers**: Convenient action methods for common operations

### **Type System Cleanup** ✅
- **Alignment**: Ensured types match actual context implementations
- **Removal**: Cleaned up unused types and interfaces
- **Exports**: Made necessary types available for import
- **Consistency**: Standardized type definitions across all contexts

---

## 🚀 **Implementation Strategy**

### **Match History UI Development**
1. **Refactor Layout**: Update MatchHistoryPage to use new responsive layout
2. **Create Stateless Components**: Build all required stateless components
3. **Implement Filters**: Add all advanced filter options
4. **Add View Options**: Implement card/list/grid views for match list
5uild Details Panel**: Create match details with multiple view options
6. **Add Hero Summary**: Implement 2x2 hero summary table
7. **Add Actions**: Implement hide, refresh, and parse functionality
8. **Responsive Design**: Ensure mobile-friendly collapsible layout

### **Component Architecture**
1. **Hook Integration**: Use existing data hooks for state management
2. **Responsive Design**: Implement mobile-first design with Tailwind
3**Accessibility**: Add ARIA labels and keyboard navigation
4. **Testing**: Create component tests with proper mocking

### **Data Coordinator Enhancement**
1. **Analyze Current Implementation**: Review existing data coordinator context
2**Identify Gaps**: Find missing orchestration features
3. **Design Workflows**: Plan complex multi-step operations
4. **Implement Features**: Add missing coordination capabilities
5. **Test Integration**: Ensure all contexts work together properly

### **API Integration**
1. **Endpoint Mapping**: Map mock data to real API endpoints
2. **Error Handling**: Implement robust error handling
3. **Performance**: Add caching and optimization
4. **Testing**: Test with real API responses

This architecture provides a **solid foundation** for building a comprehensive Dota 2 data dashboard with clean separation of concerns, type safety, and excellent developer experience.

**✅ COMPLETED: Type System**
All context value files have been updated with comprehensive type definitions:
- **MatchContextValue**: Updated with comprehensive types and new function signatures
- **Complete Type System**: 8 categories with 30+ interfaces covering all data structures
- **Type Safety**: All functions now have proper TypeScript signatures

**🔄 NEXT: Implementation Plan**

#### **Phase 1: Data Generation Functions Implementation** (Priority 1)
**Purpose**: Implement the core data generation functions that components need
**Timeline**: 2-3 days

**Step 1.1: Match Details Generation** (Day 1)
- Implement `generateMatchDetails(match: Match): MatchDetails`
- Implement `generateDraftEvents(match: Match): DraftEvent[]`
- Implement `generatePicksAndBans(match: Match): PicksAndBans`
- **Testing**: Unit tests for each function
- **Integration**: Test with existing MatchDetailsPanel components

**Step 1.2: Player Data Generation** (Day 1-2)
- Implement `generatePlayerStats(match: Match, playerId: string): PlayerStats`
- Implement `generatePlayerPerformance(match: Match, playerId: string): PlayerPerformance`
- Implement `generateTeamPerformance(match: Match): TeamPerformance`
- **Testing**: Unit tests for each function
- **Integration**: Test with existing MatchDetailsPanelPlayers components

**Step 1.3: Hero Summary Data Generation** (Day 2-3)
- Implement `generateHeroSummaryData(matches: Match[]): HeroSummaryData`
- Implement `generateActiveTeamPicks(matches: Match[]): HeroSummary[]`
- Implement `generateOpponentTeamPicks(matches: Match[]): HeroSummary[]`
- Implement `generateActiveTeamBans(matches: Match[]): HeroSummary[]`
- Implement `generateOpponentTeamBans(matches: Match[]): HeroSummary[]`
- Implement `calculateHeroWinRate(heroId: string, matches: Match[], isActiveTeam: boolean): number`
- Implement `calculateHeroUsageCount(heroId: string, matches: Match[], isActiveTeam: boolean): number`
- **Testing**: Unit tests for each function
- **Integration**: Test with existing HeroSummaryTable component

**Step 1.4: Timing & Analysis Generation** (Day 3)
- Implement `generateMatchTimings(match: Match): TimingData`
- Implement `generateMatchEvents(match: Match): MatchEvent[]`
- Implement `generateMatchAnalysis(match: Match): MatchAnalysis`
- **Testing**: Unit tests for each function
- **Integration**: Test with existing MatchDetailsPanelTimings components

#### **Phase 2: Utility Functions Implementation** (Priority 2)
**Purpose**: Implement formatting and calculation utilities
**Timeline**: 1-2 days

**Step 2.1: Formatting Utilities** (Day 4)
- Implement `formatMatchDuration(duration: number): string`
- Implement `formatMatchDate(date: string): string`
- Implement `formatRelativeTime(date: string): string`
- Implement `formatMatchId(matchId: string): string`
- **Testing**: Unit tests for each function

**Step 2.2: Calculation Utilities** (Day 4-5)
- Implement `calculateWinRate(matches: Match[]): number`
- Implement `calculateAverageDuration(matches: Match[]): number`
- Implement `calculateHeroUsage(matches: Match[]): HeroUsageStats`
- Implement `calculateTeamPerformance(matches: Match[]): TeamPerformanceStats`
- **Testing**: Unit tests for each function

#### **Phase 3: Advanced State Management** (Priority 3)
**Purpose**: Implement advanced state management features
**Timeline**: 1 day

**Step 3.1: Advanced State Functions** (Day 6)
- Implement `getLoadingState(): LoadingState`
- Implement `retryFailedOperation(): Promise<void>`
- Implement `getOperationProgress(): OperationProgress`
- Implement `validateMatchData(match: Match): ValidationResult`
- **Testing**: Unit tests for each function

#### **Phase 4: Integration & Testing** (Priority 4)
**Purpose**: Integrate with existing components and ensure quality
**Timeline**: 1-2 days

**Step 4.1: Component Integration** (Day 7)
- Update `MatchHistoryPage` to use new context functions
- Replace local state management with context functions where appropriate
- Update stateless components to use generated data functions
- Ensure all components receive proper data through props

**Step 4.2: Quality Assurance** (Day 8)
- Add integration tests for component data flow
- Ensure zero linting warnings
- Verify TypeScript type safety
- Test error handling and edge cases
- Performance testing and optimization

**Implementation Strategy**:
1. **Start with Phase 1**: Data generation functions are what components actually need
2. **Test as you go**: Each function should have unit tests before moving to the next
3. **Leverage existing contexts**: Use hero data from ConstantsContext, team data from TeamContext, etc.
4. **Incremental integration**: Test each function with existing components
5. **Quality first**: Ensure type safety and error handling throughout

**Expected Outcomes**:
- **Complete data generation**: All 15 data generation functions implemented and tested
- **Rich utility functions**: 8 utility functions for formatting and calculations
- **Advanced state management**: 4 advanced state functions for complex operations
- **Full integration**: All components using the new context functions
- **Zero technical debt**: Complete test coverage and type safety

**Success Criteria**:
- ✅ All data generation functions implemented and tested
- ✅ All utility functions implemented and tested
- ✅ All advanced state functions implemented and tested
- ✅ Components successfully integrated with new functions
- ✅ Zero linting errors or TypeScript warnings
- ✅ Complete test coverage for all new functions
- ✅ Performance meets requirements
- ✅ Error handling works correctly