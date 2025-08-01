/**
 * Match context value types
 * 
 * Defines the structure for match-related state and data management
 * in the frontend application.
 */

import type { Hero, Item } from '@/types/contexts/constants-context-value';
import type { PlayerRole } from '@/types/contexts/team-context-value';
import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

// ============================================================================
// PROCESSED DATA TYPES
// ============================================================================

export interface DraftPhase {
  phase: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  hero: string;
  time: number;
}

export interface GameEvent {
  type: EventType;
  time: number;
  description: string;
  team?: 'radiant' | 'dire';
  details?: EventDetails;
}

export interface TeamFightStats {
  radiant: { total: number; wins: number; losses: number };
  dire: { total: number; wins: number; losses: number };
}

// ============================================================================
// MATCH DATA STRUCTURES
// ============================================================================

export interface Match {
  // Basic match information
  id: number;
  date: string;
  duration: number;
  
  // Team information
  radiant: {
    id?: number;
    name?: string;
  };
  dire: {
    id?: number;
    name?: string;
  };
  
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
  
  // Pick order information
  pickOrder?: {
    radiant: 'first' | 'second' | null;
    dire: 'first' | 'second' | null;
  };
  
  // Processed data for components
  processedDraft?: DraftPhase[];
  processedEvents?: GameEvent[];
  teamFightStats?: TeamFightStats;
  
  // Error handling
  error?: string;
  
  // Loading state
  isLoading?: boolean;
}



export interface HeroPick {
  hero: Hero; // Hero data (always available since we wait for heroes to load)
  accountId: number;
  role?: PlayerRole; // Optional - only show when we have valid role data
}

export interface PlayerMatchData {
  accountId: number;
  playerName: string;
  hero: Hero; // Hero data (always available since we wait for heroes to load)
  role?: PlayerRole;
  
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
  | 'CHAT_MESSAGE_FIRSTBLOOD'
  | 'CHAT_MESSAGE_ROSHAN_KILL'
  | 'CHAT_MESSAGE_AEGIS'
  | 'building_kill'
  | 'CHAT_MESSAGE_COURIER_LOST'
  | 'team_fight'
  | 'hero_kill'
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
  
  // Hero information for tooltips
  killerHero?: Hero;
  victimHero?: Hero;
  aegisHolderHero?: Hero;
  
  // For tower/barracks kills
  buildingType?: 'tower' | 'barracks';
  buildingTier?: number;
  buildingLane?: 'top' | 'mid' | 'bottom';
  
  // For team fights
  participants?: string[]; // Player IDs
  duration?: number;
  casualties?: number;
  playerDetails?: Array<{
    playerIndex: number;
    deaths: number;
    buybacks: number;
    goldDelta: number;
    xpDelta: number;
    damage: number;
    healing: number;
  }>;
  
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

// ============================================================================
// MATCH CONTEXT STATE
// ============================================================================



export interface MatchContextValue {
  // State
  matches: Map<number, Match>; // Key: matchId
  selectedMatchId: number | null;
  setSelectedMatchId: (matchId: number | null) => void;
  isLoading: boolean;
  
  // Core operations
  addMatch: (matchId: number) => Promise<Match | null>;
  refreshMatch: (matchId: number) => Promise<Match | null>;
  parseMatch: (matchId: number) => Promise<void>;
  removeMatch: (matchId: number) => void;
  
  // Data access
  getMatch: (matchId: number) => Match | undefined;
  getMatches: (matchIds: number[]) => Match[];
}

export interface MatchContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface MatchState {
  matches: Map<number, Match>;
  setMatches: React.Dispatch<React.SetStateAction<Map<number, Match>>>;
  selectedMatchId: number | null;
  setSelectedMatchId: (matchId: number | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export interface MatchProcessing {
  processMatchData: (matchData: OpenDotaMatch) => Match;
}

export interface MatchActions {
  // State
  matches: Map<number, Match>;
  selectedMatchId: number | null;
  isLoading: boolean;
  
  // Core operations
  addMatch: (matchId: number) => Promise<Match | null>;
  refreshMatch: (matchId: number) => Promise<Match | null>;
  parseMatch: (matchId: number) => Promise<void>;
  removeMatch: (matchId: number) => void;
  
  // Data access
  setSelectedMatchId: (matchId: number | null) => void;
  getMatch: (matchId: number) => Match | undefined;
  getMatches: (matchIds: number[]) => Match[];
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export interface PlayerAnalysis {
  accountId: number;
  playerName: string;
  heroId: number;
  heroName: string;
  role?: PlayerRole;
  lane: number;
  farmPriority: number;
  supportScore: number;
  kda: number;
  gpm: number;
  xpm: number;
  lastHits: number;
  denies: number;
  netWorth: number;
  level: number;
  items: Item[];
  heroStats: {
    damageDealt: number;
    healingDone: number;
    towerDamage: number;
  };
}

export interface PlayerAnalysisResult {
  player: OpenDotaMatchPlayer;
  supportScore: number;
  farmScore: number;
  killScore: number;
  totalScore: number;
} 