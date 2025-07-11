import { DotabuffMatchSummary, DotabuffTeam, OpenDotaTeam } from '@/types/external-apis';

/**
 * Processed team data optimized for frontend consumption
 */
export interface ProcessedTeam {
  teamId: number;
  name: string;
  tag: string;
  logoUrl?: string;
  sponsor?: string;
  countryCode?: string;
  websiteUrl?: string;
  profile: ProcessedTeamProfile;
  statistics: ProcessedTeamStatistics;
  performance: ProcessedTeamPerformance;
  roster: ProcessedTeamRoster;
  matches: ProcessedTeamMatches;
  achievements: ProcessedTeamAchievements;
  processed: {
    timestamp: string;
    version: string;
  };
}

/**
 * Processed team profile data
 */
export interface ProcessedTeamProfile {
  establishedDate?: string;
  region: string;
  primaryLanguage?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    twitch?: string;
    youtube?: string;
  };
  sponsorships?: Array<{
    name: string;
    type: 'main' | 'secondary' | 'equipment';
    logoUrl?: string;
  }>;
  description?: string;
}

/**
 * Processed team statistics
 */
export interface ProcessedTeamStatistics {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  rating: number;
  lastMatchTime: number;
  averageMatchDuration: number;
  totalPrizeMoney?: number;
  gamesPlayed: {
    official: number;
    scrimmage: number;
    tournament: number;
  };
  streaks: {
    currentWinStreak: number;
    currentLossStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
  };
  formFactor: {
    last10Games: {
      wins: number;
      losses: number;
      winRate: number;
    };
    last30Days: {
      wins: number;
      losses: number;
      winRate: number;
    };
  };
}

/**
 * Processed team performance metrics
 */
export interface ProcessedTeamPerformance {
  skillLevel: 'amateur' | 'semi_professional' | 'professional' | 'tier1' | 'tier2' | 'tier3';
  consistency: number; // 0-100
  versatility: number; // 0-100
  teamwork: number; // 0-100
  laning: number; // 0-100
  midGame: number; // 0-100
  lateGame: number; // 0-100
  adaptability: number; // 0-100
  clutchFactor: number; // 0-100
  improvement: number; // -100 to +100 (negative = declining, positive = improving)
  strengths: string[];
  weaknesses: string[];
  playStyle: {
    aggressive: number; // 0-100
    defensive: number; // 0-100
    strategic: number; // 0-100
    chaotic: number; // 0-100
  };
}

/**
 * Processed team roster data
 */
export interface ProcessedTeamRoster {
  activeRoster: Array<{
    accountId: number;
    name: string;
    position: number;
    joinDate?: string;
    gamesPlayed: number;
    wins: number;
    winRate: number;
    role: 'carry' | 'mid' | 'offlane' | 'support' | 'hard_support' | 'substitute';
    isActive: boolean;
    isCaptain: boolean;
    performance: {
      averageKDA: number;
      averageGPM: number;
      averageXPM: number;
      impactScore: number;
    };
  }>;
  formerPlayers: Array<{
    accountId: number;
    name: string;
    position: number;
    joinDate?: string;
    leaveDate?: string;
    gamesPlayed: number;
    wins: number;
    winRate: number;
    role: 'carry' | 'mid' | 'offlane' | 'support' | 'hard_support' | 'substitute';
  }>;
  coaching: Array<{
    name: string;
    role: 'head_coach' | 'assistant_coach' | 'analyst' | 'manager';
    joinDate?: string;
    isActive: boolean;
  }>;
  rosterStability: number; // 0-100
  averagePlayerTenure: number; // in days
}

/**
 * Processed team matches data
 */
export interface ProcessedTeamMatches {
  recentMatches: Array<{
    matchId: number;
    opponent: string;
    result: 'win' | 'loss';
    duration: number;
    startTime: number;
    leagueId?: number;
    leagueName?: string;
    isOfficial: boolean;
    radiantWin: boolean;
    radiantScore?: number;
    direScore?: number;
    teamSide: 'radiant' | 'dire';
    performance: {
      avgKDA: number;
      avgGPM: number;
      avgXPM: number;
      objectives: number;
    };
  }>;
  upcomingMatches: Array<{
    opponent: string;
    scheduledTime: number;
    leagueId?: number;
    leagueName?: string;
    isOfficial: boolean;
    importance: 'low' | 'medium' | 'high' | 'critical';
  }>;
  headToHead: Array<{
    opponent: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    lastMatch: number;
  }>;
  tournamentPerformance: Array<{
    leagueId: number;
    leagueName: string;
    placement?: number;
    totalTeams?: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    prizeMoney?: number;
    isOngoing: boolean;
  }>;
}

/**
 * Processed team achievements data
 */
export interface ProcessedTeamAchievements {
  majorTournaments: Array<{
    name: string;
    placement: number;
    totalTeams: number;
    year: number;
    prizeMoney?: number;
    isFirstPlace: boolean;
  }>;
  minorTournaments: Array<{
    name: string;
    placement: number;
    totalTeams: number;
    year: number;
    prizeMoney?: number;
    isFirstPlace: boolean;
  }>;
  totalTournaments: number;
  totalWins: number;
  totalPrizeMoney: number;
  rankings: {
    currentWorldRank?: number;
    currentRegionalRank?: number;
    peakWorldRank?: number;
    peakRegionalRank?: number;
  };
  milestones: Array<{
    description: string;
    date: string;
    type: 'tournament' | 'ranking' | 'roster' | 'achievement';
  }>;
}

/**
 * Raw team data input for processing
 */
export interface RawTeamData {
  openDotaTeam?: OpenDotaTeam;
  dotabuffTeam?: DotabuffTeam;
  additionalMatches?: DotabuffMatchSummary[];
  teamId: number;
} 