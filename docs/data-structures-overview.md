# Data Structures Overview

This document outlines the new data structures for the Dota 2 data dashboard application, organized by context and their relationships.

## Context Overview

The application uses a context-based architecture with the following main contexts:

1. **Match Context** - Neutral match data from both teams' perspective
2. **Team Context** - Team-specific performance and statistics
3. **Player Context** - Individual player performance and hero usage
4. **Constants Context** - Hero and item metadata (unchanged)
5. **Data Coordinator Context** - Orchestrates data flow between contexts

## 1. Match Context Data Structure

### Core Match Interface
```typescript
interface Match {
  // Basic match information
  id: string;
  date: string;
  duration: number;
  
  // Team information (neutral perspective)
  radiantTeam: { id: string; name: string; };
  direTeam: { id: string; name: string; };
  
  // Draft information
  draft: {
    radiantPicks: HeroPick[];
    direPicks: HeroPick[];
    radiantBans: string[]; // Hero IDs
    direBans: string[]; // Hero IDs
  };
  
  // Player information
  players: {
    radiant: PlayerMatchData[];
    dire: PlayerMatchData[];
  };
  
  // Match statistics
  statistics: {
    radiantKills: number;
    direKills: number;
    radiantGold: number;
    direGold: number;
    radiantExperience: number;
    direExperience: number;
  };
  
  // Match events
  events: MatchEvent[];
  
  // Match result
  result: 'radiant' | 'dire';
}
```

### Key Features:
- **Neutral Perspective**: Match data is not biased toward any team
- **Complete Draft Information**: Full pick/ban order and timing
- **Detailed Player Data**: Individual performance stats for each player
- **Rich Event System**: Comprehensive match events with timestamps
- **Team Statistics**: Aggregated team performance metrics

### Data Sources:
- **Dotabuff Match Summary**: Basic match info, team names, results
- **OpenDota Match Data**: Detailed player stats, items, hero performance
- **Generated Events**: Parsed from match timeline data

## 2. Team Context Data Structure

### Core Team Interface
```typescript
interface TeamData {
  // Basic team information
  team: {
    id: string;
    name: string;
    leagueId: string;
    leagueName: string;
    isActive: boolean;
    isLoading: boolean;
    error?: string;
  };
  
  // League information
  league: { id: string; name: string; };
  
  // Match participation (team perspective)
  matches: TeamMatchParticipation[];
  
  // Player information
  players: TeamPlayer[];
  
  // Performance statistics
  performance: TeamPerformance;
}
```

### Team Performance Interface
```typescript
interface TeamPerformance {
  // Overall statistics
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
  
  // Hero usage statistics
  heroUsage: HeroUsageStats;
  
  // Draft statistics
  draftStats: DraftStats;
  
  // Recent performance
  recentPerformance: {
    last10Matches: number;
    last20Matches: number;
    currentStreak: number;
  };
  
  // Match statistics
  averageMatchDuration: number;
  averageKills: number;
  averageDeaths: number;
  averageGold: number;
  averageExperience: number;
}
```

### Key Features:
- **Team-Centric View**: All data from the team's perspective
- **Hero Usage Analysis**: Picks, bans, and performance against specific heroes
- **Draft Strategy**: Pick/ban patterns and effectiveness
- **Player Role Tracking**: How often each player plays each role
- **Recent Performance**: Short-term and long-term trends
- **Match Filtering**: Filter this team's matches by opponent, hero, date, result, etc.

### Data Sources:
- **Team Match Participation**: Derived from Match context data
- **Hero Usage Stats**: Calculated from match draft data
- **Player Roles**: Extracted from match player data

## 3. Player Context Data Structure

### Core Player Interface
```typescript
interface Player {
  // Basic player information
  id: string;
  name: string;
  rank: PlayerRank;
  accountId: number;
  
  // Hero usage statistics
  topHeroes: TopHero[];
  recentHeroes: RecentHero[];
  
  // Performance statistics
  performance: PlayerPerformance;
  
  // Last updated information
  lastUpdated: string;
}
```

### Player Rank Interface
```typescript
interface PlayerRank {
  tier: RankTier; // 'herald' | 'guardian' | ... | 'immortal'
  division: RankDivision; // 1 | 2 | 3 | 4 | 5
  mmr: number;
  percentile: number; // Percentage of players below this rank
}
```

### Key Features:
- **Rank Information**: Current MMR and rank tier
- **Top 5 Heroes**: All-time most played heroes with stats
- **Recent Hero Usage**: Recent matches with detailed performance
- **Role Performance**: How well they perform in each role
- **Performance Trends**: Recent performance and streaks

### Data Sources:
- **OpenDota Player Data**: Basic player info, rank, account details
- **Match Performance**: Extracted from match player data
- **Hero Usage**: Calculated from match hero selections

## 4. Data Flow Relationships

### Data Flow Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Match         │    │   Team          │
│   APIs          │───▶│   Context       │───▶│   Context       │
│                 │    │                 │    │                 │
│ • Dotabuff      │    │ • Neutral       │    │ • Team-centric  │
│ • OpenDota      │    │ • Complete      │    │ • Performance   │
└─────────────────┘    │ • Detailed      │    │ • Hero usage    │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Player        │    │   Constants     │
                       │   Context       │    │   Context       │
                       │                 │    │                 │
                       │ • Individual    │    │ • Hero metadata │
                       │ • Rank info     │    │ • Item data     │
                       │ • Hero usage    │    │ • Images        │
                       └─────────────────┘    └─────────────────┘
```

### Data Transformation Flow

1. **Raw API Data** → **Match Context**
   - Dotabuff match summaries + OpenDota detailed data
   - Creates neutral, comprehensive match representation

2. **Match Context** → **Team Context**
   - Filters matches by team
   - Calculates team-specific statistics
   - Tracks hero usage and draft patterns

3. **Match Context** → **Player Context**
   - Extracts individual player performance
   - Calculates hero usage and role statistics
   - Tracks rank and recent performance

4. **Constants Context** → **All Contexts**
   - Provides hero and item metadata
   - Enriches display information

## 5. Key Benefits of New Structure

### Neutral Match Data
- **Single Source of Truth**: Match context holds complete, neutral match data
- **No Team Bias**: Data is not filtered through team perspective
- **Complete Information**: All match details in one place

### Team-Centric Analysis
- **Performance Tracking**: Team-specific win rates and statistics
- **Hero Strategy**: Pick/ban patterns and effectiveness
- **Player Roles**: Role distribution and performance by role

### Player-Centric Analysis
- **Individual Performance**: Personal statistics and trends
- **Hero Mastery**: Top heroes and recent performance
- **Rank Tracking**: Current rank and percentile

### Flexible Filtering
- **Multi-dimensional**: Filter by teams, players, heroes, time periods
- **Performance-based**: Filter by win rates, KDA, GPM, etc.
- **Rank-based**: Filter by rank tiers and MMR ranges

## 6. Implementation Notes

### Data Sources
- **Dotabuff API**: Match summaries, team names, basic results
- **OpenDota API**: Detailed match data, player stats, hero performance
- **Player API**: Rank information, account details

### Performance Considerations
- **Lazy Loading**: Detailed data loaded on demand
- **Caching**: API responses cached to reduce requests
- **Incremental Updates**: Only fetch new/changed data

### Error Handling
- **Graceful Degradation**: Continue with partial data if APIs fail
- **Retry Logic**: Automatic retry for failed requests
- **User Feedback**: Clear error messages and loading states 