
/**
 * Team data hook operation types
 */
export type TeamDataOperation = 'fetch' | 'add' | 'update' | 'remove' | 'search' | 'refresh';

/**
 * Team data cache strategy
 */
export type TeamCacheStrategy = 'cache-first' | 'cache-only' | 'network-first' | 'network-only';

/**
 * Team data sync status
 */
export type TeamSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'stale';

/**
 * Team member role types
 */
export type TeamMemberRole = 'captain' | 'player' | 'substitute' | 'coach' | 'manager';

/**
 * Team status types
 */
export type TeamStatus = 'active' | 'inactive' | 'disbanded' | 'recruiting' | 'locked';

/**
 * Team visibility settings
 */
export type TeamVisibility = 'public' | 'private' | 'friends' | 'team';

/**
 * Core team member information
 */
export interface TeamMember {
  /** Player identifier */
  playerId: string;
  /** Player display name */
  playerName: string;
  /** Player avatar URL */
  avatarUrl?: string;
  /** Player role in team */
  role: TeamMemberRole;
  /** Join date */
  joinDate: string;
  /** Is team captain */
  isCaptain: boolean;
  /** Is substitute player */
  isSubstitute: boolean;
  /** Player performance metrics */
  performance?: {
    matchesPlayed: number;
    winRate: number;
    avgKDA: number;
    lastActive: string;
  };
  /** Player preferences */
  preferences?: {
    preferredRole: string;
    preferredHeroes: string[];
    availability: {
      timezone: string;
      weekdays: boolean[];
      hours: {
        start: string;
        end: string;
      };
    };
  };
  /** Player contact information */
  contact?: {
    email?: string;
    discord?: string;
    steam?: string;
  };
}

/**
 * Team statistics and performance data
 */
export interface TeamStats {
  /** Total matches played */
  totalMatches: number;
  /** Total wins */
  wins: number;
  /** Total losses */
  losses: number;
  /** Overall win rate */
  winRate: number;
  /** Current win streak */
  currentStreak: number;
  /** Best win streak */
  bestStreak: number;
  /** Average match duration */
  avgMatchDuration: number;
  /** Most played heroes */
  topHeroes: Array<{
    heroId: string;
    heroName: string;
    picks: number;
    winRate: number;
  }>;
  /** Performance by game mode */
  modeStats: Record<string, {
    matches: number;
    winRate: number;
  }>;
  /** Recent performance trend */
  recentTrend: {
    period: '7d' | '30d' | '90d';
    direction: 'improving' | 'stable' | 'declining';
    change: number;
  };
  /** Team achievements */
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    dateEarned: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

/**
 * Team tournament and competition data
 */
export interface TeamTournaments {
  /** Current tournaments */
  active: Array<{
    tournamentId: string;
    name: string;
    status: 'registered' | 'ongoing' | 'qualified' | 'eliminated';
    startDate: string;
    endDate?: string;
    prizePool?: string;
    currentRound?: string;
    placement?: number;
  }>;
  /** Past tournaments */
  history: Array<{
    tournamentId: string;
    name: string;
    placement: number;
    totalTeams: number;
    prizeWon?: string;
    dateCompleted: string;
    performance: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  /** Tournament statistics */
  stats: {
    totalTournaments: number;
    bestPlacement: number;
    totalPrizeWon: string;
    averagePlacement: number;
    tournamentWinRate: number;
  };
}

/**
 * Team practice and schedule data
 */
export interface TeamSchedule {
  /** Regular practice sessions */
  practice: Array<{
    id: string;
    name: string;
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string;
    endTime: string;
    timezone: string;
    recurring: boolean;
    mandatory: boolean;
    description?: string;
  }>;
  /** Upcoming matches */
  matches: Array<{
    matchId: string;
    opponent: string;
    date: string;
    time: string;
    tournament?: string;
    matchType: 'scrim' | 'official' | 'qualifier' | 'final';
    importance: 'low' | 'medium' | 'high' | 'critical';
  }>;
  /** Team events */
  events: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    duration: number;
    attendees: string[];
    eventType: 'meeting' | 'practice' | 'tournament' | 'social';
  }>;
}

/**
 * Complete team data structure
 */
export interface TeamData {
  /** Unique team identifier */
  id: string;
  /** Team display name */
  name: string;
  /** Team tag/abbreviation */
  tag: string;
  /** Team description */
  description?: string;
  /** Team logo URL */
  logoUrl?: string;
  /** Team banner URL */
  bannerUrl?: string;
  /** Team creation date */
  createdDate: string;
  /** Team status */
  status: TeamStatus;
  /** Team visibility */
  visibility: TeamVisibility;
  /** Team owner/creator */
  owner: string;
  /** Team members */
  members: TeamMember[];
  /** Team statistics */
  stats: TeamStats;
  /** Tournament data */
  tournaments: TeamTournaments;
  /** Schedule and events */
  schedule: TeamSchedule;
  /** Team settings */
  settings: {
    /** Auto-accept join requests */
    autoAccept: boolean;
    /** Minimum MMR requirement */
    minMMR?: number;
    /** Maximum team size */
    maxSize: number;
    /** Require voice chat */
    requireVoiceChat: boolean;
    /** Team timezone */
    timezone: string;
    /** Preferred game modes */
    preferredModes: string[];
    /** Team language */
    language: string;
  };
  /** Team metadata */
  metadata: {
    /** Last updated timestamp */
    lastUpdated: string;
    /** Data version */
    version: number;
    /** Data source */
    source: string;
    /** Cache expiry */
    cacheExpiry?: string;
  };
}

/**
 * Team search and filter configuration
 */
export interface TeamSearchFilter {
  /** Search by team name or tag */
  query?: string;
  /** Filter by team status */
  status?: TeamStatus[];
  /** Filter by minimum MMR */
  minMMR?: number;
  /** Filter by maximum MMR */
  maxMMR?: number;
  /** Filter by team size */
  teamSize?: {
    min?: number;
    max?: number;
  };
  /** Filter by availability */
  availability?: {
    timezone?: string;
    requiresVoiceChat?: boolean;
    languages?: string[];
  };
  /** Filter by recent activity */
  recentActivity?: {
    days: number;
    includeInactive: boolean;
  };
  /** Filter by tournament participation */
  tournaments?: {
    active: boolean;
    minTournaments?: number;
    avgPlacement?: number;
  };
  /** Custom filter function */
  customFilter?: (team: TeamData) => boolean;
}

/**
 * Team data sorting configuration
 */
export interface TeamSort {
  /** Sort field */
  field: keyof TeamData | keyof TeamStats | 'memberCount' | 'createdDate' | 'lastActive';
  /** Sort direction */
  direction: 'asc' | 'desc';
  /** Secondary sort field */
  secondaryField?: string;
  /** Custom sort function */
  customSort?: (a: TeamData, b: TeamData) => number;
}

/**
 * Team management operations
 */
export interface TeamManagementOperations {
  /** Add a new team */
  addTeam: (teamData: Omit<TeamData, 'id' | 'createdDate' | 'metadata'>) => Promise<TeamData>;
  /** Update existing team */
  updateTeam: (teamId: string, updates: Partial<TeamData>) => Promise<TeamData>;
  /** Remove team */
  removeTeam: (teamId: string) => Promise<void>;
  /** Add member to team */
  addMember: (teamId: string, member: Omit<TeamMember, 'joinDate'>) => Promise<TeamData>;
  /** Remove member from team */
  removeMember: (teamId: string, playerId: string) => Promise<TeamData>;
  /** Update member role */
  updateMemberRole: (teamId: string, playerId: string, role: TeamMemberRole) => Promise<TeamData>;
  /** Transfer team ownership */
  transferOwnership: (teamId: string, newOwnerId: string) => Promise<TeamData>;
  /** Join team request */
  requestJoin: (teamId: string, playerId: string, message?: string) => Promise<void>;
  /** Accept join request */
  acceptJoinRequest: (teamId: string, playerId: string) => Promise<TeamData>;
  /** Reject join request */
  rejectJoinRequest: (teamId: string, playerId: string) => Promise<void>;
  /** Leave team */
  leaveTeam: (teamId: string, playerId: string) => Promise<void>;
}

/**
 * Team data loading states
 */
export interface TeamDataLoadingState {
  /** General team data loading */
  isLoading: boolean;
  /** Specific operation loading states */
  operations: {
    fetch: boolean;
    add: boolean;
    update: boolean;
    remove: boolean;
    search: boolean;
    refresh: boolean;
    addMember: boolean;
    removeMember: boolean;
    updateMember: boolean;
    joinRequest: boolean;
  };
  /** Background sync status */
  syncStatus: TeamSyncStatus;
  /** Last sync timestamp */
  lastSync?: string;
}

/**
 * Team data error states
 */
export interface TeamDataErrorState {
  /** General error */
  error?: string;
  /** Operation-specific errors */
  operationErrors: {
    fetch?: string;
    add?: string;
    update?: string;
    remove?: string;
    search?: string;
    refresh?: string;
    addMember?: string;
    removeMember?: string;
    updateMember?: string;
    joinRequest?: string;
  };
  /** Network error */
  networkError?: boolean;
  /** Permission error */
  permissionError?: boolean;
  /** Validation errors */
  validationErrors?: Record<string, string>;
}

/**
 * Team data cache state
 */
export interface TeamDataCacheState {
  /** Cache strategy being used */
  strategy: TeamCacheStrategy;
  /** Cached team data */
  cachedTeams: Map<string, TeamData>;
  /** Cache timestamps */
  cacheTimestamps: Map<string, string>;
  /** Cache hit rate */
  hitRate: number;
  /** Cache size */
  size: number;
  /** Cache configuration */
  config: {
    maxSize: number;
    ttl: number; // Time to live in seconds
    backgroundRefresh: boolean;
  };
}

/**
 * Team data pagination
 */
export interface TeamDataPagination {
  /** Current page */
  currentPage: number;
  /** Page size */
  pageSize: number;
  /** Total items */
  totalItems: number;
  /** Total pages */
  totalPages: number;
  /** Has next page */
  hasNextPage: boolean;
  /** Has previous page */
  hasPreviousPage: boolean;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Change page size */
  changePageSize: (size: number) => void;
}

/**
 * Team data hook configuration
 */
export interface UseTeamDataConfig {
  /** Cache strategy */
  cacheStrategy?: TeamCacheStrategy;
  /** Auto-refresh interval in seconds */
  autoRefreshInterval?: number;
  /** Enable background sync */
  enableBackgroundSync?: boolean;
  /** Pagination settings */
  pagination?: {
    enabled: boolean;
    defaultPageSize: number;
    maxPageSize: number;
  };
  /** Default sort configuration */
  defaultSort?: TeamSort;
  /** Default filter configuration */
  defaultFilter?: TeamSearchFilter;
  /** Error retry configuration */
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  /** Optimistic updates */
  optimisticUpdates?: boolean;
}

/**
 * Team data hook types
 * 
 * Defines the return types and options for the useTeamData hook
 */

import type { 
  Team, 
  TeamData as ContextTeamData, 
  TeamStats as ContextTeamStats 
} from '@/types/contexts/team-context-value';

// ============================================================================
// HOOK OPTIONS
// ============================================================================

/**
 * Options for useTeamData hook
 */
export interface UseTeamDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  includeStats?: boolean;
  includeMatches?: boolean;
  includePlayers?: boolean;
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

/**
 * Return type for useTeamData hook
 */
export interface UseTeamDataReturn {
  // Team data
  teams: Team[];
  activeTeam: Team | null;
  activeTeamId: string | null;
  teamData: ContextTeamData | null;
  teamStats: ContextTeamStats | null;
  
  // Loading states
  isLoadingTeams: boolean;
  isLoadingTeamData: boolean;
  isLoadingTeamStats: boolean;
  
  // Error states
  teamsError: string | null;
  teamDataError: string | null;
  teamStatsError: string | null;
  
  // Actions
  setActiveTeam: (teamId: string) => void;
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string) => Promise<void>;
  refreshTeam: (teamId: string) => Promise<void>;
  updateTeam: (teamId: string) => Promise<void>;
  clearErrors: () => void;
}

/**
 * Team validation rules
 */
export interface TeamValidationRules {
  /** Team name validation */
  name: {
    minLength: number;
    maxLength: number;
    allowedCharacters: RegExp;
    reservedNames: string[];
  };
  /** Team tag validation */
  tag: {
    minLength: number;
    maxLength: number;
    allowedCharacters: RegExp;
    reservedTags: string[];
  };
  /** Team size validation */
  size: {
    minMembers: number;
    maxMembers: number;
    maxSubstitutes: number;
  };
  /** Member validation */
  member: {
    minMMR?: number;
    maxMMR?: number;
    requiredFields: (keyof TeamMember)[];
  };
} 