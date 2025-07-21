/**
 * Config context value types
 * 
 * Defines the structure for application configuration and user preferences
 * in the frontend application.
 */

import type { TeamData } from '@/types/contexts/team-context-value';

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
export type PreferredExternalSite = 'opendota' | 'dotabuff';

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
  
  // UI preferences
  sidebarCollapsed: boolean;
}

/**
 * View preferences interface
 */
export interface ViewPreferences {
  // Match history view preferences
  matchHistoryList: 'list' | 'card' | 'grid';
  matchHistoryDetails: 'draft-events' | 'detailed' | 'minimal' | 'summary';
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
  viewPreferences: ViewPreferences;

  // Team data (persistent)
  teamList: TeamData[];
  setTeamList: (teamList: TeamData[] | ((prev: TeamData[]) => TeamData[])) => void;
  activeTeam: { teamId: string; leagueId: string } | null;
  setActiveTeam: (activeTeam: { teamId: string; leagueId: string } | null) => void;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Error states
  error: string | null;

  // Actions
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  updateViewPreferences: (updates: Partial<ViewPreferences>) => Promise<void>;
  resetConfig: () => Promise<void>;
  resetViewPreferences: () => Promise<void>;
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
 * Config change interface
 */
export interface ConfigChange {
  path: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  type: 'added' | 'removed' | 'modified';
} 