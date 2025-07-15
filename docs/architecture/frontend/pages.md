# Frontend Pages

This document outlines the page architecture, routing patterns, and component organization for the Dota Scout Assistant.

## Table of Contents

- [Next.js App Router Structure](#nextjs-app-router-structure)
- [Team Management Page](#team-management-page)
- [Match History Page](#match-history-page)
- [Player Stats Page](#player-stats-page)
- [Draft Suggestions Page](#draft-suggestions-page)

## Next.js App Router Structure

### Overview
The application uses Next.js 15 with the App Router for optimal performance and modern React features. The routing structure follows a clean, hierarchical organization that supports all major pages and features.

### File Structure
```
src/app/
├── layout.tsx                    # Root layout with providers and sidebar
├── page.tsx                     # Team management page (default route)
├── team-management/
│   └── page.tsx                # Team management page
├── match-history/
│   └── page.tsx                # Match history page
├── player-stats/
│   └── page.tsx                # Player stats page
├── draft-suggestions/
│   └── page.tsx                # Draft suggestions page
└── api/                        # API routes (existing)
    ├── heroes/
    │   └── route.ts
    ├── teams/
    │   └── [id]/
    │       └── route.ts
    ├── players/
    │   └── [id]/
    │       └── route.ts
    ├── matches/
    │   └── [id]/
    │       ├── route.ts
    │       └── parse/
    │           └── route.ts
    ├── leagues/
    │   └── [id]/
    │       └── route.ts
    └── cache/
        └── invalidate/
            └── route.ts
```

### URL Structure
- **Team Management**: `http://localhost:3000/` (default route)
- **Team Management**: `http://localhost:3000/team-management`
- **Match History**: `http://localhost:3000/match-history`
- **Player Stats**: `http://localhost:3000/player-stats`
- **Draft Suggestions**: `http://localhost:3000/draft-suggestions`

### Root Layout (`src/app/layout.tsx`)
- **Purpose**: Root layout that wraps all pages with providers and sidebar
- **Features**:
  - Theme provider (light/dark mode)
  - Context providers (team, match, player, hero contexts)
  - Sidebar navigation (always visible)
  - Error boundary wrapper
  - Global styles and fonts
  - Meta tags and SEO optimization

### Page Components
Each page component follows the same pattern:
- **Location**: `src/app/[page-name]/page.tsx`
- **Purpose**: Server component that renders the corresponding page component
- **Structure**: Minimal wrapper that renders the page component with proper providers
- **Loading**: Uses React Suspense for loading states
- **Error Handling**: Uses error boundaries for graceful error handling

### Implementation Pattern
```tsx
// Example: src/app/team-management/page.tsx
import { TeamManagementPage } from '@/components/team-management/TeamManagementPage'

export default function TeamManagementPageRoute() {
  return <TeamManagementPage />
}
```

### Navigation
- **Client-side navigation** using Next.js Link components
- **Active state management** in sidebar navigation
- **Breadcrumb navigation** for deep pages
- **Back button support** for mobile devices

### Performance Optimizations
- **Static generation** for pages that don't require dynamic data
- **Incremental Static Regeneration** for pages with semi-dynamic content
- **Lazy loading** for heavy components
- **Code splitting** by route for optimal bundle sizes
- **Image optimization** using Next.js Image component

## Team Management Page

### Overview
Team Management provides a centralized interface for managing team data and configurations. The page displays a list of teams with their associated leagues, allows switching between active teams, and provides functionality to add new teams with validation and duplicate checking.

### Components

#### 1. `TeamManagementPage` (Container)
- **Location:** `src/components/team-management/TeamManagementPage.tsx`
- **Purpose:** Main page container, orchestrates layout
- **Props:** None
- **Children:** TeamList, AddTeamForm
- **Loading Strategy:**
  - Static components (page header, add team form) render immediately
  - Teams list is lazy-loaded with React Suspense/lazy; show a skeleton or spinner while loading

#### 2. `TeamList` (List Component)
- **Location:** `src/components/team-management/TeamList.tsx`
- **Purpose:** Displays list of teams with management options
- **Props:**
  - `teams: Team[]`
  - `activeTeamId: string | null`
  - `onTeamSelect: (teamId: string) => void`
  - `onTeamRemove: (teamId: string) => void`
- **Features:**
  - Team cards showing team name, league, match count
  - Active team highlighting
  - Click to set as active team
  - Remove team button with confirmation
  - Empty state when no teams
  - Loading skeleton while fetching teams
  - Responsive grid layout
  - Hover effects and transitions

#### 3. `AddTeamForm` (Form Component)
- **Location:** `src/components/team-management/AddTeamForm.tsx`
- **Purpose:** Form for adding new teams
- **Props:**
  - `onTeamAdd: (teamId: string, leagueId: string) => Promise<void>`
- **Features:**
  - Team ID input field with validation
  - League ID input field with validation
  - Submit button with loading state
  - Error handling and display
  - Success feedback
  - Form validation (required fields, format checking)
  - Duplicate team checking
  - Responsive design
  - Accessibility features

### Contexts Used
- **`TeamManagementContext`** - For team state and actions
- **`TeamDataFetchingContext`** - For API interactions

### State Management & Caching
- All data for the page is loaded in data fetching contexts and managed in data management contexts
- Endpoints support force parameters to ignore cache and refetch as needed
- Team list comes from TeamManagementContext (stored in localStorage)
- Team data comes from `/api/teams/[id]` when teams are added
- Optimistic UI for adding teams (immediate list update, background validation)
- Optimistic UI for removing teams (immediate removal, background cleanup)

### Data Flow:
1. Static components (page header, add team form) render immediately
2. Teams list is shown as soon as TeamManagementContext is loaded
3. Adding a team updates the list optimistically
4. Removing a team updates the list optimistically
5. All API interactions are handled by data fetching contexts only

### Types & Interfaces
- Define shared types/interfaces for team management data
- Example:
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

### File Structure:
```
src/components/team-management/
├── TeamManagementPage.tsx
├── TeamList.tsx
├── TeamCard.tsx
└── AddTeamForm.tsx

src/tests/components/team-management/
├── TeamManagementPage.test.tsx
├── TeamList.test.tsx
├── TeamCard.test.tsx
└── AddTeamForm.test.tsx
```

## Related Documentation

- **[Overview](./overview.md)**: Universal requirements and principles
- **[Contexts](./contexts.md)**: Data flow and state management patterns
- **[Components](./components.md)**: Component patterns and organization
- **[UI Standards](./ui-standards.md)**: UI patterns and accessibility
- **[Backend Data Flow](../backend/data-flow.md)**: Backend integration patterns 