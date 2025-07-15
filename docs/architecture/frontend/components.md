# Frontend Components

This document outlines the component patterns, organization, and architecture for the Dota Scout Assistant.

## Table of Contents

- [Component Organization](#component-organization)
- [Layout Components](#layout-components)
- [Page Components](#page-components)
- [Component Patterns](#component-patterns)
- [Component Testing](#component-testing)
- [Reusable Components](#reusable-components)

## Component Organization

### Folder Structure
```
src/components/
├── layout/                      # Layout components
│   ├── Sidebar.tsx
│   ├── SidebarNavigation.tsx
│   ├── QuickLinks.tsx
│   ├── ExternalResources.tsx
│   ├── SidebarSettings.tsx
│   ├── SidebarToggle.tsx
│   └── MobileSidebarToggle.tsx
├── team-management/             # Team management components
├── match-history/               # Match history components
├── player-stats/                # Player stats components
├── draft-suggestions/           # Draft suggestions components
├── team-analysis/               # Team analysis components
├── match/                       # Match-related components
├── player/                      # Player-related components
├── hero/                        # Hero-related components
├── team/                        # Team-related components
└── ui/                          # Reusable UI primitives
```

### Component Categories

#### **Layout Components**
- **Purpose**: Navigation, layout, and global UI elements
- **Location**: `src/components/layout/`
- **Examples**: Sidebar, Header, Navigation

#### **Page Components**
- **Purpose**: Main page containers and orchestrators
- **Location**: `src/components/[page-name]/`
- **Examples**: TeamManagementPage, MatchHistoryPage

#### **Feature Components**
- **Purpose**: Feature-specific functionality
- **Location**: `src/components/[feature]/`
- **Examples**: MatchCard, PlayerCard, HeroCard

#### **UI Components**
- **Purpose**: Reusable UI primitives
- **Location**: `src/components/ui/`
- **Examples**: Button, Modal, Form

## Layout Components

### Sidebar Component

#### Overview
The Sidebar provides persistent navigation, quick access to external resources, and global settings like theme and preferred external sites. It's always visible on desktop and collapsible on mobile, serving as the primary navigation hub for the application.

#### Components

##### 1. `Sidebar` (Container)
- **Location:** `src/components/layout/Sidebar.tsx`
- **Purpose:** Main sidebar container with navigation and settings
- **Props:** None
- **Children:** SidebarNavigation, QuickLinks, ExternalResources, SidebarSettings, SidebarToggle
- **Features:**
  - Persistent visibility on desktop
  - Collapsible/expandable with smooth transitions
  - Icon-only mode when collapsed
  - Full mode when expanded
  - Responsive design (collapsible on mobile with hamburger menu)
  - Theme-aware styling (light/dark mode)
  - Hover tooltips in collapsed mode

##### 2. `SidebarNavigation`
- **Location:** `src/components/sidebar/SidebarNavigation.tsx`
- **Purpose:** Primary page navigation links
- **Props:**
  - `currentPage: string`
  - `onNavigate: (page: string) => void`
  - `isCollapsed: boolean`
- **Features:**
  - Team Management link with icon
  - Match History link with icon
  - Player Stats link with icon
  - Draft Suggestions link with icon
  - Active page highlighting
  - Hover effects and transitions
  - Keyboard navigation support
  - **Collapsed Mode:** Shows only icons with hover tooltips
  - **Expanded Mode:** Shows icons with labels
  - Smooth transitions between modes

##### 3. `QuickLinks`
- **Location:** `src/components/sidebar/QuickLinks.tsx`
- **Purpose:** Quick access to active team and league pages
- **Props:**
  - `isCollapsed: boolean`
  - `activeTeam: { id: string; name: string; league: string } | null`
- **Features:**
  - Team page link (only shown if active team is set)
  - League page link (only shown if active team is set)
  - Opens external Dotabuff pages in new tab
  - **Collapsed Mode:** Shows only icons with hover tooltips
  - **Expanded Mode:** Shows icons with labels
  - Smooth transitions between modes

##### 4. `ExternalResources`
- **Location:** `src/components/sidebar/ExternalResources.tsx`
- **Purpose:** Links to external Dota 2 resources
- **Props:**
  - `isCollapsed: boolean`
- **Features:**
  - Dotabuff link with icon
  - OpenDota link with icon
  - Dota2ProTracker link with icon
  - Opens in new tab
  - Hover tooltips with descriptions
  - **Collapsed Mode:** Shows only icons with hover tooltips
  - **Expanded Mode:** Shows icons with labels
  - Smooth transitions between modes

##### 5. `SidebarSettings`
- **Location:** `src/components/sidebar/SidebarSettings.tsx`
- **Purpose:** Global settings and preferences
- **Props:**
  - `theme: 'light' | 'dark'`
  - `preferredSite: 'dotabuff' | 'opendota'`
  - `onThemeChange: (theme: 'light' | 'dark') => void`
  - `onPreferredSiteChange: (site: 'dotabuff' | 'opendota') => void`
  - `isCollapsed: boolean`
- **Features:**
  - Theme toggle (light/dark mode)
  - Preferred site selector (Dotabuff/OpenDota)
  - Settings persistence to localStorage
  - Smooth theme transitions
  - Visual indicators for current settings
  - **Collapsed Mode:** Shows only toggle switches with hover tooltips
  - **Expanded Mode:** Shows full settings panel with all options
  - Smooth transitions between modes

##### 6. `SidebarToggle` (Desktop)
- **Location:** `src/components/sidebar/SidebarToggle.tsx`
- **Purpose:** Desktop sidebar collapse/expand toggle
- **Props:**
  - `isCollapsed: boolean`
  - `onToggle: () => void`
- **Features:**
  - Chevron icon (left/right based on state)
  - Animated toggle with smooth transitions
  - Hover tooltip ("Collapse sidebar" / "Expand sidebar")
  - Touch-friendly target size
  - Keyboard accessible
  - Screen reader support

##### 7. `MobileSidebarToggle` (Mobile)
- **Location:** `src/components/sidebar/MobileSidebarToggle.tsx`
- **Purpose:** Mobile hamburger menu toggle
- **Props:**
  - `isOpen: boolean`
  - `onToggle: () => void`
- **Features:**
  - Hamburger menu icon
  - Animated toggle (hamburger to X)
  - Touch-friendly target size
  - Keyboard accessible
  - Screen reader support

### Contexts Used
- **`NavigationContext`** - For current page state and navigation
- **`ThemeContext`** - For theme state and persistence
- **`TeamManagementContext`** - For active team and team list
- **`UserPreferencesContext`** - For preferred site, sidebar collapsed state, and other user settings

### State Management & Caching
- Theme preference saved to localStorage
- Preferred site setting saved to localStorage
- Sidebar collapsed state saved to localStorage
- Active team ID saved to localStorage
- Team list saved to localStorage
- Team preferences saved to localStorage
- Navigation state managed by routing context
- All settings and team data persist across sessions

### Data Flow:
1. Sidebar renders immediately with current theme and collapsed state
2. Navigation state updates when user navigates
3. Theme changes apply instantly with smooth transitions
4. Sidebar collapse/expand updates with smooth animations
5. Preferred site changes update external link behavior
6. Team list updates when teams are added/removed
7. Active team changes are persisted to localStorage
8. All settings and team data persist to localStorage automatically

### Types & Interfaces
- Define shared types/interfaces for sidebar data
- Example:
  ```ts
  interface SidebarState {
    currentPage: string;
    theme: 'light' | 'dark';
    preferredSite: 'dotabuff' | 'opendota';
    isCollapsed: boolean;
  }

  interface NavigationItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    isActive: boolean;
  }

  interface ExternalResource {
    id: string;
    name: string;
    url: string;
    icon: string;
    description: string;
  }

  interface UserPreferences {
    theme: 'light' | 'dark';
    preferredSite: 'dotabuff' | 'opendota';
    sidebarCollapsed: boolean;
    sidebarWidth: number;
    activeTeamId: string | null;
    teams: Team[];
    teamPreferences: TeamPreferences;
  }
  ```

### File Structure:
```
src/components/sidebar/
├── SidebarNavigation.tsx
├── QuickLinks.tsx
├── ExternalResources.tsx
├── SidebarSettings.tsx
├── SidebarToggle.tsx
├── MobileSidebarToggle.tsx
└── SidebarButton.tsx

src/tests/components/sidebar/
├── SidebarNavigation.test.tsx
├── QuickLinks.test.tsx
├── ExternalResources.test.tsx
├── SidebarSettings.test.tsx
├── SidebarToggle.test.tsx
└── MobileSidebarToggle.test.tsx
```

## Page Components

### Team Management Components

#### Overview
The Team Management page provides comprehensive team management capabilities, including adding teams, viewing team lists, and switching between teams.

#### Components

##### 1. `TeamManagementPage` (Container)
- **Location:** `src/components/team-management/TeamManagementPage.tsx`
- **Purpose:** Main team management page container
- **Props:** None
- **Children:** AddTeamForm, TeamList, ErrorBoundary, Header, Sidebar, LoadingSkeleton
- **Features:**
  - Add team functionality
  - Team list management
  - Team switching capabilities
  - Responsive design for all screen sizes
  - Theme-aware styling (light/dark mode)

##### 2. `AddTeamForm`
- **Location:** `src/components/team-management/AddTeamForm.tsx`
- **Purpose:** Form for adding new teams
- **Props:** None
- **Features:**
  - Team name input
  - Team tag input
  - League selection
  - Region selection
  - Form validation
  - Submit functionality

##### 3. `TeamList`
- **Location:** `src/components/team-management/TeamList.tsx`
- **Purpose:** List of teams with management capabilities
- **Props:** None
- **Features:**
  - Team cards with key information
  - Team switching functionality
  - Team management actions
  - Empty state handling
  - Loading states

##### 4. `TeamCard`
- **Location:** `src/components/team-management/TeamCard.tsx`
- **Purpose:** Individual team display card
- **Props:**
  - `team: Team`
  - `isActive: boolean`
  - `onClick: (teamId: string) => void`
- **Features:**
  - Team logo and branding
  - Key performance metrics
  - Recent match results
  - Team status indicators
  - Quick action buttons

### Contexts Used
- **`TeamManagementContext`** - For team data, active team, and team operations
- **`NavigationContext`** - For page navigation and routing
- **`ThemeContext`** - For theme state and styling
- **`UserPreferencesContext`** - For user settings and preferences

### State Management & Caching
- Team list cached in localStorage
- Active team ID persisted to localStorage
- Team preferences saved to localStorage
- Form state managed locally with validation
- Team data fetched from API and cached
- Team switching state managed by context
- All team data persists across sessions

### Data Flow:
1. Page loads with cached team list from localStorage
2. Active team is set from localStorage or defaults to first team
3. Team switching updates active team in context and localStorage
4. Add team form submits to API and updates local cache
5. Team list refreshes when teams are added/removed
6. Team preferences are saved to localStorage automatically
7. All team data is cached for offline access

### Types & Interfaces
```ts
interface Team {
  id: string;
  name: string;
  tag: string;
  league: string;
  region: string;
  logo?: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface TeamManagementState {
  teams: Team[];
  activeTeamId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AddTeamFormData {
  name: string;
  tag: string;
  league: string;
  region: string;
}

interface TeamCardProps {
  team: Team;
  isActive: boolean;
  onClick: (teamId: string) => void;
}
```

### File Structure:
```
src/components/team-management/
├── TeamManagementPage.tsx
├── AddTeamForm.tsx
├── TeamList.tsx
├── TeamCard.tsx
└── index.ts

src/tests/components/team-management/
├── TeamManagementPage.test.tsx
├── AddTeamForm.test.tsx
├── TeamList.test.tsx
└── TeamCard.test.tsx
```

### Match History Components

#### Overview
The Match History page provides comprehensive match data, statistics, and analysis with filtering and sorting capabilities.

#### Components

##### 1. `MatchHistoryPage` (Container)
- **Location:** `src/components/match-history/match-history-page.tsx`
- **Purpose:** Main match history page container
- **Props:** None
- **Children:** FiltersSection, MatchHistoryContent, EmptyStateContent, ErrorContent
- **Features:**
  - Match filtering and sorting
  - Match timeline and history
  - Detailed match statistics
  - Performance analysis
  - Responsive design for all screen sizes

##### 2. `FiltersSection`
- **Location:** `src/components/match-history/match-history-page.tsx` (internal component)
- **Purpose:** Match filtering and sorting controls
- **Props:**
  - `filters: MatchFilter`
  - `sortBy: 'date' | 'duration' | 'opponent'`
  - `sortDirection: 'asc' | 'desc'`
  - `onFilterChange: (newFilters: Partial<MatchFilter>) => void`
  - `onSortChange: (newSortBy: 'date' | 'duration' | 'opponent') => void`
  - `onSortDirectionChange: () => void`
- **Features:**
  - Date range filtering
  - Result filtering (win/loss)
  - Sort by date, duration, or opponent
  - Sort direction toggle
  - Responsive filter layout

##### 3. `MatchHistoryContent`
- **Location:** `src/components/match-history/match-history-page.tsx` (internal component)
- **Purpose:** Main match history content display
- **Props:**
  - `filters: MatchFilter`
  - `sortBy: 'date' | 'duration' | 'opponent'`
  - `sortDirection: 'asc' | 'desc'`
  - `sortedMatches: Match[]`
  - `onFilterChange: (newFilters: Partial<MatchFilter>) => void`
  - `onSortChange: (newSortBy: 'date' | 'duration' | 'opponent') => void`
  - `onSortDirectionChange: () => void`
- **Features:**
  - Match list display
  - Filter integration
  - Sort functionality
  - Match statistics

##### 4. `MatchRow`
- **Location:** `src/components/match-history/match-history-page.tsx` (internal component)
- **Purpose:** Individual match row display
- **Props:**
  - `match: Match`
- **Features:**
  - Match result and score
  - Team information
  - Match duration and date
  - Key highlights
  - Performance indicators

### Contexts Used
- **`MatchHistoryContext`** - For match data, filters, and sorting state
- **`TeamManagementContext`** - For active team and team data
- **`NavigationContext`** - For page navigation and routing
- **`ThemeContext`** - For theme state and styling

### State Management & Caching
- Match data cached in localStorage with expiration
- Filter preferences saved to localStorage
- Sort preferences saved to localStorage
- Match statistics cached separately
- Match details cached for quick access
- All match data persists across sessions
- Cache invalidation on new match addition

### Data Flow:
1. Page loads with cached match data from localStorage
2. Filters and sorting applied to cached data
3. Match data fetched from API if cache is stale
4. Filter changes update local state and localStorage
5. Sort changes update display order
6. Match details loaded on demand
7. New matches trigger cache invalidation
8. All preferences persist across sessions

### Types & Interfaces
```ts
interface Match {
  id: string;
  date: string;
  duration: number;
  result: 'win' | 'loss';
  opponent: string;
  score: string;
  tournament: string;
  highlights: string[];
}

interface MatchFilter {
  dateRange: {
    start: string;
    end: string;
  };
  result: 'all' | 'win' | 'loss';
  tournament: string;
}

interface MatchHistoryState {
  matches: Match[];
  filters: MatchFilter;
  sortBy: 'date' | 'duration' | 'opponent';
  sortDirection: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}
```

### File Structure:
```
src/components/match-history/
├── match-history-page.tsx
├── MatchFilters.tsx
├── MatchList.tsx
├── MatchCard.tsx
└── index.ts

src/tests/components/match-history/
├── match-history-page.test.tsx
├── MatchFilters.test.tsx
├── MatchList.test.tsx
└── MatchCard.test.tsx
```

### Player Stats Components

#### Overview
The Player Stats page provides comprehensive player statistics, performance metrics, and analysis with filtering and sorting capabilities.

#### Components

##### 1. `PlayerStatsPage` (Container)
- **Location:** `src/components/player-stats/player-stats-page.tsx`
- **Purpose:** Main player statistics page container
- **Props:** None
- **Children:** PlayerStatsHeader, PlayerFilters, PlayerGrid, EmptyStateContent, ErrorContent
- **Features:**
  - Player overview and statistics
  - Performance metrics and trends
  - Hero mastery data
  - Match history for players
  - Comparative analysis

##### 2. `PlayerStatsHeader`
- **Location:** `src/components/player-stats/player-stats-page/PlayerStatsHeader.tsx`
- **Purpose:** Player statistics page header
- **Props:**
  - `activeTeam: Team | null`
  - `activeTeamId: string`
- **Features:**
  - Team information display
  - Page title and description
  - Team switching functionality

##### 3. `PlayerFilters`
- **Location:** `src/components/player-stats/player-stats-page/PlayerFilters.tsx`
- **Purpose:** Player filtering and sorting controls
- **Props:**
  - `viewType: string`
  - `sortBy: string`
  - `sortDirection: 'asc' | 'desc'`
  - `onViewTypeChange: (viewType: string) => void`
  - `onSortChange: (sortBy: string) => void`
  - `onSortDirectionChange: () => void`
- **Features:**
  - View type selection
  - Sort by various metrics
  - Sort direction toggle
  - Filter controls

##### 4. `PlayerGrid`
- **Location:** `src/components/player-stats/player-stats-page/PlayerGrid.tsx`
- **Purpose:** Grid display of player statistics
- **Props:**
  - `players: Player[]`
  - `viewType: string`
- **Features:**
  - Player cards with key stats
  - Different view types
  - Performance indicators
  - Player comparisons

### Contexts Used
- **`PlayerStatsContext`** - For player data, filters, and view state
- **`TeamManagementContext`** - For active team and team data
- **`NavigationContext`** - For page navigation and routing
- **`ThemeContext`** - For theme state and styling

### State Management & Caching
- Player data cached in localStorage with expiration
- Player statistics cached separately
- Filter preferences saved to localStorage
- View preferences saved to localStorage
- Player performance data cached
- Hero mastery data cached
- All player data persists across sessions

### Data Flow:
1. Page loads with cached player data from localStorage
2. Player statistics calculated from cached match data
3. Filters and sorting applied to player data
4. View changes update display format
5. Player details loaded on demand
6. Performance metrics calculated in real-time
7. Hero mastery data cached separately
8. All preferences persist across sessions

### Types & Interfaces
```ts
interface Player {
  id: string;
  name: string;
  role: string;
  totalMatches: number;
  winRate: number;
  averageKDA: string;
  mostPlayedHeroes: HeroStats[];
}

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKDA: string;
  heroMastery: HeroMastery[];
}

interface PlayerStatsState {
  players: Player[];
  filters: PlayerFilter;
  viewType: 'grid' | 'list' | 'detailed';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}
```

### File Structure:
```
src/components/player-stats/
├── player-stats-page.tsx
├── PlayerStatsHeader.tsx
├── PlayerFilters.tsx
├── PlayerGrid.tsx
├── PlayerCard.tsx
└── index.ts

src/tests/components/player-stats/
├── player-stats-page.test.tsx
├── PlayerStatsHeader.test.tsx
├── PlayerFilters.test.tsx
├── PlayerGrid.test.tsx
└── PlayerCard.test.tsx
```

### Draft Suggestions Components

#### Overview
The Draft Suggestions page provides hero counter suggestions, draft strategy recommendations, and meta analysis for competitive Dota 2 play.

#### Components

##### 1. `DraftSuggestionsPage` (Container)
- **Location:** `src/components/draft-suggestions/draft-suggestions-page.tsx`
- **Purpose:** Main draft suggestions page container
- **Props:** None
- **Children:** MetaStatsSection, DraftStateSection, DraftControlsSection, HeroSuggestionsSection
- **Features:**
  - Hero counter suggestions
  - Draft strategy recommendations
  - Meta analysis and trends
  - Team composition advice
  - Interactive draft tools

##### 2. `MetaStatsSection`
- **Location:** `src/components/draft-suggestions/MetaStatsSection.tsx`
- **Purpose:** Meta statistics and analysis
- **Props:** None
- **Features:**
  - Meta statistics display
  - Meta analysis cards
  - Trend indicators
  - Statistical insights

##### 3. `DraftStateSection`
- **Location:** `src/components/draft-suggestions/DraftStateSection.tsx`
- **Purpose:** Current draft state display
- **Props:**
  - `currentDraft: DraftState`
  - `teamSide: 'radiant' | 'dire'`
  - `heroSuggestions: HeroSuggestion[]`
  - `onResetDraft: () => void`
  - `onTeamSideChange: (side: 'radiant' | 'dire') => void`
- **Features:**
  - Draft board display
  - Team side selection
  - Draft reset functionality
  - Hero pick/ban tracking

##### 4. `DraftControlsSection`
- **Location:** `src/components/draft-suggestions/DraftControlsSection.tsx`
- **Purpose:** Draft control and filter options
- **Props:**
  - `activeTeam: Team`
  - `roleFilter: string`
  - `showMetaOnly: boolean`
  - `onRoleFilterChange: (filter: string) => void`
  - `onShowMetaOnlyChange: (show: boolean) => void`
- **Features:**
  - Role filtering
  - Meta-only toggle
  - Draft controls
  - Filter options

##### 5. `HeroSuggestionsSection`
- **Location:** `src/components/draft-suggestions/HeroSuggestionsSection.tsx`
- **Purpose:** Hero suggestion display
- **Props:**
  - `currentDraft: DraftState`
  - `teamSide: 'radiant' | 'dire'`
  - `filteredSuggestions: HeroSuggestion[]`
  - `onHeroAction: (action: string, hero: string) => void`
- **Features:**
  - Hero suggestion cards
  - Pick/ban actions
  - Counter suggestions
  - Synergy recommendations

##### 6. `MetaStatsCard`
- **Location:** `src/components/draft-suggestions/MetaStatsCard.tsx`
- **Purpose:** Individual meta statistics card
- **Props:** None
- **Features:**
  - Meta statistic display
  - Visual indicators
  - Statistical data

##### 7. `HeroSuggestionCard`
- **Location:** `src/components/draft-suggestions/HeroSuggestionCard.tsx`
- **Purpose:** Individual hero suggestion card
- **Props:**
  - `hero: Hero`
  - `suggestion: HeroSuggestion`
  - `onAction: (action: string, hero: string) => void`
- **Features:**
  - Hero information
  - Suggestion reasoning
  - Action buttons
  - Performance data

##### 8. `DraftBoard`
- **Location:** `src/components/draft-suggestions/DraftBoard.tsx`
- **Purpose:** Visual draft board display
- **Props:**
  - `currentDraft: DraftState`
  - `teamSide: 'radiant' | 'dire'`
- **Features:**
  - Visual draft board
  - Pick/ban display
  - Team side indicators
  - Draft progress

### Contexts Used
- **`DraftSuggestionsContext`** - For draft state, hero suggestions, and meta data
- **`TeamManagementContext`** - For active team and team data
- **`NavigationContext`** - For page navigation and routing
- **`ThemeContext`** - For theme state and styling

### State Management & Caching
- Meta data cached in localStorage with expiration
- Draft state managed locally with persistence
- Hero suggestions cached separately
- Draft preferences saved to localStorage
- Meta statistics cached
- Hero counter data cached
- All draft data persists across sessions

### Data Flow:
1. Page loads with cached meta data from localStorage
2. Draft state initialized from localStorage or defaults
3. Hero suggestions calculated based on current draft
4. Meta statistics updated in real-time
5. Draft changes saved to localStorage automatically
6. Hero counter data fetched and cached
7. Draft preferences persist across sessions
8. All suggestions recalculated on draft changes

### Types & Interfaces
```ts
interface DraftState {
  radiantPicks: string[];
  direPicks: string[];
  radiantBans: string[];
  direBans: string[];
  currentPhase: 'pick' | 'ban';
  currentTeam: 'radiant' | 'dire';
}

interface HeroSuggestion {
  hero: string;
  reason: string;
  priority: number;
  counterTo: string[];
  synergyWith: string[];
}

interface DraftSuggestionsState {
  currentDraft: DraftState;
  heroSuggestions: HeroSuggestion[];
  metaStats: MetaStats;
  filters: DraftFilters;
  isLoading: boolean;
  error: string | null;
}
```

### File Structure:
```
src/components/draft-suggestions/
├── draft-suggestions-page.tsx
├── MetaStatsSection.tsx
├── DraftStateSection.tsx
├── DraftControlsSection.tsx
├── HeroSuggestionsSection.tsx
├── MetaStatsCard.tsx
├── HeroSuggestionCard.tsx
├── DraftBoard.tsx
└── index.ts

src/tests/components/draft-suggestions/
├── draft-suggestions-page.test.tsx
├── MetaStatsSection.test.tsx
├── DraftStateSection.test.tsx
├── DraftControlsSection.test.tsx
├── HeroSuggestionsSection.test.tsx
├── MetaStatsCard.test.tsx
├── HeroSuggestionCard.test.tsx
└── DraftBoard.test.tsx
```

### Team Analysis Components

#### Overview
The Team Analysis page provides comprehensive team performance analysis, strategy insights, and comparative analysis for competitive teams.

#### Components

##### 1. `TeamAnalysisPage` (Container)
- **Location:** `src/components/team-analysis/team-analysis-page.tsx`
- **Purpose:** Main team analysis page container
- **Props:** None
- **Children:** ControlsSection, OverallPerformanceSection, StrengthsWeaknessesSection, TimePerformanceSection, HeroPerformanceSection, RecommendationsSection
- **Features:**
  - Team performance analysis
  - Strategy insights
  - Comparative analysis
  - Trend analysis
  - Predictive analytics

##### 2. `ControlsSection`
- **Location:** `src/components/team-analysis/team-analysis/ControlsSection.tsx`
- **Purpose:** Analysis controls and filters
- **Props:**
  - `analysisType: 'overview' | 'detailed' | 'comparison'`
  - `timeRange: number`
  - `activeTeam: Team | null`
  - `activeTeamId: string`
  - `onAnalysisTypeChange: (type: 'overview' | 'detailed' | 'comparison') => void`
  - `onTimeRangeChange: (range: number) => void`
- **Features:**
  - Analysis type selection
  - Time range filtering
  - Team selection
  - Control options

##### 3. `OverallPerformanceSection`
- **Location:** `src/components/team-analysis/team-analysis/OverallPerformanceSection.tsx`
- **Purpose:** Overall team performance metrics
- **Props:**
  - `teamAnalysis: TeamAnalysis`
- **Features:**
  - Performance metrics
  - Win rate analysis
  - Statistical overview
  - Performance trends

##### 4. `StrengthsWeaknessesSection`
- **Location:** `src/components/team-analysis/team-analysis/StrengthsWeaknessesSection.tsx`
- **Purpose:** Team strengths and weaknesses analysis
- **Props:**
  - `teamAnalysis: TeamAnalysis`
- **Features:**
  - Strengths identification
  - Weaknesses analysis
  - Improvement suggestions
  - Comparative analysis

##### 5. `TimePerformanceSection`
- **Location:** `src/components/team-analysis/team-analysis/TimePerformanceSection.tsx`
- **Purpose:** Time-based performance analysis
- **Props:**
  - `teamAnalysis: TeamAnalysis`
- **Features:**
  - Time-based trends
  - Performance over time
  - Seasonal analysis
  - Temporal patterns

##### 6. `HeroPerformanceSection`
- **Location:** `src/components/team-analysis/team-analysis/HeroPerformanceSection.tsx`
- **Purpose:** Hero-specific performance analysis
- **Props:**
  - `teamAnalysis: TeamAnalysis`
- **Features:**
  - Hero performance metrics
  - Hero preferences
  - Hero effectiveness
  - Hero synergy analysis

##### 7. `RecommendationsSection`
- **Location:** `src/components/team-analysis/team-analysis/RecommendationsSection.tsx`
- **Purpose:** Strategic recommendations and insights
- **Props:**
  - `teamAnalysis: TeamAnalysis`
- **Features:**
  - Strategic recommendations
  - Improvement suggestions
  - Meta considerations
  - Actionable insights

### Contexts Used
- **`TeamAnalysisContext`** - For analysis data, filters, and analysis state
- **`TeamManagementContext`** - For active team and team data
- **`NavigationContext`** - For page navigation and routing
- **`ThemeContext`** - For theme state and styling

### State Management & Caching
- Analysis data cached in localStorage with expiration
- Analysis preferences saved to localStorage
- Time range preferences saved to localStorage
- Analysis type preferences saved to localStorage
- Team performance data cached
- Comparative analysis data cached
- All analysis data persists across sessions

### Data Flow:
1. Page loads with cached analysis data from localStorage
2. Analysis type and time range applied to cached data
3. Team performance data calculated from cached match data
4. Analysis filters update local state and localStorage
5. Comparative analysis calculated in real-time
6. Recommendations generated based on current analysis
7. All analysis preferences persist across sessions
8. Cache invalidation on new match addition

### Types & Interfaces
```ts
interface TeamAnalysis {
  overallPerformance: PerformanceMetrics;
  strengths: string[];
  weaknesses: string[];
  timePerformance: TimePerformanceData;
  heroPerformance: HeroPerformanceData;
  recommendations: Recommendation[];
}

interface TeamAnalysisState {
  analysis: TeamAnalysis;
  analysisType: 'overview' | 'detailed' | 'comparison';
  timeRange: number;
  filters: AnalysisFilters;
  isLoading: boolean;
  error: string | null;
}

interface PerformanceMetrics {
  winRate: number;
  averageMatchDuration: number;
  preferredHeroes: string[];
  strengths: string[];
  weaknesses: string[];
}
```

### File Structure:
```
src/components/team-analysis/
├── team-analysis-page.tsx
├── ControlsSection.tsx
├── OverallPerformanceSection.tsx
├── StrengthsWeaknessesSection.tsx
├── TimePerformanceSection.tsx
├── HeroPerformanceSection.tsx
├── RecommendationsSection.tsx
└── index.ts

src/tests/components/team-analysis/
├── team-analysis-page.test.tsx
├── ControlsSection.test.tsx
├── OverallPerformanceSection.test.tsx
├── StrengthsWeaknessesSection.test.tsx
├── TimePerformanceSection.test.tsx
├── HeroPerformanceSection.test.tsx
└── RecommendationsSection.test.tsx
``` 