/**
 * Config context value types
 * 
 * Defines the structure for application configuration and user preferences
 * in the frontend application.
 */

// ============================================================================
// CONFIG DATA TYPES
// ============================================================================

/**
 * Theme configuration
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Preferred external site for links
 */
export type PreferredExternalSite = 'opendota' | 'dotabuff' | 'stratz' | 'dota2protracker';

/**
 * UI density preference
 */
export type UIDensity = 'compact' | 'comfortable' | 'spacious';

/**
 * Application configuration interface
 */
export interface AppConfig {
  // Theme and appearance
  theme: Theme;
  uiDensity: UIDensity;
  
  // External site preferences
  preferredExternalSite: PreferredExternalSite;
  
  // Data and refresh settings
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  cacheEnabled: boolean;
  cacheTTL: number; // in seconds
  
  // UI preferences
  sidebarCollapsed: boolean;
  showAdvancedStats: boolean;
  showPerformanceGraphs: boolean;
  showTrends: boolean;
  
  // Notification settings
  notifications: {
    matchUpdates: boolean;
    teamUpdates: boolean;
    errorAlerts: boolean;
  };
  
  // Development settings
  debugMode: boolean;
  mockMode: boolean;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  // Page-specific preferences
  dashboard: DashboardPreferences;
  teamManagement: TeamManagementPreferences;
  matchHistory: MatchHistoryPreferences;
  playerStats: PlayerStatsPreferences;
  draftSuggestions: DraftSuggestionsPreferences;
  teamAnalysis: TeamAnalysisPreferences;
}

/**
 * Dashboard preferences
 */
export interface DashboardPreferences {
  defaultView: 'overview' | 'recent' | 'highlights' | 'quickActions';
  showPerformanceHighlights: boolean;
  showRecentMatches: boolean;
  showQuickActions: boolean;
  autoRefresh: boolean;
}

/**
 * Team management preferences
 */
export interface TeamManagementPreferences {
  defaultView: 'list' | 'grid' | 'details';
  showArchivedTeams: boolean;
  sortBy: 'name' | 'lastMatch' | 'winRate' | 'createdAt';
  sortDirection: 'asc' | 'desc';
}

/**
 * Match history preferences
 */
export interface MatchHistoryPreferences {
  defaultView: 'list' | 'grid' | 'timeline';
  showHiddenMatches: boolean;
  defaultFilters: {
    dateRange: number; // days
    result: 'all' | 'win' | 'loss';
    heroes: string[];
  };
  sortBy: 'date' | 'result' | 'duration' | 'opponent';
  sortDirection: 'asc' | 'desc';
}

/**
 * Player stats preferences
 */
export interface PlayerStatsPreferences {
  defaultView: 'overview' | 'matches' | 'heroes' | 'trends';
  showAdvancedStats: boolean;
  showPerformanceGraphs: boolean;
  defaultFilters: {
    dateRange: number; // days
    heroes: string[];
    roles: string[];
  };
}

/**
 * Draft suggestions preferences
 */
export interface DraftSuggestionsPreferences {
  defaultView: 'suggestions' | 'counters' | 'synergies' | 'meta';
  showHeroIcons: boolean;
  showWinRates: boolean;
  showPickRates: boolean;
  includeBans: boolean;
  maxSuggestions: number;
}

/**
 * Team analysis preferences
 */
export interface TeamAnalysisPreferences {
  defaultView: 'overview' | 'performance' | 'trends' | 'comparison';
  showAdvancedMetrics: boolean;
  showTrends: boolean;
  showComparisons: boolean;
  defaultTimeRange: number; // days
}

// ============================================================================
// CONFIG CONTEXT STATE
// ============================================================================

/**
 * Config context value interface
 */
export interface ConfigContextValue {
  // Configuration data
  config: AppConfig;
  preferences: UserPreferences;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetConfig: () => Promise<void>;
  resetPreferences: () => Promise<void>;
  clearErrors: () => void;
}

/**
 * Config context provider props
 */
export interface ConfigContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONFIG DATA TYPES
// ============================================================================

/**
 * Config loading state
 */
export interface ConfigLoadingState {
  isLoading: boolean;
  isSaving: boolean;
  lastUpdated: string | null;
  error: string | null;
}

/**
 * Config validation interface
 */
export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Config migration interface
 */
export interface ConfigMigration {
  fromVersion: string;
  toVersion: string;
  changes: ConfigChange[];
}

/**
 * Config change interface
 */
export interface ConfigChange {
  path: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  type: 'added' | 'removed' | 'modified';
} 