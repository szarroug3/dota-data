# Frontend Overview

This document outlines the universal requirements, principles, and standards for all frontend components and pages in the Dota Scout Assistant.

## Table of Contents

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
  - Team data (active team ID, team list, team preferences) are restored from localStorage
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

### localStorage Data Persistence
The application persists critical user data in localStorage to maintain state across browser sessions and page refreshes.

#### User Preferences (UI Settings)
- **Theme Preference**
  - Key: `'theme'`
  - Values: `'light' | 'dark'`
  - Purpose: Light/dark mode persistence
- **Sidebar Collapsed State**
  - Key: `'sidebarCollapsed'`
  - Values: `boolean` (JSON stringified)
  - Purpose: Remember if sidebar is collapsed/expanded
- **Preferred External Site**
  - Key: `'preferredSite'`
  - Values: `'dotabuff' | 'opendota'`
  - Purpose: User's preferred external site for match/player links

#### Team Data Persistence
- **Active Team ID**
  - Key: `'activeTeamId'`
  - Values: `string | null`
  - Purpose: Remember which team is currently selected across sessions
- **Team List**
  - Key: `'teams'`
  - Values: `Team[]` (JSON stringified)
  - Purpose: Remember user's added teams and their metadata
- **Team Preferences**
  - Key: `'teamPreferences'`
  - Values: `TeamPreferences` (JSON stringified)
  - Purpose: Remember user's team-specific settings and preferences

#### Persistence Strategy
- **Load on App Start**: All localStorage data is loaded during application initialization
- **Save on State Changes**: Data is automatically saved when relevant state changes
- **Error Handling**: Graceful fallback if localStorage is unavailable (private browsing, quota exceeded)
- **Data Validation**: Stored data is validated before use to handle corrupted localStorage
- **Migration Support**: Version-aware data migration for localStorage schema changes

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

## Related Documentation

- **[Contexts](./contexts.md)**: Data flow and state management patterns
- **[Pages](./pages.md)**: Page architecture and routing
- **[Components](./components.md)**: Component patterns and organization
- **[UI Standards](./ui-standards.md)**: UI patterns and accessibility
- **[Backend Data Flow](../backend/data-flow.md)**: Backend integration patterns 