/**
 * Match context value types
 * 
 * Defines the structure for match-related state and data management
 * in the frontend application.
 */

import type { Hero, Item } from '@/types/contexts/constants-context-value';

// ============================================================================
// MATCH DATA STRUCTURES
// ============================================================================

export interface Match {
  // Basic match information
  id: string;
  date: string;
  duration: number;
  
  // Team information
  radiantTeamId: string;
  direTeamId: string;
  
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
    radiantScore: number;
    direScore: number;
    goldAdvantage: {
      times: number[];
      radiantGold: number[];
      direGold: number[];
    };
    experienceAdvantage: {
      times: number[];
      radiantExperience: number[];
      direExperience: number[];
    };
  };
  
  // Match events
  events: MatchEvent[];
  
  // Match result
  result: 'radiant' | 'dire';
}



export interface HeroPick {
  hero: Hero; // Hero data (always available since we wait for heroes to load)
  playerId: string;
  role: PlayerRole;
}

export interface PlayerMatchData {
  playerId: string;
  playerName: string;
  hero: Hero; // Hero data (always available since we wait for heroes to load)
  role: PlayerRole;
  
  // Performance stats
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    lastHits: number;
    denies: number;
    gpm: number; // Gold per minute
    xpm: number; // Experience per minute
    netWorth: number;
    level: number;
  };
  
  // Items
  items: Item[];
  
  // Hero-specific stats
  heroStats: {
    damageDealt: number;
    healingDone: number;
    towerDamage: number;
  };
}

export interface MatchEvent {
  timestamp: number; // When in the match this happened
  type: EventType;
  side: 'radiant' | 'dire' | 'neutral';
  details: EventDetails;
}

export type EventType = 
  | 'roshan_kill'
  | 'aegis_pickup'
  | 'aegis_expire'
  | 'tower_kill'
  | 'barracks_kill'
  | 'team_fight'
  | 'hero_kill'
  | 'first_blood'
  | 'bounty_rune'
  | 'power_rune'
  | 'ward_placed'
  | 'ward_killed'
  | 'smoke_used'
  | 'gem_dropped'
  | 'gem_picked_up';

export interface EventDetails {
  // For hero kills
  killer?: string; // Player ID
  victim?: string; // Player ID
  assists?: string[]; // Player IDs
  
  // For tower/barracks kills
  buildingType?: 'tower' | 'barracks';
  buildingTier?: number;
  buildingLane?: 'top' | 'mid' | 'bottom';
  
  // For team fights
  participants?: string[]; // Player IDs
  duration?: number;
  casualties?: number;
  
  // For roshan
  roshanKiller?: 'radiant' | 'dire'; // Team that killed roshan
  aegisHolder?: string; // Player ID
  
  // For runes
  runeType?: string;
  runeLocation?: string;
  
  // For wards
  wardType?: 'observer' | 'sentry';
  wardLocation?: string;
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
// MATCH CONTEXT STATE
// ============================================================================



export interface MatchContextValue {
  // State
  matches: Map<string, Match>; // Key: matchId
  selectedMatchId: string | null;
  setSelectedMatchId: (matchId: string | null) => void;
  isLoading: boolean;
  error: string | null;
  
  // Core operations
  addMatch: (matchId: string) => Promise<Match | null>;
  refreshMatch: (matchId: string) => Promise<Match | null>;
  parseMatch: (matchId: string) => Promise<void>;
  
  // Data access
  getMatch: (matchId: string) => Match | undefined;
  getMatches: (matchIds: string[]) => Match[];
}

export interface MatchContextProviderProps {
  children: React.ReactNode;
} 