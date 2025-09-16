/**
 * League Context Types
 *
 * Type definitions for the league context and related data structures.
 */

import type { ReactNode } from 'react';

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export interface League {
  id: string;
  name: string;
  isActive: boolean;
  isLoading: boolean;
  error?: string;
}

export interface Team {
  id: string;
  name: string;
  matches: Match[];
}

export interface Player {
  accountId: number;
  name: string;
  matches: Match[];
  heroes: number[]; // Hero IDs
}

export interface Match {
  id: string;
  leagueId: string;
  radiant: {
    id: number;
    name?: string;
  };
  dire: {
    id: number;
    name?: string;
  };
  startTime: number;
  duration: number;
  radiantWin: boolean;
  lobbyType: number;
  seriesId: number;
  seriesType: number;
  players: {
    accountId: number;
    playerSlot: number;
    teamNumber: number;
    teamSlot: number;
    heroId: number;
    heroVariant: number;
  }[];
}

export interface LeagueSummary {
  totalMatches: number;
  totalTeams: number;
  totalPlayers: number;
  lastMatchDate: string | null;
  averageMatchDuration: number;
}

export interface LeagueData {
  league: League;
  matches: Match[];
  teams: Team[];
  players: Player[];
  summary: LeagueSummary;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface LeagueContextValue {
  // State
  leagueList: LeagueData[];
  activeLeague: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  addLeague: (leagueId: string) => Promise<void>;
  removeLeague: (leagueId: string) => Promise<void>;
  setActiveLeague: (leagueId: string | null) => Promise<void>;
  refreshLeague: (leagueId: string) => Promise<void>;
  clearError: () => void;

  // Team operations
  getTeamsInLeague: (leagueId: string) => Team[];
  getTeamById: (leagueId: string, teamId: string) => Team | undefined;
}

export interface LeagueContextProviderProps {
  children: ReactNode;
}
