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
- **🔄 Pick Order Calculation**: From teamSide + heroes data
- **🔄 Enhanced Match Details**: Transform basic Match data into MatchDetails
- **🔄 Hero Summary Aggregation**: Calculate stats across filtered matches
- **✅ Team Side Determination**: Already available in teamSide field

**Implementation Details**:
```typescript
// ✅ src/components/match-history/MatchHistoryPage.tsx
export const MatchHistoryPage = () => {
  // ✅ Local state for filters, view options, selected match
  // ✅ Responsive layout logic
  // ✅ Filter and view management
};

// ✅ Stateless components
// ✅ src/components/match-history/list/MatchesList.tsx
// ✅ src/components/match-history/list/MatchListView.tsx
// ✅ src/components/match-history/details/MatchDetailsPanel.tsx
// ✅ src/components/match-history/filters/MatchFilters.tsx
// 🔄 src/components/match-history/summary/HeroSummaryTable.tsx
```

**✅ Required Components - COMPLETE**:
- **✅ `MatchesList`** - Renders card/list/grid views with view mode persistence
- **✅ `MatchListView`** - Individual match display with responsive design
- **✅ `MatchDetailsPanel`** - Match details with multiple view options
- **✅ `MatchFilters`** - All filter controls with multi-select heroes dropdown
- **🔄 `HeroSummaryTable`** - 2x2 hero summary grid (in progress)
- **🔄 `AnalyticsModal`** - Charts and analytics (planned)
- **✅ Utility components**: `HideButton`, `RefreshButton`, `ParseButton` (implemented)

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