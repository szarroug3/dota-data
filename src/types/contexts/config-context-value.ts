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
 * Preferred external site for links
 */
export type PreferredExternalSite = 'opendota' | 'dotabuff';

/**
 * Preferred matchlist view mode
 */
export type PreferredMatchlistView = 'list' | 'card' | 'grid';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Application configuration interface
 */
export interface AppConfig {
  preferredExternalSite: PreferredExternalSite;
  preferredMatchlistView: PreferredMatchlistView;
  theme: Theme;
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

  // Team data (persistent) - now stored as Map for consistency
  getTeams: () => Map<string, TeamData>;
  setTeams: (teams: Map<string, TeamData>) => void;
  activeTeam: { teamId: number; leagueId: number } | null;
  setActiveTeam: (activeTeam: { teamId: number; leagueId: number } | null) => void;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Error states
  error: string | null;

  // Actions
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
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