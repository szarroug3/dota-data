# Frontend Developer Todo List

# Data Flow Summary: Team → League-Specific Matches → Team-Side Players

## 🎯 **Core Data Flow**

### **1. User Adds Team**
- **Input**: `teamId` + `leagueId`
- **Action**: Fetch team data from `teams/[id]`
- **Result**: Team data with list of all matches (multiple leagues)

### **2. League-Specific Match Filtering**
- **Input**: Team's complete match list
- **Filter**: Only matches where `match.leagueId === leagueId`
- **Result**: Subset of matches for specific league

### **3. Match Data Fetching**
- **Input**: League-filtered match IDs
- **Action**: Fetch detailed match data from `matches/[id]`
- **Challenge**: Match data doesn't include team ID, so we don't know which side (radiant/dire) the team was on

### **4. Team Side Determination**
- **Logic**: Compare match result with team's perspective
  - If team "won" AND radiant won → team was radiant
  - If team "won" AND dire won → team was dire
  - If team "lost" AND radiant won → team was dire
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
- **Challenge**: Don't know which side team was on
- **Solution**: Guess based on existing player data from team
- **Fallback**: If no player data exists, can't determine team side

### **Manual Player Addition**
- **User Action**: Add player manually
- **No Special Logic**: Direct addition, no complex data dependencies

---

## 🎭 **Key Insights**

### **Team Perspective vs Match Data**
- **Team Data** (`teams/[id]`): From team's perspective ("won"/"lost")
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

### **2. Data Management Contexts** (Business Logic Layer)
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
3. **TeamDataFetchingContext**: Fetches team data from API
4. **TeamContext**: Manages team state and operations
5. **MatchDataFetchingContext**: Fetches match data for team
6. **MatchContext**: Filters matches by league
7. **PlayerContext**: Aggregates players from league-specific matches
8. **UI**: Updates with complete team data

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

### **🔄 In Progress**
- **Stateful UI Components**: Ready for development with context architecture in place
- **Real API Integration**: Mock data in place, ready for real API endpoints

### **📋 Next Steps**

#### **1. Build Stateful UI Components** (Priority: High)
**Current State**: Context architecture is complete and ready for UI development
**Required Actions**: Create comprehensive stateful components using the established data hooks

**Implementation Order**:

##### **1.1 Dashboard Component** (Priority: Highest)
**Purpose**: Main application overview and team management
**Location**: `src/components/dashboard/`
**Key Features**:
- Team addition and management interface
- League selection and filtering
- Overview cards showing team, match, and player counts
- Quick actions for data refresh and context clearing
- Error display and retry mechanisms

**Implementation Details**:
```typescript
// src/components/dashboard/Dashboard.tsx
import { useTeamData, useMatchData, usePlayerData } from '@/hooks';

export const Dashboard = () => {
  const { teams, addTeam, isLoadingTeams, teamsError } = useTeamData();
  const { matches, isLoadingMatches } = useMatchData();
  const { players, isLoadingPlayers } = usePlayerData();
  
  // Team management interface
  // League selection dropdown
  // Overview statistics cards
  // Error handling and retry buttons
};
```

**Required Components**:
- `TeamManagementPanel` - Add/remove teams, league selection
- `OverviewCards` - Display counts and statistics
- `ErrorDisplay` - Show errors with retry options
- `LoadingStates` - Handle loading states across contexts

##### **1.2 Match History Component** (Priority: High)
**Purpose**: Display and filter match data for selected team/league
**Location**: `src/components/match-history/`
**Key Features**:
- Match list with filtering and sorting
- Match details modal/sidebar
- Performance metrics and statistics
- Export functionality for match data
- Timeline view of matches

**Implementation Details**:
```typescript
// src/components/match-history/MatchHistory.tsx
import { useMatchData } from '@/hooks';

export const MatchHistory = () => {
  const { 
    matches, 
    filteredMatches, 
    selectedMatch,
    filters,
    setFilters,
    selectMatch,
    isLoadingMatches 
  } = useMatchData();
  
  // Match list with filtering
  // Match details view
  // Performance charts
  // Export functionality
};
```

**Required Components**:
- `MatchList` - Display matches with filtering
- `MatchDetails` - Detailed match information
- `MatchFilters` - Filter and sort controls
- `MatchTimeline` - Visual timeline of matches
- `PerformanceCharts` - Match performance analytics

##### **1.3 Player Stats Component** (Priority: High)
**Purpose**: Player analysis and performance metrics
**Location**: `src/components/player-stats/`
**Key Features**:
- Player list with performance metrics
- Individual player detailed view
- Performance charts and trends
- Hero usage analysis
- Player comparison tools

**Implementation Details**:
```typescript
// src/components/player-stats/PlayerStats.tsx
import { usePlayerData, useHeroData } from '@/hooks';

export const PlayerStats = () => {
  const { 
    players, 
    filteredPlayers,
    selectedPlayer,
    filters,
    setFilters,
    setSelectedPlayer 
  } = usePlayerData();
  
  const { heroes } = useHeroData();
  
  // Player list with stats
  // Individual player view
  // Performance charts
  // Hero usage analysis
};
```

**Required Components**:
- `PlayerList` - Display players with performance metrics
- `PlayerDetails` - Detailed player information
- `PlayerFilters` - Filter by performance, heroes, roles
- `PerformanceCharts` - Player performance analytics
- `HeroUsageAnalysis` - Hero pick/ban analysis
- `PlayerComparison` - Compare multiple players

#### **2. Enhance Data Coordinator Context** (Priority: Medium)
**Current State**: Basic orchestration implemented, needs comprehensive enhancement
**Required Actions**:
- **Multi-step Operations**: Implement complex workflows like team addition with match fetching
- **Cross-context Synchronization**: Ensure state consistency across all contexts
- **Unified Error Handling**: Centralized error management and recovery
- **Complex Data Transformation**: Handle data transformation pipelines
- **Background Refresh Coordination**: Coordinate data refresh across multiple contexts
- **Progress Tracking**: Add progress indicators for multi-step operations
- **Batch Operations**: Support for batch data fetching and processing

**Implementation Details**:
```typescript
// Example: Enhanced team addition workflow
const addTeamWithMatches = async (teamId: string, leagueId: string) => {
  // Step 1: Fetch team data
  // Step 2: Fetch all team matches
  // Step 3: Filter matches by league
  // Step 4: Fetch detailed match data
  // Step 5: Extract and aggregate players
  // Step 6: Update all contexts
}
```

#### **3. Real API Integration** (Priority: Low)
**Current State**: Mock data in place, ready for real API endpoints
**Required Actions**:
- Replace mock data with real API calls
- Implement proper error handling for network issues
- Add retry logic for failed requests
- Implement rate limiting for API calls
- Add loading states for API operations

---

## 🎯 **Recent Accomplishments**

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

### **Stateful Component Development**
1. **Dashboard First**: Start with main dashboard for team management
2. **Match History**: Build match display and filtering capabilities
3. **Player Stats**: Implement player analysis and performance metrics
4. **Component Integration**: Ensure all components work together seamlessly

### **Component Architecture**
1. **Hook Integration**: Use existing data hooks for state management
2. **Responsive Design**: Implement mobile-first design with Tailwind
3. **Accessibility**: Add ARIA labels and keyboard navigation
4. **Testing**: Create component tests with proper mocking

### **Data Coordinator Enhancement**
1. **Analyze Current Implementation**: Review existing data coordinator context
2. **Identify Gaps**: Find missing orchestration features
3. **Design Workflows**: Plan complex multi-step operations
4. **Implement Features**: Add missing coordination capabilities
5. **Test Integration**: Ensure all contexts work together properly

### **API Integration**
1. **Endpoint Mapping**: Map mock data to real API endpoints
2. **Error Handling**: Implement robust error handling
3. **Performance**: Add caching and optimization
4. **Testing**: Test with real API responses

This architecture provides a **solid foundation** for building a comprehensive Dota 2 data dashboard with clean separation of concerns, type safety, and excellent developer experience.