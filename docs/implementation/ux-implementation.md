# UX Implementation Plan - Component Architecture

## 🖼️ Page Visual Design First

Before implementing detailed components, **each page should be visually designed and iterated on until it matches the intended look and feel**. This means:

- Start by building the full static layout for each page using only stateless components and static content.
- Use the design system for spacing, colors, typography, and icons.
- Ensure the page is visually complete, accessible, and responsive.
- Review and refine the page until it matches the design vision.
- Only after the page looks correct, break it down into reusable components as described in the plan below.

### **Visual Design Process - COMPLETE**

#### **Phase 0: Visual Design & Requirements Gathering**

##### **0.1 Team Management Page Visual Design**
- **Status**: IN PROGRESS
- **Task**: Design and implement the visual layout for Team Management page
- **Next Step**: Gather requirements and begin static layout for Team Management page
- **Requirements**:
  - [ ] Gather requirements on what the page should look like
  - [ ] Implement the visual design with static content
  - [ ] Iterate until the page looks exactly how we want it
  - [ ] Ensure responsive design and accessibility
  - [ ] Use design system colors, typography, and spacing
  - [ ] Add proper icons (no Unicode emojis)
  - [ ] Create comprehensive static data for demonstration

##### **0.2 Match History Page Visual Design**
- **Status**: PENDING
- **Task**: Design and implement the visual layout for Match History page
- **Requirements**:
  - [ ] Gather requirements on what the page should look like
  - [ ] Implement the visual design with static content
  - [ ] Iterate until the page looks exactly how we want it
  - [ ] Ensure responsive design and accessibility
  - [ ] Use design system colors, typography, and spacing
  - [ ] Add proper icons (no Unicode emojis)
  - [ ] Create comprehensive static data for demonstration

##### **0.3 Player Stats Page Visual Design**
- **Status**: PENDING
- **Task**: Design and implement the visual layout for Player Stats page
- **Requirements**:
  - [ ] Gather requirements on what the page should look like
  - [ ] Implement the visual design with static content
  - [ ] Iterate until the page looks exactly how we want it
  - [ ] Ensure responsive design and accessibility
  - [ ] Use design system colors, typography, and spacing
  - [ ] Add proper icons (no Unicode emojis)
  - [ ] Create comprehensive static data for demonstration

##### **0.4 Draft Suggestions Page Visual Design**
- **Status**: PENDING
- **Task**: Design and implement the visual layout for Draft Suggestions page
- **Requirements**:
  - [ ] Gather requirements on what the page should look like
  - [ ] Implement the visual design with static content
  - [ ] Iterate until the page looks exactly how we want it
  - [ ] Ensure responsive design and accessibility
  - [ ] Use design system colors, typography, and spacing
  - [ ] Add proper icons (no Unicode emojis)
  - [ ] Create comprehensive static data for demonstration

##### **0.5 Team Analysis Page Visual Design**
- **Status**: PENDING
- **Task**: Design and implement the visual layout for Team Analysis page
- **Requirements**:
  - [ ] Gather requirements on what the page should look like
  - [ ] Implement the visual design with static content
  - [ ] Iterate until the page looks exactly how we want it
  - [ ] Ensure responsive design and accessibility
  - [ ] Use design system colors, typography, and spacing
  - [ ] Add proper icons (no Unicode emojis)
  - [ ] Create comprehensive static data for demonstration

## 🎯 Component Architecture Overview

### **Two Types of Components**

#### **1. Stateful Components (Use Hooks)**
- **Purpose**: Components that manage state, handle data fetching, user interactions
- **Location**: `src/components/` (main component directories)
- **Examples**: 
  - `TeamManagementPage.tsx` - Uses hooks for team data, navigation state (replaces DashboardPage)
  - `Sidebar.tsx` - Uses hooks for preferences, mobile state
  - `TeamOverview.tsx` - Uses hooks for team switching, data management
- **Requirements**:
  - ✅ Can use hooks, context, state management
  - ✅ Handle data fetching and user interactions
  - ✅ Manage component state and lifecycle
  - ✅ Follow accessibility and design system standards
  - ✅ Implement proper error handling and loading states

#### **2. Stateless Components (Pure UI Components)**
- **Purpose**: Pure UI components that receive props and render content
- **Location**: `src/components/ui/` (foundational UI components)
- **Examples**:
  - `Button.tsx` - Pure button component with variants
  - `Card.tsx` - Pure card component with layouts
  - `Input.tsx` - Pure input component with validation states
  - `Icon.tsx` - Pure icon wrapper components
- **Requirements**:
  - ❌ No hooks, context, or state management
  - ✅ Receive all data via props
  - ✅ Pure functions with predictable output
  - ✅ Follow design system exactly
  - ✅ Comprehensive accessibility features
  - ✅ Proper TypeScript interfaces

## 🎯 Implementation Order & Priorities

### **Phase 1: Sidebar Components (Week 1) - CRITICAL**

#### **1.1 Fix Sidebar Components**
- **Task**: Fix accessibility, styling, and code quality issues in existing sidebar components
- **Files**: `src/components/layout/`
- **Components**: Sidebar, SidebarNavigation, QuickLinks, ExternalResources, SidebarSettings, SidebarToggle, MobileSidebarToggle
- **Requirements**:
  - [ ] Fix all accessibility issues (ARIA labels, keyboard navigation)
  - [ ] Replace Unicode emojis with proper icons (use existing ExternalSiteIcons.tsx)
  - [ ] Fix TypeScript issues and improve interfaces
  - [ ] Follow design system styling
  - [ ] Fix linting and TypeScript errors
  - [ ] Maintain existing hooks and state management
  - [ ] Improve error handling and loading states
  - [ ] Use realistic Dota 2 static data
  - [ ] Implement tests alongside components

#### **1.2 Icon System Integration**
- **Task**: Integrate existing ExternalSiteIcons and implement Lucide icon wrapper
- **Files**: `src/components/icons/`
- **Requirements**:
  - [ ] Use existing ExternalSiteIcons.tsx for external site icons
  - [ ] Implement Lucide icon wrapper for other icons
  - [ ] Add TODO comments for custom Dota 2 icons that need to be created
  - [ ] Add proper TypeScript interfaces
  - [ ] Implement accessibility features
  - [ ] Add theme support (light/dark)
  - [ ] NO hooks or state management

### **Phase 2: Team Management Components (Week 2) - CRITICAL**

#### **2.1 Team Management Page (Replaces Dashboard)**
- **Task**: Implement team management components with realistic Dota 2 data
- **Files**: `src/components/team-management/`
- **Components**: TeamManagementPage, TeamOverview, TeamList, TeamCard, etc.
- **Requirements**:
  - [ ] Use realistic Dota 2 static data (research Dotabuff/OpenDota)
  - [ ] Implement proper TypeScript interfaces
  - [ ] Add comprehensive accessibility features
  - [ ] Use proper icon system (Lucide + existing custom icons)
  - [ ] Implement responsive design patterns
  - [ ] Add proper error handling
  - [ ] Implement tests alongside components
  - [ ] Follow design system exactly

#### **2.2 Team Data Components**
- **Task**: Implement components for team data display
- **Requirements**:
  - [ ] Team performance metrics
  - [ ] Recent match results
  - [ ] Player statistics
  - [ ] Team rankings
  - [ ] League information
  - [ ] Realistic Dota 2 data structure

### **Phase 3: Match History Components (Week 3) - HIGH**

#### **3.1 Match History Page**
- **Task**: Implement match history components with realistic Dota 2 data
- **Files**: `src/components/match-history/`
- **Components**: MatchHistoryPage, MatchList, MatchCard, MatchDetails, etc.
- **Requirements**:
  - [ ] Use realistic Dota 2 match data (research Dotabuff/OpenDota)
  - [ ] Match results and statistics
  - [ ] Hero picks and bans
  - [ ] Player performance data
  - [ ] Match timeline and events
  - [ ] Implement tests alongside components

#### **3.2 Match Data Components**
- **Task**: Implement components for match data display
- **Requirements**:
  - [ ] Match cards with key information
  - [ ] Detailed match statistics
  - [ ] Hero performance data
  - [ ] Player performance metrics
  - [ ] Match filtering and search

### **Phase 4: Player Stats Components (Week 4) - HIGH**

#### **4.1 Player Stats Page**
- **Task**: Implement player statistics components with realistic Dota 2 data
- **Files**: `src/components/player-stats/`
- **Components**: PlayerStatsPage, PlayerCard, PlayerPerformance, HeroStats, etc.
- **Requirements**:
  - [ ] Use realistic Dota 2 player data (research Dotabuff/OpenDota)
  - [ ] Player performance metrics
  - [ ] Hero statistics
  - [ ] Match history for players
  - [ ] Player rankings and comparisons
  - [ ] Implement tests alongside components

#### **4.2 Player Data Components**
- **Task**: Implement components for player data display
- **Requirements**:
  - [ ] Player profile information
  - [ ] Performance charts and graphs
  - [ ] Hero mastery data
  - [ ] Match statistics
  - [ ] Player comparisons

### **Phase 5: Advanced Components (Week 5) - MEDIUM**

#### **5.1 Draft Suggestions Components**
- **Task**: Implement draft suggestions components
- **Files**: `src/components/draft-suggestions/`
- **Requirements**:
  - [ ] Hero counter suggestions
  - [ ] Draft strategy recommendations
  - [ ] Meta analysis
  - [ ] Implement tests alongside components

#### **5.2 Team Analysis Components**
- **Task**: Implement team analysis components
- **Files**: `src/components/team-analysis/`
- **Requirements**:
  - [ ] Team performance analysis
  - [ ] Strategy insights
  - [ ] Comparative analysis
  - [ ] Implement tests alongside components

#### **5.3 Advanced UI Components**
- **Task**: Implement advanced stateless UI components
- **Files**: `src/components/ui/`
- **Components**: DataTable, Chart, Modal, Tooltip, etc.
- **Requirements**:
  - [ ] NO hooks or state management
  - [ ] Comprehensive prop interfaces
  - [ ] Advanced accessibility features
  - [ ] Complex responsive design
  - [ ] Static content for demonstration
  - [ ] Implement tests alongside components

### **Phase 6: Quality Assurance (Week 6) - HIGH**

#### **6.1 Code Quality Fixes**
- **Task**: Fix all linting and TypeScript errors
- **Requirements**:
  - [ ] Fix all ESLint errors and warnings
  - [ ] Fix all TypeScript errors
  - [ ] Reduce function complexity to under 10
  - [ ] Implement proper error handling
  - [ ] Ensure zero warnings tolerance

#### **6.2 Performance Optimization**
- **Task**: Optimize component performance
- **Requirements**:
  - [ ] Implement proper memoization
  - [ ] Optimize rendering performance
  - [ ] Reduce bundle size
  - [ ] Implement proper loading states
  - [ ] Add error boundaries
  - [ ] Optimize for mobile performance

## 📋 Detailed Component Implementation Plan

### **Icon System Integration**

#### **External Site Icons (Already Implemented)**
```tsx
// Use existing ExternalSiteIcons.tsx
import { DotabuffIcon, OpenDotaIcon, StratzIcon, Dota2ProTrackerIcon } from '@/components/icons/ExternalSiteIcons';

// Implementation requirements:
// - Use existing icons for external sites
// - Add proper TypeScript interfaces
// - Implement accessibility features
// - Add theme support (light/dark)
```

#### **Lucide Icon Wrapper**
```tsx
interface LucideIconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  'aria-label'?: string;
}

// Implementation requirements:
// - Import all Lucide icons
// - Add proper TypeScript typing
// - Implement size variants
// - Add accessibility features
// - Support theme colors
```

#### **Custom Dota 2 Icons (TODO)**
```tsx
// TODO: Create custom Dota 2 specific icons
interface CustomIconProps {
  name: 'strength' | 'agility' | 'intelligence' | 'universal' | 'trophy' | 'chart' | 'game';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  'aria-label'?: string;
}

// Implementation requirements:
// - Create custom SVG icons
// - Follow Lucide design patterns
// - Add proper accessibility
// - Support theme colors
// - Implement all Dota 2 specific icons
```

### **Realistic Dota 2 Static Data**

#### **Team Data Structure**
```tsx
interface TeamData {
  id: string;
  name: string;
  tag: string;
  league: string;
  region: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentMatches: Match[];
  players: Player[];
  achievements: Achievement[];
}

// Example static data:
const mockTeamData: TeamData = {
  id: 'team-liquid',
  name: 'Team Liquid',
  tag: 'Liquid',
  league: 'ESL Pro League',
  region: 'Europe',
  totalMatches: 156,
  wins: 98,
  losses: 58,
  winRate: 62.8,
  recentMatches: [
    {
      id: 'match-1',
      opponent: 'OG',
      result: 'win',
      score: '2-1',
      date: '2024-01-15',
      tournament: 'ESL Pro League'
    }
  ],
  players: [
    {
      id: 'player-1',
      name: 'Miracle-',
      role: 'Carry',
      hero: 'Anti-Mage',
      kda: '8.5/2.1/6.2'
    }
  ]
};
```

#### **Match Data Structure**
```tsx
interface MatchData {
  id: string;
  tournament: string;
  date: string;
  duration: number;
  radiantTeam: Team;
  direTeam: Team;
  winner: 'radiant' | 'dire';
  score: string;
  picks: Hero[];
  bans: Hero[];
  players: PlayerPerformance[];
}

// Example static data:
const mockMatchData: MatchData = {
  id: 'match-1',
  tournament: 'The International 2024',
  date: '2024-01-15T14:30:00Z',
  duration: 45 * 60, // 45 minutes
  radiantTeam: { name: 'Team Liquid', tag: 'Liquid' },
  direTeam: { name: 'OG', tag: 'OG' },
  winner: 'radiant',
  score: '2-1',
  picks: [
    { name: 'Anti-Mage', hero: 'antimage', player: 'Miracle-' },
    { name: 'Crystal Maiden', hero: 'crystal_maiden', player: 'KuroKy' }
  ],
  bans: [
    { name: 'Invoker', hero: 'invoker' },
    { name: 'Shadow Fiend', hero: 'nevermore' }
  ]
};
```

#### **Player Data Structure**
```tsx
interface PlayerData {
  id: string;
  name: string;
  team: string;
  role: 'Carry' | 'Mid' | 'Offlane' | 'Support' | 'Hard Support';
  totalMatches: number;
  winRate: number;
  averageKDA: string;
  mostPlayedHeroes: HeroStats[];
  recentPerformance: MatchPerformance[];
}

// Example static data:
const mockPlayerData: PlayerData = {
  id: 'player-miracle',
  name: 'Amer "Miracle-" Al-Barkawi',
  team: 'Team Liquid',
  role: 'Carry',
  totalMatches: 1247,
  winRate: 65.2,
  averageKDA: '8.5/2.1/6.2',
  mostPlayedHeroes: [
    { hero: 'Anti-Mage', matches: 156, winRate: 68.5 },
    { hero: 'Invoker', matches: 142, winRate: 62.1 }
  ]
};
```

## 🎯 Quality Standards

### **Stateless Components Requirements**
- **NO State Management**: No hooks, context, or state
- **Pure Functions**: Predictable output based on props
- **Comprehensive Props**: All data via props
- **Accessibility**: WCAG 2.1 AA compliance
- **Design System**: Follow documentation exactly
- **TypeScript**: Proper interfaces and typing
- **Testing**: Comprehensive test coverage

### **Stateful Components Requirements**
- **Proper State Management**: Appropriate hooks and context usage
- **Data Handling**: Fetching, caching, and state updates
- **User Interactions**: Event handling and user feedback
- **Accessibility**: WCAG 2.1 AA compliance
- **Design System**: Follow documentation exactly
- **Error Handling**: Proper error states and recovery
- **Performance**: Optimized rendering and interactions

### **Common Requirements for All Components**
- **Code Quality**: Zero linting and TypeScript errors
- **Responsive Design**: Mobile-first approach
- **Icon System**: Proper icons (no Unicode emojis)
- **Theme Support**: Light and dark theme compatibility
- **Documentation**: Clear interfaces and usage examples
- **Realistic Data**: Use realistic Dota 2 static data
- **Testing**: Implement tests alongside components

## 🚨 Success Criteria

### **Phase 1 Success Metrics**
- [ ] Sidebar components fixed and enhanced
- [ ] Icon system integrated (ExternalSiteIcons + Lucide)
- [ ] Zero linting and TypeScript errors in sidebar
- [ ] 100% test coverage for sidebar components
- [ ] Design system compliance verified

### **Phase 2 Success Metrics**
- [ ] Team management components implemented
- [ ] Realistic Dota 2 data used
- [ ] Accessibility issues resolved
- [ ] TypeScript issues resolved
- [ ] Design system compliance verified

### **Phase 3 Success Metrics**
- [ ] Match history components implemented
- [ ] Realistic match data used
- [ ] Performance optimized
- [ ] Accessibility compliance achieved
- [ ] Documentation complete

### **Phase 4 Success Metrics**
- [ ] Player stats components implemented
- [ ] Realistic player data used
- [ ] Performance optimized
- [ ] Accessibility compliance achieved
- [ ] Documentation complete

### **Phase 5 Success Metrics**
- [ ] Advanced components implemented
- [ ] Complex interactions working properly
- [ ] Performance optimized
- [ ] Accessibility compliance achieved
- [ ] Documentation complete

### **Phase 6 Success Metrics**
- [ ] Zero quality issues
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Ready for frontend integration

## 📞 Performance Requirements

### **Component Performance Benchmarks**
- **Initial Render**: < 100ms for complex components
- **Re-render**: < 50ms for state updates
- **Bundle Size**: < 500KB for UI components
- **Memory Usage**: < 50MB for component tree
- **Mobile Performance**: 60fps on mid-range devices
- **Accessibility**: < 200ms for keyboard navigation

### **Loading Performance**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### **Testing Performance**
- **Unit Tests**: < 5s for all component tests
- **Integration Tests**: < 30s for component integration tests
- **E2E Tests**: < 2min for full application tests

This comprehensive plan ensures both stateless and stateful components meet the highest quality standards, follow the design system exactly, use realistic Dota 2 data, and are ready for frontend integration. 