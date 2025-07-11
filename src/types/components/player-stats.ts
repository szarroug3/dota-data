import type { ReactNode } from 'react';

/**
 * Player statistics view mode options
 */
export type PlayerStatsViewMode = 'overview' | 'detailed' | 'comparison';

/**
 * Time range options for statistics filtering
 */
export type PlayerStatsTimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all' | 'custom';

/**
 * Statistical metric categories
 */
export type PlayerStatsCategory = 
  | 'general' 
  | 'performance' 
  | 'farming' 
  | 'fighting' 
  | 'supporting' 
  | 'objective'
  | 'positioning'
  | 'economy';

/**
 * Player role classification
 */
export type PlayerRole = 'carry' | 'mid' | 'offlane' | 'support' | 'hard_support';

/**
 * Skill bracket classification
 */
export type SkillBracket = 
  | 'herald' 
  | 'guardian' 
  | 'crusader' 
  | 'archon' 
  | 'legend' 
  | 'ancient' 
  | 'divine' 
  | 'immortal';

/**
 * Aggregation period for statistics
 */
export type StatsAggregation = 'game' | 'daily' | 'weekly' | 'monthly';

/**
 * Core player information
 */
export interface PlayerStatsPlayer {
  /** Unique player identifier */
  id: string;
  /** Player display name */
  name: string;
  /** Player avatar URL */
  avatarUrl?: string;
  /** Steam profile URL */
  profileUrl?: string;
  /** Current MMR/rank */
  mmr?: number;
  /** Skill bracket */
  skillBracket?: SkillBracket;
  /** Leaderboard rank (if applicable) */
  leaderboardRank?: number;
  /** Country code */
  countryCode?: string;
  /** Is professional player */
  isProfessional?: boolean;
  /** Team affiliation */
  currentTeam?: {
    id: string;
    name: string;
    tag?: string;
  };
}

/**
 * General performance statistics
 */
export interface GeneralStats {
  /** Total matches played */
  totalMatches: number;
  /** Total wins */
  wins: number;
  /** Total losses */
  losses: number;
  /** Win rate percentage */
  winRate: number;
  /** Average match duration in seconds */
  avgDuration: number;
  /** Total playtime in hours */
  totalPlaytime: number;
  /** Abandonment rate */
  abandonRate: number;
  /** Most played heroes */
  topHeroes: Array<{
    heroId: string;
    heroName: string;
    matches: number;
    winRate: number;
  }>;
}

/**
 * Combat and performance metrics
 */
export interface PerformanceStats {
  /** Average kills per game */
  avgKills: number;
  /** Average deaths per game */
  avgDeaths: number;
  /** Average assists per game */
  avgAssists: number;
  /** Average KDA ratio */
  avgKDA: number;
  /** Kill participation percentage */
  killParticipation: number;
  /** Average hero damage */
  avgHeroDamage: number;
  /** Average tower damage */
  avgTowerDamage: number;
  /** Average healing done */
  avgHealing: number;
  /** Average damage taken */
  avgDamageTaken: number;
  /** Rampages count */
  rampages: number;
  /** Multi-kill statistics */
  multiKills: {
    doubleKills: number;
    tripleKills: number;
    ultraKills: number;
    rampages: number;
  };
}

/**
 * Farming and economy statistics
 */
export interface FarmingStats {
  /** Average last hits per minute */
  avgLastHitsPerMin: number;
  /** Average denies per minute */
  avgDeniesPerMin: number;
  /** Average gold per minute */
  avgGoldPerMin: number;
  /** Average experience per minute */
  avgXPPerMin: number;
  /** Average net worth at 10/20/30 minutes */
  avgNetWorth: {
    at10min: number;
    at20min: number;
    at30min: number;
  };
  /** Farming efficiency rating */
  farmingEfficiency: number;
  /** Jungle farming percentage */
  jungleFarmRate: number;
  /** Neutral items found */
  neutralItemsFound: number;
}

/**
 * Supporting and utility statistics
 */
export interface SupportStats {
  /** Wards placed per game */
  avgWardsPlaced: number;
  /** Observer wards placed */
  avgObserverWards: number;
  /** Sentry wards placed */
  avgSentryWards: number;
  /** Wards dewarded */
  avgWardsDewarded: number;
  /** Stuns duration per game */
  avgStunDuration: number;
  /** Camps stacked */
  avgCampsStacked: number;
  /** Runes grabbed */
  avgRunesGrabbed: number;
  /** Team fight participation */
  teamFightParticipation: number;
  /** Support items purchased */
  supportItemsPurchased: number;
}

/**
 * Objective control statistics
 */
export interface ObjectiveStats {
  /** Roshan kills participation */
  roshanKills: number;
  /** Tower kills participation */
  towerKills: number;
  /** Barracks destroyed */
  barracksDestroyed: number;
  /** Ancient participation */
  ancientKills: number;
  /** Average push damage */
  avgPushDamage: number;
  /** Objective timing (first blood, tower, etc.) */
  objectiveTiming: {
    firstBlood: number; // percentage of games
    firstTower: number;
    firstRoshan: number;
  };
}

/**
 * Hero-specific performance data
 */
export interface HeroPerformance {
  /** Hero identifier */
  heroId: string;
  /** Hero name */
  heroName: string;
  /** Matches played with this hero */
  matches: number;
  /** Win rate with this hero */
  winRate: number;
  /** Average KDA with this hero */
  avgKDA: number;
  /** Average GPM with this hero */
  avgGPM: number;
  /** Average XPM with this hero */
  avgXPM: number;
  /** Performance trend */
  trend: 'improving' | 'stable' | 'declining';
  /** Last played date */
  lastPlayed: string;
  /** Best performance game */
  bestGame?: {
    matchId: string;
    kda: string;
    duration: number;
    date: string;
  };
}

/**
 * Complete player statistics data structure
 */
export interface PlayerStatsData {
  /** Player information */
  player: PlayerStatsPlayer;
  /** Time period for these statistics */
  timePeriod: {
    start: string;
    end: string;
    range: PlayerStatsTimeRange;
  };
  /** General performance metrics */
  general: GeneralStats;
  /** Combat performance metrics */
  performance: PerformanceStats;
  /** Farming and economy metrics */
  farming: FarmingStats;
  /** Supporting and utility metrics */
  support: SupportStats;
  /** Objective control metrics */
  objectives: ObjectiveStats;
  /** Hero-specific performance */
  heroPerformance: HeroPerformance[];
  /** Role-specific statistics */
  roleStats: Record<PlayerRole, {
    matches: number;
    winRate: number;
    avgKDA: number;
    preference: number; // 0-100 how much player prefers this role
  }>;
  /** Recent match performance */
  recentMatches: Array<{
    matchId: string;
    heroId: string;
    result: 'win' | 'loss';
    kda: string;
    duration: number;
    date: string;
    performance: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  /** Skill progression */
  skillProgression: {
    mmrHistory: Array<{
      date: string;
      mmr: number;
    }>;
    skillBracketHistory: Array<{
      date: string;
      bracket: SkillBracket;
    }>;
  };
}

/**
 * Filter configuration for player statistics
 */
export interface PlayerStatsFilter {
  /** Time range selection */
  timeRange: PlayerStatsTimeRange;
  /** Custom date range (if timeRange is 'custom') */
  customDateRange?: {
    start: string;
    end: string;
  };
  /** Filter by specific heroes */
  heroes?: string[];
  /** Filter by player roles */
  roles?: PlayerRole[];
  /** Filter by match outcomes */
  outcomes?: Array<'win' | 'loss'>;
  /** Filter by game modes */
  gameModes?: string[];
  /** Filter by skill brackets */
  skillBrackets?: SkillBracket[];
  /** Minimum matches threshold */
  minimumMatches?: number;
  /** Custom filter function */
  customFilter?: (stats: PlayerStatsData) => boolean;
}

/**
 * Sort configuration for player statistics
 */
export interface PlayerStatsSort {
  /** Sort field */
  field: keyof GeneralStats | keyof PerformanceStats | keyof FarmingStats | 'mmr' | 'name';
  /** Sort direction */
  direction: 'asc' | 'desc';
  /** Secondary sort field */
  secondaryField?: string;
  /** Custom sort function */
  customSort?: (a: PlayerStatsData, b: PlayerStatsData) => number;
}

/**
 * Player comparison configuration
 */
export interface PlayerComparison {
  /** Primary player for comparison */
  primaryPlayer: string;
  /** Players to compare against */
  comparePlayers: string[];
  /** Metrics to compare */
  compareMetrics: PlayerStatsCategory[];
  /** Comparison view options */
  viewOptions: {
    showPercentageDifference: boolean;
    showAbsoluteDifference: boolean;
    highlightBestPerformer: boolean;
    showTrends: boolean;
  };
}

/**
 * Chart and visualization configuration
 */
export interface PlayerStatsVisualization {
  /** Chart type for metrics display */
  chartType: 'line' | 'bar' | 'radar' | 'scatter' | 'heatmap';
  /** Metrics to visualize */
  metrics: string[];
  /** Time aggregation for charts */
  aggregation: StatsAggregation;
  /** Color scheme */
  colorScheme: 'default' | 'performance' | 'role' | 'custom';
  /** Show trend lines */
  showTrends: boolean;
  /** Show data labels */
  showDataLabels: boolean;
  /** Chart height */
  height?: number;
  /** Interactive features */
  interactive: boolean;
}

/**
 * Export/sharing configuration
 */
export interface PlayerStatsExport {
  /** Export format */
  format: 'csv' | 'json' | 'pdf' | 'png';
  /** Include raw data */
  includeRawData: boolean;
  /** Include charts */
  includeCharts: boolean;
  /** Date range for export */
  dateRange: PlayerStatsTimeRange;
  /** Custom filename */
  filename?: string;
}

/**
 * Component state for player statistics
 */
export interface PlayerStatsState {
  /** Loading state for different sections */
  isLoading: {
    general: boolean;
    performance: boolean;
    farming: boolean;
    support: boolean;
    objectives: boolean;
    heroPerformance: boolean;
    comparison: boolean;
  };
  /** Error states */
  errors: {
    general?: string;
    performance?: string;
    farming?: string;
    support?: string;
    objectives?: string;
    heroPerformance?: string;
    comparison?: string;
  };
  /** Data freshness */
  lastUpdated: {
    general?: string;
    performance?: string;
    farming?: string;
    support?: string;
    objectives?: string;
    heroPerformance?: string;
  };
  /** Cache status */
  isCached: boolean;
  /** Sync status with external APIs */
  syncStatus: 'synced' | 'syncing' | 'error' | 'stale';
}

/**
 * Player statistics component props
 */
export interface PlayerStatsProps {
  /** Player identifier */
  playerId: string;
  /** View mode configuration */
  viewMode?: PlayerStatsViewMode;
  /** Initial filter configuration */
  initialFilter?: PlayerStatsFilter;
  /** Initial sort configuration */
  initialSort?: PlayerStatsSort;
  /** Comparison configuration (for comparison mode) */
  comparison?: PlayerComparison;
  /** Visualization preferences */
  visualization?: PlayerStatsVisualization;
  /** Component state */
  state?: PlayerStatsState;
  /** Event handlers */
  onPlayerSelect?: (playerId: string) => void;
  onFilterChange?: (filter: PlayerStatsFilter) => void;
  onSortChange?: (sort: PlayerStatsSort) => void;
  onExport?: (config: PlayerStatsExport) => void;
  onRefresh?: () => void;
  /** Custom styling */
  className?: string;
  /** Custom content sections */
  customSections?: Array<{
    id: string;
    title: string;
    content: ReactNode;
    position: 'before' | 'after';
    section: PlayerStatsCategory;
  }>;
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Player statistics list component props
 */
export interface PlayerStatsListProps {
  /** Array of player IDs to display */
  playerIds: string[];
  /** Default view mode */
  defaultViewMode?: PlayerStatsViewMode;
  /** Default filter */
  defaultFilter?: PlayerStatsFilter;
  /** Default sort */
  defaultSort?: PlayerStatsSort;
  /** Allow multi-selection for comparison */
  allowMultiSelect?: boolean;
  /** Selected players */
  selectedPlayers?: string[];
  /** Selection change handler */
  onSelectionChange?: (selectedPlayers: string[]) => void;
  /** Pagination configuration */
  pagination?: {
    enabled: boolean;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  /** Virtualization for large lists */
  virtualization?: {
    enabled: boolean;
    itemHeight: number;
    overscan?: number;
  };
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Container styling */
  containerClassName?: string;
}

/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
  /** Metric being analyzed */
  metric: string;
  /** Trend direction */
  direction: 'improving' | 'stable' | 'declining';
  /** Trend strength (0-1) */
  strength: number;
  /** Confidence level (0-1) */
  confidence: number;
  /** Time period for trend */
  period: {
    start: string;
    end: string;
  };
  /** Data points for trend line */
  dataPoints: Array<{
    date: string;
    value: number;
  }>;
  /** Statistical significance */
  significance: boolean;
  /** Recommendations based on trend */
  recommendations?: string[];
} 