# Frontend Architecture

This document outlines the complete frontend architecture, including component structure, data flow, and implementation patterns for all pages, focusing on simplicity, clarity, and maintainability. This frontend architecture integrates with the [backend data flow](./backend-data-flow.md) and supports the modern infrastructure with [QStash-based queueing](./queueing-layer.md), [Redis-first caching](./caching-layer.md), and [distributed rate limiting](./rate-limiting-layer.md).

## Table of Contents

### [Universal Requirements](#universal-requirements-all-pages)
- [Loading Strategy](#loading-strategy)
- [Data Management](#data-management)
- [Empty State Handling](#empty-state-handling)
- [Error Management](#error-management)
- [Accessibility](#accessibility)
- [Component Structure & Organization](#component-structure--organization)
- [UI Standards](#ui-standards)
- [Hydration Strategy](#hydration-strategy)
- [Settings & Configuration](#settings--configuration)
- [Sidebar Navigation](#sidebar-navigation)

### [Contexts](#contexts)
- [Data Fetching Contexts](#data-fetching-contexts)
  - [TeamDataFetchingContext](#1-teamdatafetchingcontext)
  - [MatchDataFetchingContext](#2-matchdatafetchingcontext)
  - [PlayerDataFetchingContext](#3-playerdatafetchingcontext)
  - [HeroDataFetchingContext](#4-herodatafetchingcontext)
  - [CacheManagementContext](#5-cachemanagementcontext)
- [Data Management Contexts](#data-management-contexts)
  - [TeamManagementContext](#1-teammanagementcontext)
  - [MatchDataManagementContext](#2-matchdatamanagementcontext)
  - [PlayerDataManagementContext](#3-playerdatamanagementcontext)
  - [HeroDataManagementContext](#4-herodatamanagementcontext)

### [Pages](#pages)
- [Dashboard Page](#dashboard-page)
- [Team Management Page](#team-management-page)
- [Match History Page](#match-history-page)
- [Player Stats Page](#player-stats-page)
- [Draft Suggestions Page](#draft-suggestions-page)
- [Team Analysis Page](#team-analysis-page)

### [Layout Components](#layout-components)
- [Sidebar Component](#sidebar-component)

---

## Universal Requirements (All Pages)

### Loading Strategy
- **Static content** (headers, forms, navigation) should render immediately
- **Data-dependent content** should use lazy loading/Suspense with individualized loading (e.g., each match loads as it appears, not all at once)
- Show appropriate loading states (skeletons, spinners) while data is being fetched

### Data Management
- **No components should handle data directly** - all data operations go through appropriate data fetching and data management contexts
- Components receive data via props from contexts, not direct API calls
- **Contexts handle all hydration, persistence, and API calls** as needed
- All business/data logic is extracted to custom hooks or context providers
- All props and hook returns are fully typed and minimal

### Empty State Handling
- **If no active team is set:** Direct user to Team Management page to add/select a team
- **If active team but no data:** Show appropriate "Add" button (for matches, players, etc.) or "No data available" message
- Provide clear guidance on what action the user should take

### Error Management
- All pages must handle errors gracefully
- Show user-friendly error messages
- Provide recovery options where possible
- Don't crash or show technical error details to users

### Accessibility
- All pages and components must be fully accessible
- Keyboard navigation for all interactive elements
- Proper ARIA labels and roles
- Sufficient color contrast and focus indicators
- Screen reader compatibility

### Component Structure & Organization
- **Large/complex components are split into subcomponents and logic hooks**, following a folder structure:
  - `src/components/[page]/ComponentName/ComponentName.tsx`
  - `src/components/[page]/ComponentName/ComponentNameForm.tsx`
  - `src/components/[page]/ComponentName/useComponentName.ts`
- **All UI components are pure and stateless**, responsible only for rendering and user interaction
- **All business/data logic is extracted to custom hooks or context providers**
- **No UI component directly fetches data or accesses localStorage**; all data/state comes from hooks or context

### UI Standards
- **All UI spacing (margins, paddings, gaps) is standardized** using a shared spacing system:
  - Card padding: `p-4` or `p-6`
  - Section margin: `mb-4` or `mb-6`
  - Grid gap: `gap-4`
  - Form field spacing: `mb-3`
  - Button spacing: `mt-4`
- **All loading, error, and empty states follow a consistent pattern**
- **All props and hook returns are fully typed and minimal**

### Hydration Strategy
- **Initial Page Load:**
  - Teams list is loaded immediately upon application start
  - Active team data begins fetching automatically if a team is selected
  - User preferences (theme, sidebar state, preferred site) are restored from localStorage
  - Navigation state is initialized based on current route

- **Active Team Data Preloading:**
  - **Only active team data is fetched** - Non-active team data is not loaded to avoid unnecessary API calls
  - When a team is set to active, all team-related data begins loading in background
  - Match data, player data, and hero data are fetched proactively for the active team only
  - Data is cached with appropriate TTL for quick access
  - Loading states are managed by contexts, not individual components
  - **Team switching** triggers data loading for the newly active team

- **Navigation Optimization:**
  - When user navigates to a page, data is either already loaded or actively loading
  - No additional API calls needed for basic page navigation
  - Components render immediately with cached data if available
  - Lazy loading only for detailed views (match details, player details, etc.)

- **Data Synchronization:**
  - Contexts handle cache invalidation and data refresh
  - Force parameters available for manual data refresh
  - Background data updates when cache expires
  - Optimistic UI updates for user actions (add team, add match, etc.)

- **Error Recovery:**
  - Failed data loads are retried automatically
  - User can manually refresh data if needed
  - Graceful degradation when data is unavailable
  - Clear error states with recovery options

### Settings & Configuration
- **Contextual Settings Popups** - Settings are page-specific and accessible via a settings icon/button
- **No Dedicated Settings Page** - All configuration happens within the context of each page
- **Settings Persistence** - User preferences are saved to localStorage and restored on page load
- **Common Settings Patterns:**
  - **View Format Selection** - Choose between different display layouts (compact, standard, detailed)
  - **Data Display Options** - Toggle visibility of specific data fields
  - **Filter Presets** - Save and restore common filter combinations
  - **UI Preferences** - Theme, layout density, animation preferences

### Sidebar Navigation
- **Persistent Sidebar** - Always visible navigation component
- **Page Navigation** - Links to all major pages (Dashboard, Team Management, Match History, Player Stats, Team Analysis, Draft Suggestions)
- **Quick Links** - Direct access to Teams and Leagues pages
- **External Resources** - Links to external Dota 2 sites:
  - Dotabuff
  - OpenDota
  - Dota2ProTracker
  - Other relevant resources
- **Theme Toggle** - Light/dark mode switch with persistence
- **Preferred Site Toggle** - Choose default external site (Dotabuff/OpenDota) for match/player links
- **Responsive Design** - Collapsible on both desktop and mobile
- **Active State** - Highlight current page in navigation
- **Accessibility** - Keyboard navigation and screen reader support

---

## Contexts

### Contexts Summary Table

| Context Name                | Main Responsibility                        | Details Section |
|-----------------------------|--------------------------------------------|----------------|
| TeamDataFetchingContext     | Fetches and manages team data              | [Details](#1-teamdatafetchingcontext) |
| MatchDataFetchingContext    | Fetches and manages match data             | [Details](#2-matchdatafetchingcontext) |
| PlayerDataFetchingContext   | Fetches and manages player data            | [Details](#3-playerdatafetchingcontext) |
| HeroDataFetchingContext     | Fetches and manages hero data              | [Details](#4-herodatafetchingcontext) |
| CacheManagementContext      | Handles cache invalidation and refresh     | [Details](#5-cachemanagementcontext) |
| TeamManagementContext       | Manages team state and actions             | [Details](#1-teammanagementcontext) |
| MatchDataManagementContext  | Manages match state and actions            | [Details](#2-matchdatamanagementcontext) |
| PlayerDataManagementContext | Manages player state and actions           | [Details](#3-playerdatamanagementcontext) |
| HeroDataManagementContext   | Manages hero state and actions             | [Details](#4-herodatamanagementcontext) |

---

### Data Fetching Contexts
These contexts handle all direct API interactions and should be the only contexts that make API calls.

#### 1. `TeamDataFetchingContext`
- **Purpose:** Handles all API interactions for team-related data
- **Endpoints Used:**
  - `POST /api/teams/[id]` - Fetch team data with matches and summary
  - `POST /api/leagues/[id]` - Fetch league metadata
- **Provides:**
  - `fetchTeamData: (teamId: string, force?: boolean) => Promise<TeamData>`
  - `fetchLeagueData: (leagueId: string, force?: boolean) => Promise<LeagueData>`
  - Error and loading state management for all operations
- **Used by:** [Team Management Page](./frontend-architecture.md#team-management-page), [Dashboard Page](./frontend-architecture.md#dashboard-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page)

#### 2. `MatchDataFetchingContext`
- **Purpose:** Handles all API interactions for match-related data
- **Endpoints Used:**
  - `POST /api/matches/[id]` - Fetch detailed match data
  - `POST /api/matches/[id]/parse` - Request match parsing
- **Provides:**
  - `fetchMatchData: (matchId: string, force?: boolean) => Promise<MatchData>`
  - `parseMatch: (matchId: string) => Promise<MatchData>`
  - Error and loading state management for all operations
- **Used by:** [Match History Page](./frontend-architecture.md#match-history-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page), [Draft Suggestions Page](./frontend-architecture.md#draft-suggestions-page)

#### 3. `PlayerDataFetchingContext`
- **Purpose:** Handles all API interactions for player-related data
- **Endpoints Used:**
  - `POST /api/players/[id]` - Fetch player data
  - `POST /api/players/[id]/matches` - Fetch player matches
  - `POST /api/players/[id]/heroes` - Fetch player heroes
  - `POST /api/players/[id]/counts` - Fetch player counts
  - `POST /api/players/[id]/totals` - Fetch player totals
  - `POST /api/players/[id]/wl` - Fetch player win/loss
  - `POST /api/players/[id]/recentMatches` - Fetch player recent matches
- **Provides:**
  - `fetchPlayerData: (playerId: string, force?: boolean) => Promise<PlayerData>`
  - `fetchPlayerMatches: (playerId: string, force?: boolean) => Promise<PlayerMatchData[]>`
  - `fetchPlayerHeroes: (playerId: string, force?: boolean) => Promise<PlayerHeroData[]>`
  - `fetchPlayerCounts: (playerId: string, force?: boolean) => Promise<PlayerCountData>`
  - `fetchPlayerTotals: (playerId: string, force?: boolean) => Promise<PlayerTotalData>`
  - `fetchPlayerWL: (playerId: string, force?: boolean) => Promise<PlayerWLData>`
  - `fetchPlayerRecentMatches: (playerId: string, force?: boolean) => Promise<PlayerRecentMatchData[]>`
  - Error and loading state management for all operations
- **Used by:** [Player Stats Page](./frontend-architecture.md#player-stats-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page)

#### 4. `HeroDataFetchingContext`
- **Purpose:** Handles all API interactions for hero-related data
- **Endpoints Used:**
  - `GET /api/heroes` - Fetch all heroes data
- **Provides:**
  - `fetchHeroesData: (force?: boolean) => Promise<HeroData[]>`
  - Error and loading state management for all operations
- **Used by:** [Draft Suggestions Page](./frontend-architecture.md#draft-suggestions-page), [Player Stats Page](./frontend-architecture.md#player-stats-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page)

#### 5. `CacheManagementContext`
- **Purpose:** Handles cache invalidation and management
- **Endpoints Used:**
  - `POST /api/cache/invalidate` - Invalidate cache entries
- **Provides:**
  - `invalidateCache: (cacheKey: string) => Promise<void>`
  - `invalidateAllCache: () => Promise<void>`
  - Error and loading state management for all operations
- **Used by:** All pages for cache management and data refresh

### Data Management Contexts
These contexts manage application state, filtering, and derived data. They use data fetching contexts but never make API calls directly.

#### 1. `TeamManagementContext`
- **Purpose:** Manages team state, active team, and team management actions
- **Uses:** [TeamDataFetchingContext](./frontend-architecture.md#1-teamdatafetchingcontext)
- **Provides:**
  - `teams: Team[]`
  - `activeTeamId: string | null`
  - `setActiveTeam: (teamId: string) => void`
  - `addTeam: (teamId: string, leagueId: string) => Promise<void>`
  - `removeTeam: (teamId: string) => Promise<void>`
  - `refreshTeam: (teamId: string) => Promise<void>`
  - `updateTeam: (teamId: string) => Promise<void>`
- **Used by:** [Team Management Page](./frontend-architecture.md#team-management-page), [Dashboard Page](./frontend-architecture.md#dashboard-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page)

#### 2. `MatchDataManagementContext`
- **Purpose:** Manages match data state, filtering, and derived data
- **Uses:** [MatchDataFetchingContext](./frontend-architecture.md#2-matchdatafetchingcontext)
- **Provides:**
  - `matches: Match[]`
  - `filteredMatches: Match[]`
  - `hiddenMatchIds: string[]`
  - `filters: MatchFilters`
  - `setFilters: (filters: MatchFilters) => void`
  - `selectMatch: (matchId: string) => void`
  - `selectedMatchId: string | null`
  - `heroStatsGrid: HeroStatsGrid`
  - `hideMatch: (matchId: string) => void`
  - `showMatch: (matchId: string) => void`
- **Used by:** [Match History Page](./frontend-architecture.md#match-history-page), [Dashboard Page](./frontend-architecture.md#dashboard-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page)

#### 3. `PlayerDataManagementContext`
- **Purpose:** Manages player data state, filtering, and derived data
- **Uses:** [PlayerDataFetchingContext](./frontend-architecture.md#3-playerdatafetchingcontext)
- **Provides:**
  - `players: Player[]`
  - `filteredPlayers: Player[]`
  - `selectedPlayerId: string | null`
  - `playerStats: PlayerStats`
  - `setSelectedPlayer: (playerId: string) => void`
  - `addPlayer: (playerId: string) => Promise<void>`
  - `removePlayer: (playerId: string) => Promise<void>`
- **Used by:** [Player Stats Page](./frontend-architecture.md#player-stats-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page)

#### 4. `HeroDataManagementContext`
- **Purpose:** Manages hero data state and derived data
- **Uses:** [HeroDataFetchingContext](./frontend-architecture.md#4-herodatafetchingcontext)
- **Provides:**
  - `heroes: Hero[]`
  - `heroStats: HeroStats`
  - `filteredHeroes: Hero[]`
  - `setHeroFilters: (filters: HeroFilters) => void`
- **Used by:** [Draft Suggestions Page](./frontend-architecture.md#draft-suggestions-page), [Player Stats Page](./frontend-architecture.md#player-stats-page), [Team Analysis Page](./frontend-architecture.md#team-analysis-page)

---

## Dashboard Page

### Overview
Dashboard serves as the main landing page and provides a comprehensive overview of the application. When no team is selected, it guides users through the initial setup process. When a team is selected, it displays quick stats, recent activity, and provides easy navigation to all major features.

---

### Components

#### 1. `DashboardPage` (Container)
- **Location:** `src/components/dashboard/DashboardPage.tsx`
- **Purpose:** Main dashboard container with conditional rendering based on team state
- **Props:** None
- **Children:** WelcomeSection (no team) OR DashboardContent (team selected)
- **Loading Strategy:**
  - Static components (header) render immediately
  - Content renders based on team selection state
  - Team-dependent content lazy-loads with Suspense when team is selected

#### 2. `WelcomeSection`
- **Location:** `src/components/dashboard/WelcomeSection.tsx`
- **Purpose:** Initial welcome screen for users with no team selected
- **Props:** None
- **Features:**
  - Welcome message: "Welcome to Dota Data Analysis"
  - Get started card with description
  - Primary CTA: "Add Your First Team" button (links to Team Management)
  - Feature preview cards showing:
    - Match History analysis
    - Player performance tracking
    - Draft suggestions and meta insights
    - Team performance analytics
  - **Empty State:** Always shown when no team is selected

#### 3. `DashboardContent`
- **Location:** `src/components/dashboard/DashboardContent.tsx`
- **Purpose:** Main dashboard content when team is selected
- **Props:** None
- **Children:** TeamOverview, RecentMatches, QuickActions, PerformanceHighlights
- **Features:**
  - Responsive grid layout
  - Conditional rendering based on available data
  - **Empty State:** If team selected but no data, show "Add your first match" message

#### 4. `TeamOverview`
- **Location:** `src/components/dashboard/TeamOverview.tsx`
- **Purpose:** Quick overview of active team and key stats
- **Props:**
  - `teamData: TeamData`
  - `teamStats: TeamStats`
- **Features:**
  - Active team name and league
  - Total matches played
  - Overall win rate
  - Recent performance trend (last 5 matches)
  - Quick team switching dropdown
  - **Empty State:** If no team data, show loading skeleton

#### 5. `RecentMatches`
- **Location:** `src/components/dashboard/RecentMatches.tsx`
- **Purpose:** Shows last 3-5 matches with quick results
- **Props:**
  - `recentMatches: Match[]`
- **Features:**
  - Match cards with opponent, result, date
  - Quick win/loss indicators
  - Click to view match details
  - "View All Matches" link to Match History
  - **Empty State:** If no matches, show "Add your first match" with CTA button

#### 6. `QuickActions`
- **Location:** `src/components/dashboard/QuickActions.tsx`
- **Purpose:** Prominent action buttons for common tasks
- **Props:**
  - `onAddMatch: () => void`
  - `onViewAnalysis: () => void`
  - `onViewDraftSuggestions: () => void`
- **Features:**
  - "Add Match" button (primary action)
  - "View Team Analysis" button
  - "Draft Suggestions" button
  - "Player Stats" button
  - "Match History" button
  - Responsive button layout

#### 7. `PerformanceHighlights`
- **Location:** `src/components/dashboard/PerformanceHighlights.tsx`
- **Purpose:** Key insights and performance highlights
- **Props:**
  - `highlights: PerformanceHighlights`
- **Features:**
  - Best performing hero with win rate
  - Recent performance trend (improving/declining)
  - Most played hero
  - Key statistic (e.g., "Won 3 of last 5 matches")
  - **Empty State:** If no data, show "Add matches to see highlights"

---

### Contexts Used
- **[TeamManagementContext](./frontend-architecture.md#1-teammanagementcontext)** - For active team state and team switching
- **[TeamDataManagementContext](./frontend-architecture.md#2-teamdatamanagementcontext)** - For team data and derived statistics
- **[MatchDataManagementContext](./frontend-architecture.md#2-matchdatamanagementcontext)** - For recent matches and match data
- **[PlayerDataManagementContext](./frontend-architecture.md#3-playerdatamanagementcontext)** - For player statistics and highlights

---

### State Management & Caching
- Dashboard state depends on active team selection
- Team data comes from existing team and match contexts
- Recent matches are derived from match data
- Performance highlights are calculated from team and match data
- All API interactions are handled by data fetching contexts only

---

### Data Flow:
1. Static components (header) render immediately
2. Check if active team is selected
3. If no team: Show WelcomeSection
4. If team selected: Show DashboardContent with lazy-loaded data
5. Team-dependent content loads via Suspense when team is available
6. All API interactions are handled by data fetching contexts only

---

### Types & Interfaces
- Define shared types/interfaces for dashboard data
- Example:
  ```ts
  interface DashboardState {
    hasActiveTeam: boolean;
    teamData?: TeamData;
    recentMatches: Match[];
    performanceHighlights: PerformanceHighlights;
  }

  interface PerformanceHighlights {
    bestHero: HeroPerformance;
    recentTrend: 'improving' | 'declining' | 'stable';
    mostPlayedHero: HeroPerformance;
    keyStatistic: string;
  }

  interface HeroPerformance {
    heroId: string;
    heroName: string;
    gamesPlayed: number;
    winRate: number;
  }
  ```

---

### File Structure:
```
src/components/dashboard/
├── DashboardPage.tsx
├── WelcomeSection.tsx
├── DashboardContent.tsx
├── TeamOverview.tsx
├── RecentMatches.tsx
├── QuickActions.tsx
└── PerformanceHighlights.tsx

src/tests/components/dashboard/
├── DashboardPage.test.tsx
├── WelcomeSection.test.tsx
├── DashboardContent.test.tsx
├── TeamOverview.test.tsx
├── RecentMatches.test.tsx
├── QuickActions.test.tsx
└── PerformanceHighlights.test.tsx
```

---

## Sidebar Component

### Overview
The Sidebar provides persistent navigation, quick access to external resources, and global settings like theme and preferred external sites. It's always visible on desktop and collapsible on mobile, serving as the primary navigation hub for the application.

---

### Components

#### 1. `Sidebar` (Container)
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

#### 2. `SidebarNavigation`
- **Location:** `src/components/layout/SidebarNavigation.tsx`
- **Purpose:** Primary page navigation links
- **Props:**
  - `currentPage: string`
  - `onNavigate: (page: string) => void`
  - `isCollapsed: boolean`
- **Features:**
  - Dashboard link with icon
  - Team Management link with icon
  - Match History link with icon
  - Player Stats link with icon
  - Team Analysis link with icon
  - Draft Suggestions link with icon
  - Active page highlighting
  - Hover effects and transitions
  - Keyboard navigation support
  - **Collapsed Mode:** Shows only icons with hover tooltips
  - **Expanded Mode:** Shows icons with labels
  - Smooth transitions between modes

#### 3. `QuickLinks`
- **Location:** `src/components/layout/QuickLinks.tsx`
- **Purpose:** Quick access to teams and leagues
- **Props:**
  - `teams: Team[]`
  - `onTeamClick: (teamId: string) => void`
  - `isCollapsed: boolean`
- **Features:**
  - "Teams" section with team list
  - "Leagues" section with league list
  - Active team highlighting
  - Click to switch active team
  - Collapsible sections
  - Search/filter functionality
  - **Collapsed Mode:** Shows only section icons with hover tooltips
  - **Expanded Mode:** Shows full team/league lists
  - Smooth transitions between modes

#### 4. `ExternalResources`
- **Location:** `src/components/layout/ExternalResources.tsx`
- **Purpose:** Links to external Dota 2 resources
- **Props:**
  - `preferredSite: 'dotabuff' | 'opendota'`
  - `onSiteChange: (site: string) => void`
  - `isCollapsed: boolean`
- **Features:**
  - Dotabuff link with icon
  - OpenDota link with icon
  - Dota2ProTracker link with icon
  - Other relevant external resources
  - Opens in new tab
  - Hover tooltips with descriptions
  - Preferred site indicator
  - **Collapsed Mode:** Shows only icons with hover tooltips
  - **Expanded Mode:** Shows icons with labels and descriptions
  - Smooth transitions between modes

#### 5. `SidebarSettings`
- **Location:** `src/components/layout/SidebarSettings.tsx`
- **Purpose:** Global settings and preferences
- **Props:**
  - `theme: 'light' | 'dark'`
  - `preferredSite: 'dotabuff' | 'opendota'`
  - `onThemeChange: (theme: string) => void`
  - `onPreferredSiteChange: (site: string) => void`
  - `isCollapsed: boolean`
- **Features:**
  - Theme toggle (light/dark mode)
  - Preferred site selector (Dotabuff/OpenDota)
  - Settings persistence to localStorage
  - Smooth theme transitions
  - Visual indicators for current settings
  - **Collapsed Mode:** Shows only theme toggle icon with hover tooltip
  - **Expanded Mode:** Shows full settings panel with all options
  - Smooth transitions between modes

#### 6. `SidebarToggle` (Desktop)
- **Location:** `src/components/layout/SidebarToggle.tsx`
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

#### 7. `MobileSidebarToggle` (Mobile)
- **Location:** `src/components/layout/MobileSidebarToggle.tsx`
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

---

### Contexts Used
- **`NavigationContext`** - For current page state and navigation
- **`ThemeContext`** - For theme state and persistence
- **`TeamManagementContext`** - For active team and team list
- **`UserPreferencesContext`** - For preferred site, sidebar collapsed state, and other user settings

---

### State Management & Caching
- Theme preference saved to localStorage
- Preferred site setting saved to localStorage
- Sidebar collapsed state saved to localStorage
- Navigation state managed by routing context
- Team list and active team from existing contexts
- All settings persist across sessions

---

### Data Flow:
1. Sidebar renders immediately with current theme and collapsed state
2. Navigation state updates when user navigates
3. Theme changes apply instantly with smooth transitions
4. Sidebar collapse/expand updates with smooth animations
5. Preferred site changes update external link behavior
6. Team list updates when teams are added/removed
7. All settings persist to localStorage automatically

---

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
  }
  ```

---

### File Structure:
```
src/components/layout/
├── Sidebar.tsx
├── SidebarNavigation.tsx
├── QuickLinks.tsx
├── ExternalResources.tsx
├── SidebarSettings.tsx
├── SidebarToggle.tsx
└── MobileSidebarToggle.tsx

src/tests/components/layout/
├── Sidebar.test.tsx
├── SidebarNavigation.test.tsx
├── QuickLinks.test.tsx
├── ExternalResources.test.tsx
├── SidebarSettings.test.tsx
├── SidebarToggle.test.tsx
└── MobileSidebarToggle.test.tsx
```

---

## Team Management Page

### Overview
Team Management provides a centralized interface for managing team data and configurations. The page displays a list of teams with their associated leagues, allows switching between active teams, and provides functionality to add new teams with validation and duplicate checking.

---

### Components

#### 1. `TeamManagementPage` (Container)
- **Location:** `src/components/team/TeamManagementPage.tsx`
- **Purpose:** Main page container, orchestrates layout
- **Props:** None
- **Children:** TeamList, AddTeamForm
- **Loading Strategy:**
  - Static components (page header, add team form) render immediately
  - Teams list is lazy-loaded with React Suspense/lazy; show a skeleton or spinner while loading

#### 2. `TeamList` (List Component)
- **Location:** `src/components/team/TeamList.tsx`
- **Purpose:** Display list of teams with actions
- **Props:** 
  - `teams: Team[]`
  - `activeTeamId: string | null`
  - `onSwitchTeam: (teamId: string) => void`
  - `onRemoveTeam: (teamId: string) => void`
  - `onRefreshTeam: (teamId: string) => void`
  - `onUpdateTeam: (teamId: string) => void`
- **Features:**
  - Team name display
  - League name display
  - Active team indicator
  - Click to switch active team
  - Remove button
  - Refresh button
  - Update button
  - **Optimistic UI:** When a team is added, immediately show a placeholder item with the entered IDs. Update the name/league as data loads. If an error occurs, remove the item or show an error state.
  - **Empty State:** If no teams exist, show message directing user to add teams

#### 3. `TeamCard` (Individual Team Item)
- **Location:** `src/components/team/TeamCard.tsx`
- **Purpose:** Individual team card with actions
- **Props:**
  - `team: Team`
  - `isActive: boolean`
  - `onSwitch: () => void`
  - `onRemove: () => void`
  - `onRefresh: () => void`
  - `onUpdate: () => void`
- **Features:**
  - Team name (highlighted if active)
  - League name
  - Action buttons
  - Clickable card (except when active)
  - **Error State:** If loading fails, show error message or allow removal

#### 4. `AddTeamForm` (Form Component)
- **Location:** `src/components/team/AddTeamForm.tsx`
- **Purpose:** Form to add new teams
- **Props:**
  - `onAddTeam: (teamId: string, leagueId: string) => Promise<void>`
  - `existingTeams: Team[]`
- **Features:**
  - Team ID input field
  - League ID input field
  - Add button (disabled when fields empty)
  - "Team Already Added" message when team exists
  - "Add Team" when team doesn't exist
  - Form validation
  - Loading state during submission

---

### Contexts Used
- **`TeamManagementContext`** - For team state management and actions
- **`TeamDataFetchingContext`** - For API interactions (used by TeamManagementContext)

---

### State Management & Caching
- All endpoints use Redis caching with standardized TTLs
- Endpoints support a `force` parameter to ignore cache and refetch data as needed
- No data deletion - data is managed through cache invalidation and TTL expiration
- The context should handle cache invalidation and refetching after add/remove/update/refresh actions

---

### Data Flow:
1. `TeamManagementPage` renders static components (header, form) immediately
2. Teams list is lazy-loaded with Suspense; shows skeleton/spinner while loading
3. All API interactions are handled by `TeamDataFetchingContext` only
4. When a team is added, an optimistic item is shown in the list; updated as data loads or removed on error
5. Actions (switch, remove, refresh, update) call context methods, which call endpoints via `TeamDataFetchingContext`
6. `AddTeamForm` calls context's `addTeam`, which calls `/api/teams/[id]`

---

### Types & Interfaces
- Define a shared `Team` interface/type for frontend and backend, e.g.:
  ```ts
  interface Team {
    id: string; // unique, e.g. `${teamId}-${leagueId}`
    teamId: string;
    leagueId: string;
    teamName?: string;
    leagueName?: string;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
    // ...other fields as needed
  }
  ```

---

### File Structure:
```
src/components/team/
├── TeamManagementPage.tsx
├── TeamList.tsx
├── TeamCard.tsx
└── AddTeamForm.tsx

src/tests/components/team/
├── TeamManagementPage.test.tsx
├── TeamList.test.tsx
├── TeamCard.test.tsx
└── AddTeamForm.test.tsx
```

### Removed Components:
- `TeamDataDisplay` - Not needed for simple list view
- `TeamOverviewStats` - Not needed for management page
- `AddStandinPlayer` - Not needed for basic team management
- `TeamImportForm` - Replaced by simpler `AddTeamForm`
- Complex sub-components in `TeamList` - Simplified to single `TeamCard`

---

## Match History Page

### Overview
Match History provides a comprehensive view of team match data with multiple display formats and filtering options. The page displays match summaries in various layouts (grid, list, timeline), supports detailed match analysis with player information and parse requests, and includes hero statistics visualization with filtering and sorting capabilities.

---

### Components

#### 1. `MatchHistoryPage` (Container)
- **Location:** `src/components/match/MatchHistoryPage.tsx`
- **Purpose:** Main page container, orchestrates layout
- **Props:** None
- **Children:** MatchHistoryFilters, MatchHistorySummary, MatchList, HeroStatisticsGrid, MatchDetailsPanel, MatchHistorySettings
- **Loading Strategy:**
  - Static components (header, filters, summary, hero stats grid) render immediately
  - Match list is shown as soon as teams/[id] is loaded and match list is available
  - Match details are lazy-loaded with Suspense when a match is selected

#### 2. `MatchHistoryFilters`
- **Location:** `src/components/match/MatchHistoryFilters.tsx`
- **Purpose:** Filter controls for match list
- **Props:**
  - `onChange: (filters: MatchFilters) => void`
  - `filters: MatchFilters`
- **Features:**
  - Filter by hero (played by active team)
  - Filter by win/loss
  - Filter by radiant/dire
  - Filter by first pick/second pick

#### 3. `MatchHistorySummary`
- **Location:** `src/components/match/MatchHistorySummary.tsx`
- **Purpose:** Summary stats for filtered matches (optional, e.g., total matches, win rate)
- **Props:**
  - `summary: MatchSummary`

#### 4. `MatchList`
- **Location:** `src/components/match/MatchList.tsx`
- **Purpose:** List of matches with selectable view formats
- **Props:**
  - `matches: Match[]`
  - `viewFormat: 'card' | 'compact' | ...`
  - `onSelectMatch: (matchId: string) => void`
  - `onHideMatch: (matchId: string) => void`
  - `hiddenMatchIds: string[]`
- **Features:**
  - Display summary data for each match: opponent team name, win/loss, radiant/dire, first/second pick, score, duration, heroes, date/time
  - Button to hide match
  - Clickable to open match details
  - Support for multiple view formats (card, compact, etc.)
  - Optimistic UI for hiding matches
  - **Empty State Handling:**
    - If there is no active team, show a message directing the user to the Team Management page to add or select a team.
    - If there is an active team but no matches, show a message and an "Add Match" button.
    - The "Add Match" button opens a form to manually add a match (see below).
  - **Add Match Form:**
    - Requires a match ID
    - Behaves similarly to the Add Team form (validation, optimistic UI, error handling)

#### 5. `MatchDetailsPanel`
- **Location:** `src/components/match/MatchDetailsPanel.tsx`
- **Purpose:** Shows detailed info for selected match
- **Props:**
  - `matchId: string | null`
  - `onClose: () => void`
  - `viewFormat: 'detailed' | 'compact' | ...`
- **Features:**
  - Multiple view options (detailed, compact, etc.)
  - Active team picks, enemy picks, active team bans, enemy bans
  - Who played what hero with detailed player stats:
    - GPM (Gold Per Minute)
    - XPM (Experience Per Minute)
    - KDA (Kills/Deaths/Assists)
    - Player role (Carry, Mid, Off, Support, Hard Support)
  - Quick player info buttons (summary popup, link to player stats page)
  - Button to request OpenDota parse and refresh data (calls matches/[id]/parse)
  - Lazy loads data if not already loaded (Suspense)
  - UI: Modal, side panel, or slide-out panel (TBD)
  - **Settings:**
    - View format can be changed via a settings popup/modal (TBD)

#### 6. `HeroStatisticsGrid`
- **Location:** `src/components/match/HeroStatisticsGrid.tsx`
- **Purpose:** 2x2 grid of hero stats tables for filtered matches (excluding hidden matches)
- **Props:**
  - `stats: HeroStatsGrid`
- **Features:**
  - Top left: Active team picks
  - Top right: Opponent picks
  - Bottom left: Active team bans
  - Bottom right: Opponent bans
  - Each table: hero, count, win rate (from active team perspective)

#### 7. `MatchHistorySettings`
- **Location:** `src/components/match/MatchHistorySettings.tsx`
- **Purpose:** Settings popup for match history view preferences
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `settings: MatchHistorySettings`
  - `onSettingsChange: (settings: MatchHistorySettings) => void`
- **Features:**
  - Match list view format (card, compact, list, timeline)
  - Match details view format (detailed, compact, summary)
  - Data display options (show/hide specific fields)
  - Filter presets (save/load common filter combinations)
  - UI preferences (density, animations)
  - Settings persistence to localStorage

---

### Contexts Used
- **`MatchDataManagementContext`** - For match state management, filtering, and derived data
- **`MatchDataFetchingContext`** - For API interactions (used by MatchDataManagementContext)
- **`TeamManagementContext`** - For active team information

---

### State Management & Caching
- All data for the page is loaded in data fetching contexts and managed in data management contexts
- Endpoints support force parameters to ignore cache and refetch as needed
- Match list and summary info come from `/api/teams/[id]`
- Match details come from `/api/matches/[id]`
- Parsing requests go through `/api/matches/[id]/parse` and return updated data
- Optimistic UI for hiding matches (client-side only, no server deletion)
- Virtualization (e.g., react-window) is not needed for up to 20 matches; React can handle this number efficiently.

---

### Data Flow:
1. Static components (header, filters, summary, hero stats) render immediately
2. Match list is shown as soon as `/api/teams/[id]` is loaded
3. Clicking a match loads details via `/api/matches/[id]` (Suspense/lazy loading if not already loaded)
4. Hiding a match updates UI optimistically (client-side only, no server deletion)
5. Hero statistics grid updates based on filtered, non-hidden matches
6. All API interactions are handled by data fetching contexts only

---

### Types & Interfaces
- Define shared types/interfaces for Match, MatchSummary, MatchFilters, HeroStatsGrid, etc.
- Example:
  ```ts
  interface Match {
    id: string;
    opponentTeamName: string;
    win: boolean;
    radiant: boolean;
    firstPick: boolean;
    score: string;
    duration: number;
    heroes: string[];
    date: string;
    // ...other fields
  }
  ```

---

### File Structure:
```
src/components/match/
├── MatchHistoryPage.tsx
├── MatchHistoryFilters.tsx
├── MatchHistorySummary.tsx
├── MatchList.tsx
├── MatchDetailsPanel.tsx
├── HeroStatisticsGrid.tsx
└── MatchHistorySettings.tsx

src/tests/components/match/
├── MatchHistoryPage.test.tsx
├── MatchList.test.tsx
├── MatchDetailsPanel.test.tsx
├── MatchHistoryFilters.test.tsx
├── HeroStatisticsGrid.test.tsx
└── MatchHistorySettings.test.tsx
```

---

## Player Stats Page

### Overview
Player Stats provides a dashboard-style interface for viewing and managing individual player performance data. The page displays player cards in a responsive grid layout with performance metrics, supports multiple view formats (compact, standard, detailed), and includes detailed player analysis panels with hero statistics and performance trends.

---

### Components

#### 1. `PlayerStatsPage` (Container)
- **Location:** `src/components/player/PlayerStatsPage.tsx`
- **Purpose:** Main page container with dashboard layout
- **Props:** None
- **Children:** PlayerDashboard, PlayerDetailsPanel
- **Loading Strategy:**
  - Static components (header) render immediately
  - Player cards are shown as soon as team data is loaded
  - Player details are lazy-loaded with Suspense when a player is selected

#### 2. `PlayerDashboard`
- **Location:** `src/components/player/PlayerDashboard.tsx`
- **Purpose:** Dashboard grid of player cards with add player functionality
- **Props:**
  - `players: Player[]`
  - `viewFormat: 'compact' | 'standard' | 'detailed'`
  - `onSelectPlayer: (playerId: string) => void`
  - `onAddPlayer: (playerId: string) => Promise<void>`
- **Features:**
  - Responsive grid layout (2-3 columns on desktop, 1 on mobile)
  - Player cards sorted by most games played, then by rank
  - Add player button/card
  - View format switching (compact/standard/detailed)
  - **Empty State:** If no active team, direct to Team Management; if no players, show add player message

#### 3. `PlayerCard`
- **Location:** `src/components/player/PlayerCard.tsx`
- **Purpose:** Individual player card with performance data
- **Props:**
  - `player: Player`
  - `viewFormat: 'compact' | 'standard' | 'detailed'`
  - `isSelected: boolean`
  - `onSelect: () => void`
- **Features:**
  - Player name and rank
  - Top 5 most played heroes with win rates
  - Overall win rate and performance stats
  - League match hero data
  - Clickable to show details
  - Different layouts for each view format

#### 4. `PlayerDetailsPanel`
- **Location:** `src/components/player/PlayerDetailsPanel.tsx`
- **Purpose:** Detailed view for selected player
- **Props:**
  - `playerId: string | null`
  - `onClose: () => void`
  - `viewFormat: 'compact' | 'standard' | 'detailed'`
- **Features:**
  - Complete player profile
  - Hero performance charts/graphs
  - Match history integration
  - Performance trends over time
  - League match breakdown
  - Lazy loads data if not already loaded (Suspense)
  - UI: Side panel, modal, or slide-out panel (TBD)

#### 5. `AddPlayerForm`
- **Location:** `src/components/player/AddPlayerForm.tsx`
- **Purpose:** Form to add a stand-in player
- **Props:**
  - `onAddPlayer: (playerId: string) => Promise<void>`
  - `existingPlayers: Player[]`
- **Features:**
  - Player ID input field
  - Validation and error handling
  - Optimistic UI updates
  - Loading state during submission
  - "Player Already Added" message when player exists

#### 6. `PlayerStatsSettings`
- **Location:** `src/components/player/PlayerStatsSettings.tsx`
- **Purpose:** Settings popup for player stats view preferences
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `settings: PlayerStatsSettings`
  - `onSettingsChange: (settings: PlayerStatsSettings) => void`
- **Features:**
  - Player dashboard view format (compact, standard, detailed)
  - Player details view format (detailed, compact, summary)
  - Data display options (show/hide specific stats)
  - Sort preferences (by games played, rank, win rate)
  - UI preferences (grid columns, card density)
  - Settings persistence to localStorage

---

### Contexts Used
- **`PlayerDataManagementContext`** - For player state management, filtering, and derived data
- **`PlayerDataFetchingContext`** - For API interactions (used by PlayerDataManagementContext)
- **`TeamManagementContext`** - For active team information
- **`HeroDataManagementContext`** - For hero data and statistics

---

### State Management & Caching
- All data for the page is loaded in data fetching contexts and managed in data management contexts
- Endpoints support force parameters to ignore cache and refetch as needed
- Player data comes from `/api/players/[id]` and related endpoints
- Hero data comes from `/api/heroes`
- Optimistic UI for adding players
- Players sorted by most games played with team, then by rank

---

### Data Flow:
1. Static components (header) render immediately
2. Player dashboard is shown as soon as team data is loaded
3. Clicking a player loads details via player endpoints (Suspense/lazy loading if not already loaded)
4. Adding a player updates UI optimistically
5. All API interactions are handled by data fetching contexts only

---

### Types & Interfaces
- Define shared types/interfaces for Player, PlayerStats, etc.
- Example:
  ```ts
  interface Player {
    id: string;
    name: string;
    rank: string;
    overallWinRate: number;
    gamesPlayed: number;
    topHeroes: PlayerHero[];
    leagueHeroes: PlayerHero[];
    // ...other fields
  }

  interface PlayerHero {
    heroId: string;
    heroName: string;
    gamesPlayed: number;
    winRate: number;
    // ...other fields
  }
  ```

---

### File Structure:
```
src/components/player/
├── PlayerStatsPage.tsx
├── PlayerDashboard.tsx
├── PlayerCard.tsx
├── PlayerDetailsPanel.tsx
├── AddPlayerForm.tsx
└── PlayerStatsSettings.tsx

src/tests/components/player/
├── PlayerStatsPage.test.tsx
├── PlayerDashboard.test.tsx
├── PlayerCard.test.tsx
├── PlayerDetailsPanel.test.tsx
├── AddPlayerForm.test.tsx
└── PlayerStatsSettings.test.tsx
```

---

## Draft Suggestions Page

### Overview
Draft Suggestions provides comprehensive draft analysis combining external meta data from Dota2ProTracker with team-specific insights. The page displays current meta trends, team hero preferences, counter-pick strategies, and specific draft recommendations to help optimize team drafting strategy.

---

### Components

#### 1. `DraftSuggestionsPage` (Container)
- **Location:** `src/components/draft-suggestions/DraftSuggestionsPage.tsx`
- **Purpose:** Main page container with draft analysis dashboard layout
- **Props:** None
- **Children:** MetaOverview, TeamDraftAnalysis, CounterPickAnalysis, DraftRecommendations
- **Loading Strategy:**
  - Static components (header) render immediately
  - Meta overview shows as soon as external data is loaded
  - Team analysis and recommendations lazy-load with Suspense

#### 2. `MetaOverview`
- **Location:** `src/components/draft-suggestions/MetaOverview.tsx`
- **Purpose:** Current meta trends from Dota2ProTracker
- **Props:**
  - `metaData: MetaData`
- **Features:**
  - Overall meta snapshot (last 7 days)
  - Top 5 most picked heroes across all roles
  - Meta win rate trends
  - Role distribution in current meta
  - **Empty State:** If no external data available, show "Meta data unavailable"

#### 3. `TeamDraftAnalysis`
- **Location:** `src/components/draft-suggestions/TeamDraftAnalysis.tsx`
- **Purpose:** Analysis of team's hero preferences and performance
- **Props:**
  - `teamData: TeamDraftData`
  - `metaData: MetaData`
- **Features:**
  - Team's most picked heroes by role
  - Team's win rates with different heroes
  - Meta alignment analysis (team picks vs meta popularity)
  - Strategic positioning insights
  - Performance comparison (team win rate vs meta win rate)

#### 4. `CounterPickAnalysis`
- **Location:** `src/components/draft-suggestions/CounterPickAnalysis.tsx`
- **Purpose:** Shows counter-pick strategies against team's most picked heroes
- **Props:**
  - `teamHeroes: TeamHeroData`
  - `counterPickData: CounterPickData`
- **Features:**
  - Team's most picked heroes (from team data)
  - Top counter-picks against each team hero
  - Counter-pick win rates
  - Meta positioning analysis
  - Strategic recommendations
  - **Empty State:** If no team data, show "Select a team to see counter-picks"

#### 5. `DraftRecommendations`
- **Location:** `src/components/draft-suggestions/DraftRecommendations.tsx`
- **Purpose:** Specific draft suggestions based on meta and team data
- **Props:**
  - `recommendations: DraftRecommendationData`
  - `metaData: MetaData`
  - `teamData: TeamDraftData`
- **Features:**
  - Priority picks for next draft
  - Recommended bans against opponents
  - Meta-defying vs meta-aligned strategies
  - Role-specific recommendations
  - Draft phase suggestions
  - Success probability indicators

#### 6. `RoleBasedMeta`
- **Location:** `src/components/draft-suggestions/RoleBasedMeta.tsx`
- **Purpose:** Detailed meta analysis by role (Carry, Mid, Off, Support, Hard Support)
- **Props:**
  - `roleMetaData: RoleMetaData`
  - `selectedRole: 'Carry' | 'Mid' | 'Off' | 'Support' | 'Hard Support'`
- **Features:**
  - Top 10 most picked heroes per role
  - Win rates for each hero in role
  - Pick rate percentages
  - Role-specific meta trends
  - Role selector tabs
  - Hero performance charts per role

---

### Contexts Used
- **`MetaDataFetchingContext`** - For external meta data from Dota2ProTracker and other sources
- **`MetaDataManagementContext`** - For meta data state management and derived insights
- **`TeamDataManagementContext`** - For team hero preferences and performance data
- **`HeroDataManagementContext`** - For hero data and statistics

---

### State Management & Caching
- External meta data is fetched from Dota2ProTracker API endpoints
- Meta data is cached with appropriate TTL (time-to-live) for freshness
- Team data comes from existing team and match contexts
- Counter-pick analysis combines team data with external meta data
- Draft recommendations are calculated from meta + team data
- All API interactions are handled by data fetching contexts only

---

### Data Flow:
1. Static components (header) render immediately
2. Meta overview shows as soon as external data is loaded
3. Team analysis and counter-pick data lazy-load with Suspense
4. Draft recommendations update when team data changes
5. External meta data is refreshed based on cache TTL

---

### Types & Interfaces
- Define shared types/interfaces for draft suggestions data
- Example:
  ```ts
  interface MetaData {
    overallMeta: OverallMeta;
    roleMeta: RoleMetaData;
    trends: MetaTrendsData;
    lastUpdated: string;
  }

  interface RoleMetaData {
    Carry: HeroMetaStats[];
    Mid: HeroMetaStats[];
    Off: HeroMetaStats[];
    Support: HeroMetaStats[];
    HardSupport: HeroMetaStats[];
  }

  interface HeroMetaStats {
    heroId: string;
    heroName: string;
    pickRate: number;
    winRate: number;
    role: string;
    gamesPlayed: number;
  }

  interface TeamDraftData {
    teamHeroes: TeamHeroData[];
    metaAlignment: MetaAlignment;
    strategicPositioning: StrategicPositioning;
  }

  interface CounterPickData {
    teamHero: HeroMetaStats;
    counterPicks: CounterPick[];
  }

  interface CounterPick {
    heroId: string;
    heroName: string;
    winRate: number;
    gamesPlayed: number;
    effectiveness: number;
  }

  interface DraftRecommendationData {
    priorityPicks: PriorityPick[];
    recommendedBans: RecommendedBan[];
    strategies: DraftStrategy[];
  }

  interface PriorityPick {
    heroId: string;
    heroName: string;
    role: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    successProbability: number;
  }
  ```

---

### File Structure:
```
src/components/draft-suggestions/
├── DraftSuggestionsPage.tsx
├── MetaOverview.tsx
├── TeamDraftAnalysis.tsx
├── CounterPickAnalysis.tsx
├── DraftRecommendations.tsx
└── RoleBasedMeta.tsx

src/tests/components/draft-suggestions/
├── DraftSuggestionsPage.test.tsx
├── MetaOverview.test.tsx
├── TeamDraftAnalysis.test.tsx
├── CounterPickAnalysis.test.tsx
├── DraftRecommendations.test.tsx
└── RoleBasedMeta.test.tsx
```

---

## Team Analysis Page

### Overview
Team Analysis provides a comprehensive view of team performance with key metrics, trends, and insights. The page displays team statistics, hero preferences, draft patterns, and performance trends over time.

### Components

#### 1. `TeamAnalysisPage` (Container)
- **Location:** `src/components/team-analysis/TeamAnalysisPage.tsx`
- **Purpose:** Main page container with performance dashboard layout
- **Props:** None
- **Children:** TeamPerformanceSummary, TeamTrendsOverview, TeamHeroAnalysis, TeamDraftAnalysis
- **Loading Strategy:**
  - Static components (header) render immediately
  - Performance summary shows as soon as team data is loaded
  - Trend charts and detailed analysis lazy-load with Suspense

#### 2. `TeamPerformanceSummary`
- **Location:** `src/components/team-analysis/TeamPerformanceSummary.tsx`
- **Purpose:** Quick overview of key team performance metrics
- **Props:**
  - `teamStats: TeamPerformanceStats`
- **Features:**
  - Overall win rate with trend indicator
  - Total matches played
  - Average match duration
  - First pick/second pick distribution
  - Radiant/Dire side distribution
  - Recent performance (last 10 matches)
  - **Empty State:** If no active team, direct to Team Management; if no matches, show "No match data available"

#### 3. `TeamTrendsOverview`
- **Location:** `src/components/team-analysis/TeamTrendsOverview.tsx`
- **Purpose:** Visual representation of performance trends over time
- **Props:**
  - `trendsData: TeamTrendsData`
  - `timeRange: 'last10' | 'last30' | 'last90' | 'all'`
- **Features:**
  - Win rate trend chart (line chart)
  - Match duration trend chart
  - Performance by month/period
  - Trend indicators (increasing/decreasing/stable)
  - Time range selector
  - Responsive chart layouts

#### 4. `TeamHeroAnalysis`
- **Location:** `src/components/team-analysis/TeamHeroAnalysis.tsx`
- **Purpose:** Detailed hero pick/ban analysis
- **Props:**
  - `heroStats: TeamHeroStats`
- **Features:**
  - Most picked heroes with win rates
  - Most banned heroes
  - Hero pick/ban trends
  - Hero performance by role
  - Pick/ban priority analysis
  - Hero synergy insights

#### 5. `TeamDraftAnalysis`
- **Location:** `src/components/team-analysis/TeamDraftAnalysis.tsx`
- **Purpose:** Draft pattern and side selection analysis
- **Props:**
  - `draftStats: TeamDraftStats`
- **Features:**
  - First pick vs second pick performance
  - Radiant vs Dire side performance
  - Draft phase preferences
  - Side selection patterns
  - Draft timing analysis
  - Counter-pick effectiveness

#### 6. `TeamMatchInsights`
- **Location:** `src/components/team-analysis/TeamMatchInsights.tsx`
- **Purpose:** Additional match-related insights and patterns
- **Props:**
  - `matchInsights: TeamMatchInsights`
- **Features:**
  - Average match duration trends
  - Comeback vs stomp analysis
  - Performance by map side
  - Match length distribution
  - Game flow patterns
  - Key performance indicators

---

### Contexts Used
- **`TeamDataManagementContext`** - For team state management and derived statistics
- **`TeamDataFetchingContext`** - For API interactions (used by TeamDataManagementContext)
- **`MatchDataManagementContext`** - For match data and statistics
- **`HeroDataManagementContext`** - For hero data and statistics

---

### State Management & Caching
- All data for the page is loaded in data fetching contexts and managed in data management contexts
- Endpoints support force parameters to ignore cache and refetch as needed
- Team data comes from `/api/teams/[id]` and related endpoints
- Match data comes from `/api/matches/[id]` and related endpoints
- Hero data comes from `/api/heroes`
- Performance calculations are derived from match data
- Trend analysis uses time-series data from matches

---

### Data Flow:
1. Static components (header) render immediately
2. Performance summary shows as soon as team data is loaded
3. Trend charts and detailed analysis lazy-load with Suspense when scrolled into view
4. All API interactions are handled by data fetching contexts only
5. Derived statistics are calculated in data management contexts

---

### Types & Interfaces
- Define shared types/interfaces for team analysis data
- Example:
  ```ts
  interface TeamPerformanceStats {
    totalMatches: number;
    winRate: number;
    averageMatchDuration: number;
    firstPickPercentage: number;
    secondPickPercentage: number;
    radiantSidePercentage: number;
    direSidePercentage: number;
    recentWinRate: number;
  }

  interface TeamTrendsData {
    winRateTrend: TrendPoint[];
    matchDurationTrend: TrendPoint[];
    performanceByPeriod: PeriodPerformance[];
  }

  interface TeamHeroStats {
    mostPicked: HeroPickStats[];
    mostBanned: HeroBanStats[];
    heroPerformance: HeroPerformance[];
  }

  interface TeamDraftStats {
    firstPickWinRate: number;
    secondPickWinRate: number;
    radiantWinRate: number;
    direWinRate: number;
    draftPatterns: DraftPattern[];
  }

  interface TeamMatchInsights {
    averageMatchDuration: number;
    comebackPercentage: number;
    stompPercentage: number;
    sidePerformance: SidePerformance;
  }
  ```

---

### File Structure:
```
src/components/team-analysis/
├── TeamAnalysisPage.tsx
├── TeamPerformanceSummary.tsx
├── TeamTrendsOverview.tsx
├── TeamHeroAnalysis.tsx
├── TeamDraftAnalysis.tsx
└── TeamMatchInsights.tsx

src/tests/components/team-analysis/
├── TeamAnalysisPage.test.tsx
├── TeamPerformanceSummary.test.tsx
├── TeamTrendsOverview.test.tsx
├── TeamHeroAnalysis.test.tsx
├── TeamDraftAnalysis.test.tsx
└── TeamMatchInsights.test.tsx
```

---

## Related Documentation

- **[Backend Data Flow](./backend-data-flow.md):** Complete backend data flow including API integration
- **[Project Structure](./project-structure.md):** Recommended folder structure for frontend organization
- **[Type Organization](./type-organization.md):** TypeScript type organization and usage patterns
- **[Caching Layer](./caching-layer.md):** Cache integration for data fetching and state management
- **[Rate Limiting Layer](./rate-limiting-layer.md):** Rate limiting for API calls and data fetching
- **[Queueing Layer](./queueing-layer.md):** Background job processing for data fetching
- **[Endpoint Summary](./endpoint-summary.md):** Comprehensive overview of all API endpoints 

---



---

## External Service Icons and Links

### Custom Icons
The application includes custom SVG icons for external services:
- **OpenDota**: Green circle with "O" design
- **Dotabuff**: Red square with "D" design  
- **Stratz**: Blue gradient castle design
- **Dota2ProTracker**: Blue shield with "2T" design

### Usage Guidelines
- **Always use custom icons** when linking to external services
- **Respect user preferences** for external site links (OpenDota vs Dotabuff)
- **Consistent styling** across all external links
- **Accessible design** with proper alt text and keyboard navigation

### User Preferences
- **Match links**: Use user's preferred site (OpenDota/Dotabuff) with appropriate icon
- **Player links**: Use user's preferred site with appropriate icon
- **Team links**: Use Dotabuff (primary source) with Dotabuff icon
- **Hero links**: Use OpenDota (primary source) with OpenDota icon

### Implementation
```tsx
// Example usage in components
import { OpenDotaIcon, DotabuffIcon, Dota2ProTrackerIcon } from '@/components/icons/ExternalSiteIcons';

// For match links
<Link href={userPrefersOpenDota ? openDotaUrl : dotabuffUrl}>
  {userPrefersOpenDota ? <OpenDotaIcon /> : <DotabuffIcon />}
  View Match Details
</Link>
```

**Note:** The custom icons are located in `src/components/icons/ExternalSiteIcons.tsx` and should be used consistently throughout the application for all external service links.

---

## Centralized Logging

### Frontend Logging
- **Location**: `src/lib/utils/frontend-logger.ts` (to be implemented)
- **Usage**: Console logging for development and debugging
- **Configuration**: Controlled by `DEBUG_LOGGING` environment variable
- **Features**: 
  - Data fetching logs
  - State change logs
  - Error logging with stack traces
  - Performance monitoring

### Backend Logging
- **Location**: `src/lib/utils/backend-logger.ts`
- **Usage**: File logging to `logs/server.log`
- **Configuration**: Controlled by `DEBUG_LOGGING` and `LOG_LEVEL` environment variables
- **Features**:
  - API call logging
  - Rate limiting logs
  - Cache hit/miss logs
  - Error logging with context

### Usage Examples
```ts
// Frontend logging (to be implemented)
import { log } from '@/lib/utils/frontend-logger';

log.debug('Fetching team data', { teamId: 123 });
log.error('Failed to fetch data', error);

// Backend logging
import { log } from '@/lib/utils/backend-logger';

log.info('API request received', { endpoint: '/api/teams/123' });
log.warn('Rate limit approaching', { service: 'opendota', remaining: 5 });
```

**Note:** Logging is automatically disabled in production unless `DEBUG_LOGGING=true` is explicitly set. See [Environment Variables](../development/environment-variables.md#logging-configuration) for configuration options. 