import type { ReactNode } from 'react';

/**
 * Match status indicating the current state of the match
 */
export type MatchStatus = 'live' | 'completed' | 'upcoming' | 'postponed' | 'cancelled';

/**
 * Display mode for the match card component
 */
export type MatchCardDisplayMode = 'compact' | 'detailed' | 'tournament';

/**
 * Layout orientation for the match card
 */
export type MatchCardLayout = 'horizontal' | 'vertical';

/**
 * Match card size variants
 */
export type MatchCardSize = 'small' | 'medium' | 'large';

/**
 * Team information displayed in the match card
 */
export interface MatchCardTeam {
  /** Unique team identifier */
  id: string;
  /** Team display name */
  name: string;
  /** Team logo URL */
  logoUrl?: string;
  /** Team tag/abbreviation */
  tag?: string;
  /** Team score in the match */
  score?: number;
  /** Whether this team won the match */
  isWinner?: boolean;
  /** Team's current rank or rating */
  rank?: number;
}

/**
 * Match timing and duration information
 */
export interface MatchTiming {
  /** Match start time as ISO string */
  startTime: string;
  /** Match end time as ISO string (if completed) */
  endTime?: string;
  /** Match duration in seconds */
  duration?: number;
  /** Estimated duration for upcoming matches */
  estimatedDuration?: number;
}

/**
 * Match series information for tournament play
 */
export interface MatchSeries {
  /** Current game number in the series */
  currentGame: number;
  /** Total games in the series (e.g., 3 for Bo3) */
  totalGames: number;
  /** Series format description */
  format: string;
  /** Individual game results */
  games: Array<{
    gameNumber: number;
    winner?: string;
    duration?: number;
    completed: boolean;
  }>;
}

/**
 * Tournament or league context for the match
 */
export interface MatchTournament {
  /** Tournament identifier */
  id: string;
  /** Tournament name */
  name: string;
  /** Tournament tier or level */
  tier?: string;
  /** Prize pool information */
  prizePool?: string;
  /** Tournament logo URL */
  logoUrl?: string;
}

/**
 * Live match data for ongoing games
 */
export interface LiveMatchData {
  /** Current game time in seconds */
  gameTime: number;
  /** Radiant team kills */
  radiantKills: number;
  /** Dire team kills */
  direKills: number;
  /** Current spectator count */
  spectators?: number;
  /** Live match delay in seconds */
  delay?: number;
}

/**
 * Core match data structure for display
 */
export interface MatchCardData {
  /** Unique match identifier */
  id: string;
  /** Current match status */
  status: MatchStatus;
  /** Teams participating in the match */
  teams: {
    radiant: MatchCardTeam;
    dire: MatchCardTeam;
  };
  /** Match timing information */
  timing: MatchTiming;
  /** Series information (for tournament matches) */
  series?: MatchSeries;
  /** Tournament context */
  tournament?: MatchTournament;
  /** Live data (for ongoing matches) */
  liveData?: LiveMatchData;
  /** Best of N format */
  bestOf?: number;
  /** Match importance or priority */
  priority?: 'low' | 'medium' | 'high';
  /** Additional metadata */
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Styling configuration for match card appearance
 */
export interface MatchCardStyling {
  /** Component size variant */
  size?: MatchCardSize;
  /** Layout orientation */
  layout?: MatchCardLayout;
  /** Custom CSS classes */
  className?: string;
  /** Show team logos */
  showLogos?: boolean;
  /** Show match timing */
  showTiming?: boolean;
  /** Show live indicators */
  showLiveIndicators?: boolean;
  /** Show tournament information */
  showTournament?: boolean;
  /** Show series progress */
  showSeries?: boolean;
  /** Custom color scheme */
  colorScheme?: 'default' | 'dark' | 'light' | 'tournament';
  /** Animate live updates */
  animate?: boolean;
}

/**
 * Interaction handlers for match card events
 */
export interface MatchCardHandlers {
  /** Called when the match card is clicked */
  onClick?: (matchId: string, matchData: MatchCardData) => void;
  /** Called when a team is clicked */
  onTeamClick?: (teamId: string, team: MatchCardTeam) => void;
  /** Called when tournament info is clicked */
  onTournamentClick?: (tournamentId: string, tournament: MatchTournament) => void;
  /** Called when live data is clicked */
  onLiveClick?: (matchId: string, liveData: LiveMatchData) => void;
  /** Called when series info is clicked */
  onSeriesClick?: (matchId: string, series: MatchSeries) => void;
  /** Called for custom action buttons */
  onCustomAction?: (action: string, matchId: string) => void;
}

/**
 * Loading and error states for match card
 */
export interface MatchCardState {
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Error message if data loading failed */
  error?: string;
  /** Whether the match data is stale */
  isStale?: boolean;
  /** Last update timestamp */
  lastUpdated?: string;
}

/**
 * Accessibility configuration for match card
 */
export interface MatchCardAccessibility {
  /** ARIA label for the match card */
  ariaLabel?: string;
  /** ARIA description for complex match data */
  ariaDescription?: string;
  /** Whether the card is keyboard navigable */
  tabIndex?: number;
  /** Custom ARIA attributes */
  ariaAttributes?: Record<string, string>;
}

/**
 * Custom action configuration for match card
 */
export interface MatchCardAction {
  /** Action identifier */
  id: string;
  /** Action label */
  label: string;
  /** Action icon component */
  icon?: ReactNode;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Action variant styling */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Custom action handler */
  handler: (matchId: string) => void;
}

/**
 * Complete props interface for MatchCard component
 */
export interface MatchCardProps {
  /** Match data to display */
  match: MatchCardData;
  /** Display mode configuration */
  displayMode?: MatchCardDisplayMode;
  /** Styling configuration */
  styling?: MatchCardStyling;
  /** Interaction handlers */
  handlers?: MatchCardHandlers;
  /** Component state */
  state?: MatchCardState;
  /** Accessibility configuration */
  accessibility?: MatchCardAccessibility;
  /** Custom actions */
  actions?: MatchCardAction[];
  /** Additional custom content */
  children?: ReactNode;
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

/**
 * Props for match card list/grid containers
 */
export interface MatchCardListProps {
  /** Array of matches to display */
  matches: MatchCardData[];
  /** Default display mode for all cards */
  defaultDisplayMode?: MatchCardDisplayMode;
  /** Default styling for all cards */
  defaultStyling?: MatchCardStyling;
  /** Shared handlers for all cards */
  sharedHandlers?: MatchCardHandlers;
  /** Loading state for the entire list */
  isLoading?: boolean;
  /** Error state for the entire list */
  error?: string;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Custom container className */
  containerClassName?: string;
  /** Grid layout configuration */
  gridLayout?: {
    columns?: number;
    gap?: string;
    responsive?: boolean;
  };
  /** Virtualization configuration for large lists */
  virtualization?: {
    enabled: boolean;
    itemHeight: number;
    overscan?: number;
  };
  /** Pagination configuration */
  pagination?: {
    enabled: boolean;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

/**
 * Match filter configuration for filtering match cards
 */
export interface MatchCardFilter {
  /** Filter by match status */
  status?: MatchStatus[];
  /** Filter by tournament */
  tournaments?: string[];
  /** Filter by teams */
  teams?: string[];
  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };
  /** Filter by match priority */
  priority?: Array<'low' | 'medium' | 'high'>;
  /** Custom filter function */
  customFilter?: (match: MatchCardData) => boolean;
}

/**
 * Sort configuration for match card lists
 */
export interface MatchCardSort {
  /** Sort field */
  field: 'startTime' | 'priority' | 'tournament' | 'status';
  /** Sort direction */
  direction: 'asc' | 'desc';
  /** Custom sort function */
  customSort?: (a: MatchCardData, b: MatchCardData) => number;
} 