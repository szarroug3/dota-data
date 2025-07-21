/**
 * Team context value types
 * 
 * Defines the structure for team-related state and data management
 * in the frontend application.
 */


import type { DotabuffMatchSummary, OpenDotaMatch } from '@/types/external-apis';
import type { Match } from '@/types/contexts/match-context-value';

// ============================================================================
// TEAM DATA STRUCTURES
// ============================================================================

export interface TeamData {
  // Basic team information
  team: {
    id: string;
    name: string;
    isActive: boolean;
    isLoading: boolean;
    error?: string;
  };
  
  // League information
  league: {
    id: string;
    name: string;
  };
  
  // Match participation
  matches: TeamMatchParticipation[];
  
  // Player information
  players: TeamPlayer[];
  
  // Performance statistics
  performance: TeamPerformance;
}

export interface TeamMatchParticipation {
  matchId: string;
  side: 'radiant' | 'dire';
  opponentTeamName: string;
}

export interface TeamPlayer {
  accountId: number;
  playerName: string;
  
  // Team-specific role performance
  roles: PlayerRoleCount[];
  
  // Team-specific performance
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  
  // Team-specific averages
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  averageLastHits: number;
  averageDenies: number;
}

export interface PlayerRoleCount {
  role: PlayerRole;
  count: number;
  winRate: number;
}

export interface TeamPerformance {
  // Overall statistics
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
  
  // Hero usage statistics
  heroUsage: HeroUsageStats;
  
  // Draft statistics
  draftStats: DraftStats;
  
  // Current streak
  currentWinStreak: number;
  currentLoseStreak: number;
  
  // Match statistics
  averageMatchDuration: number;
  averageKills: number;
  averageDeaths: number;
  averageGold: number;
  averageExperience: number;
}

export interface HeroUsageStats {
  picks: HeroStats[];
  bans: HeroStats[];
  picksAgainst: HeroStats[]; // Heroes picked against this team
  bansAgainst: HeroStats[]; // Heroes banned against this team
  picksByPlayer: { [heroId: string]: HeroUsageByPlayer }; // Which player picked which hero how many times
}

export interface HeroStats {
  heroId: string;
  heroName: string;
  count: number;
  wins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
}

export interface DraftStats {
  // Pick order statistics (which team got to pick first hero in the game)
  firstPickCount: number; // Times this team picked the first hero in the game
  secondPickCount: number; // Times this team picked the second hero in the game
  firstPickWinRate: number;
  secondPickWinRate: number;
  
  // Hero pool statistics
  uniqueHeroesPicked: number;
  uniqueHeroesBanned: number;
  mostPickedHero: string;
  mostBannedHero: string;
}

export interface HeroStats {
  heroId: string;
  heroName: string;
  count: number; // Number of times this hero was picked/banned
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
}

export interface HeroUsageByPlayer {
  [accountId: string]: {
    count: number;
    wins: number;
  };
}

export type PlayerRole = 
  | 'carry'
  | 'mid'
  | 'offlane'
  | 'support'
  | 'hard_support'
  | 'jungle'
  | 'roaming'
  | 'unknown';

// ============================================================================
// TEAM CONTEXT STATE
// ============================================================================

export interface TeamMatchFilters {
  // Match filtering
  dateRange: { start: string | null; end: string | null };
  heroes: string[]; // Hero IDs picked by the team
  result: 'all' | 'win' | 'loss';
  side: 'all' | 'radiant' | 'dire';
  pickOrder: 'all' | 'first' | 'second'; // First pick or second pick
}

export interface TeamContextValue {
  // State
  teamDataList: TeamData[];
  activeTeam: { teamId: string; leagueId: string } | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string, leagueId: string) => Promise<void>;
  setActiveTeam: (teamId: string | null, leagueId?: string) => Promise<void>;
  refreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  addMatch: (match: Match, matchSummary: DotabuffMatchSummary, matchData: OpenDotaMatch, teamId: string, leagueId: string) => void;
  
  // Utility functions
  getTeamMatchesForLeague: (teamId: string, leagueId: string) => TeamMatchParticipation[];
  getTeamPlayersForLeague: (teamId: string, leagueId: string) => TeamPlayer[];
  teamExists: (teamId: string, leagueId: string) => boolean;
  clearError: () => void;
  
  // Team-specific functions
  getTeamPerformance: (teamId: string, leagueId: string) => TeamPerformance | undefined;
  getTeamHeroUsage: (teamId: string, leagueId: string) => HeroUsageStats | undefined;
  getTeamDraftStats: (teamId: string, leagueId: string) => DraftStats | undefined;
  getTeamPlayerRoles: (teamId: string, leagueId: string) => TeamPlayer[];
  getTeamRecentMatches: (teamId: string, leagueId: string, count?: number) => TeamMatchParticipation[];
  
  // Match filtering functions (for this team's matches)
  getFilteredMatches: (teamId: string, leagueId: string, filters?: TeamMatchFilters) => TeamMatchParticipation[];
  getMatchesByDateRange: (teamId: string, leagueId: string, startDate: string, endDate: string) => TeamMatchParticipation[];
  getMatchesByResult: (teamId: string, leagueId: string, result: 'win' | 'loss') => TeamMatchParticipation[];
  getMatchesBySide: (teamId: string, leagueId: string, side: 'radiant' | 'dire') => TeamMatchParticipation[];
  getMatchesByPickOrder: (teamId: string, leagueId: string, pickOrder: 'first' | 'second') => TeamMatchParticipation[];
}

export interface TeamContextProviderProps {
  children: React.ReactNode;
}
