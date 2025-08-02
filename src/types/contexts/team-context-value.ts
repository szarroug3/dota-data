/**
 * Team context value types
 * 
 * Defines the structure for team-related state and data management
 * in the frontend application.
 */

import type { Match } from '@/types/contexts/match-context-value';
import type { DotabuffMatchSummary, OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// TEAM DATA STRUCTURES
// ============================================================================

export interface TeamData {
  // Team information
  team: {
    id: number;
    name: string;
  };
  
  // League information
  league: {
    id: number;
    name: string;
  };
  
  // Timestamps
  timeAdded: string;
  
  // Match participation
  matches: Record<number, TeamMatchParticipation>;
  
  // Manual matches (user-added matches with chosen sides)
  manualMatches: Record<number, { side: 'radiant' | 'dire' }>;
  
  // Player information
  players: TeamPlayer[];
  
  // Performance statistics
  performance: TeamPerformance;
  
  // Error handling
  error?: string;
  
  // Loading state
  isLoading?: boolean;
}

export interface TeamMatchParticipation extends DotabuffMatchSummary {
  side: 'radiant' | 'dire' | null;
  pickOrder: 'first' | 'second' | null;
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
  | 'Carry'
  | 'Mid'
  | 'Offlane'
  | 'Support'
  | 'Hard Support'
  | 'Jungle'
  | 'Roaming'

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
  teams: Map<string, TeamData>; // Key: [teamId]-[leagueId]
  selectedTeamId: { teamId: number; leagueId: number } | null;
  setSelectedTeamId: (teamId: number, leagueId: number) => void;
  clearSelectedTeamId: () => void;
  
  // Core operations
  addTeam: (teamId: number, leagueId: number, force?: boolean) => Promise<void>;
  refreshTeam: (teamId: number, leagueId: number) => Promise<void>;
  refreshTeamSummary: (teamId: number, leagueId: number) => Promise<void>;
  refreshAllTeamSummaries: () => Promise<void>;
  removeTeam: (teamId: number, leagueId: number) => void;
  editTeam: (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number) => Promise<void>;
  
  // Team-specific operations
  addMatchToTeam: (matchId: number, teamSide: 'radiant' | 'dire') => Promise<void>;
  addPlayerToTeam: (playerId: number) => Promise<void>;
  removeManualMatch: (matchId: number) => void;
  editManualMatch: (oldMatchId: number, newMatchId: number, teamSide: 'radiant' | 'dire') => Promise<void>;
  
  // Team list management
  setTeams: (teams: Map<string, TeamData>) => void;
  loadTeamsFromConfig: (teams: Map<string, TeamData>) => Promise<void>;
  loadManualMatches: () => Promise<void>;
  
  // Data access
  getTeam: (teamId: number, leagueId: number) => TeamData | undefined;
  getSelectedTeam: () => TeamData | undefined;
  getAllTeams: () => TeamData[];
  
  // High-performing heroes (calculated once, used by multiple components)
  highPerformingHeroes: Set<string>; // Set of hero IDs that are high-performing
}

export interface TeamContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface TeamState {
  teams: Map<string, TeamData>;
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  setTeamsForLoading: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  selectedTeamId: { teamId: number; leagueId: number } | null;
  setSelectedTeamId: (team: { teamId: number; leagueId: number } | null) => void;
}

export interface TeamUpdater {
  (teamKey: string, updater: (team: TeamData) => TeamData): void;
}

export interface UpdateTeamMatches {
  (key: string, matchId: number, teamSide: 'radiant' | 'dire', match: Match | undefined): void;
}

export interface UpdateTeamPlayers {
  (key: string, player: OpenDotaPlayerComprehensive): void;
}

export interface TeamCoreActions {
  setSelectedTeamId: (teamId: number, leagueId: number) => void;
  clearSelectedTeamId: () => void;
  getTeam: (teamId: number, leagueId: number) => TeamData | undefined;
  getSelectedTeam: () => TeamData | undefined;
  getAllTeams: () => TeamData[];
  addMatchToTeam: (matchId: number, teamSide: 'radiant' | 'dire') => Promise<void>;
  addPlayerToTeam: (playerId: number) => Promise<void>;
}

export interface LoadTeamsFromConfig {
  (teams: Map<string, TeamData>): Promise<void>;
}

export interface TeamActions {
  // State
  teams: Map<string, TeamData>;
  selectedTeamId: { teamId: number; leagueId: number } | null;
  
  // Core operations
  addTeam: (teamId: number, leagueId: number, force?: boolean) => Promise<void>;
  refreshTeam: (teamId: number, leagueId: number) => Promise<void>;
  refreshTeamSummary: (teamId: number, leagueId: number) => Promise<void>;
  refreshAllTeamSummaries: () => Promise<void>;
  removeTeam: (teamId: number, leagueId: number) => void;
  editTeam: (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number) => Promise<void>;
  
  // Team-specific operations
  addMatchToTeam: (matchId: number, teamSide: 'radiant' | 'dire') => Promise<void>;
  addPlayerToTeam: (playerId: number) => Promise<void>;
  
  // Team list management
  setTeams: (teams: Map<string, TeamData>) => void;
  loadTeamsFromConfig: (teams: Map<string, TeamData>) => Promise<void>;
  
  // Data access
  setSelectedTeamId: (teamId: number, leagueId: number) => void;
  clearSelectedTeamId: () => void;
  getTeam: (teamId: number, leagueId: number) => TeamData | undefined;
  getSelectedTeam: () => TeamData | undefined;
  getAllTeams: () => TeamData[];
}
