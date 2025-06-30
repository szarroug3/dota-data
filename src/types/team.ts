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
  openDota?: Record<string, unknown>;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  players: Player[];
  winRate?: number;
  totalMatches?: number;
  lastMatch?: string;
  league?: string;
  season?: string;
  founded?: string;
  record?: string;
  manualMatches?: Match[];
  dotabuffUrl?: string;
  leagueUrl?: string;
  standings?: any[];
  topHeroes?: any[];
}
