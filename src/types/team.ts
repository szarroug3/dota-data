import type { OpenDotaFullMatch } from '@/types/opendota';

export interface Player {
  name: string;
  id: string;
  role?: string;
  mmr?: number;
  isStandin?: boolean;
  standinFor?: string;
  addedDate?: string;
}

export interface Match {
  id: string;
  date: string;
  opponent: string;
  result: string;
  score: string;
  league: string;
  notes?: string;
  openDota?: OpenDotaFullMatch;
}

export interface Team {
  id: string;
  teamId: string; // API team ID
  teamName: string;
  leagueId?: string;
  leagueName?: string;
  matchIds: string[]; // From API
  matchIdsByLeague?: Record<string, string[]>;
  // New Dotabuff structure
  dotabuffMatches?: Record<string, any>; // Matches organized by league ID
  players: Player[];
  winRate?: number;
  totalMatches?: number;
  lastMatch?: string;
  league?: string;
  season?: string;
  founded?: string;
  record?: string;
  manualMatches: Match[]; // Manually added matches
  manualPlayers: Player[]; // Manually added players
  hiddenMatches: string[]; // Hidden match IDs
  hiddenPlayers: string[]; // Hidden player IDs
  dotabuffUrl?: string;
  leagueUrl?: string;
  standings?: any[];
  topHeroes?: any[];
  loading?: boolean;
}
