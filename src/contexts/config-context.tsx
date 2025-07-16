/**
 * Config Context Provider
 *
 * Manages application configuration, user preferences, and settings persistence.
 * Provides centralized configuration management for the entire application.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type {
  AppConfig,
  ConfigContextProviderProps,
  ConfigContextValue,
  UserPreferences
} from '@/types/contexts/config-context-value';
import type { TeamData } from '@/types/contexts/team-types';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

const STORAGE_KEYS = {
  CONFIG: 'dota-scout-assistant-config',
  PREFERENCES: 'dota-scout-assistant-preferences',
  TEAM_LIST: 'dota-scout-assistant-team-list',
  ACTIVE_TEAM: 'dota-scout-assistant-active-team'
} as const;

// Helper function to load data from localStorage with proper typing
function loadFromStorage<T>(key: string, defaultValue: T): T {
  // Only access localStorage on the client side
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
  }
  return defaultValue;
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  // Only access localStorage on the client side
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
    throw error; // Re-throw to allow error handling in the component
  }
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const getDefaultConfig = (): AppConfig => ({
  theme: 'system',
  uiDensity: 'comfortable',
  preferredExternalSite: 'dotabuff',
  autoRefresh: true,
  refreshInterval: 300,
  cacheEnabled: true,
  cacheTTL: 3600,
  sidebarCollapsed: false,
  showAdvancedStats: false,
  showPerformanceGraphs: true,
  showTrends: true,
  notifications: {
    matchUpdates: true,
    teamUpdates: true,
    errorAlerts: true
  },
  debugMode: false,
  mockMode: false
});

const getDefaultPreferences = (): UserPreferences => ({
  dashboard: {
    defaultView: 'overview',
    showPerformanceHighlights: true,
    showRecentMatches: true,
    showQuickActions: true,
    autoRefresh: true
  },
  teamManagement: {
    defaultView: 'list',
    showArchivedTeams: false,
    sortBy: 'name',
    sortDirection: 'asc'
  },
  matchHistory: {
    defaultView: 'list',
    showHiddenMatches: false,
    defaultFilters: {
      dateRange: 30,
      result: 'all',
      heroes: []
    },
    sortBy: 'date',
    sortDirection: 'desc'
  },
  playerStats: {
    defaultView: 'overview',
    showAdvancedStats: false,
    showPerformanceGraphs: true,
    defaultFilters: {
      dateRange: 30,
      heroes: [],
      roles: []
    }
  },
  draftSuggestions: {
    defaultView: 'suggestions',
    showHeroIcons: true,
    showWinRates: true,
    showPickRates: true,
    includeBans: true,
    maxSuggestions: 5
  },
  teamAnalysis: {
    defaultView: 'overview',
    showAdvancedMetrics: false,
    showTrends: true,
    showComparisons: true,
    defaultTimeRange: 30
  }
});

// ============================================================================
// CONFIG CONTEXT PROVIDER
// ============================================================================

export const ConfigProvider: React.FC<ConfigContextProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(getDefaultConfig());
  const [preferences, setPreferences] = useState<UserPreferences>(getDefaultPreferences());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Team list and active team state (persistent)
  const [teamList, setTeamListState] = useState<TeamData[]>(() => loadFromStorage<TeamData[]>(STORAGE_KEYS.TEAM_LIST, []));
  const [activeTeam, setActiveTeamState] = useState<{ teamId: string; leagueId: string } | null>(() => loadFromStorage<{ teamId: string; leagueId: string } | null>(STORAGE_KEYS.ACTIVE_TEAM, null));

  // Sync teamList to localStorage
  const setTeamList = useCallback((newTeamList: TeamData[]) => {
    setTeamListState(newTeamList);
    saveToStorage(STORAGE_KEYS.TEAM_LIST, newTeamList);
  }, []);

  // Sync activeTeam to localStorage
  const setActiveTeam = useCallback((newActiveTeam: { teamId: string; leagueId: string } | null) => {
    setActiveTeamState(newActiveTeam);
    saveToStorage(STORAGE_KEYS.ACTIVE_TEAM, newActiveTeam);
  }, []);

  // Load localStorage values on the client side after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConfig = loadFromStorage(STORAGE_KEYS.CONFIG, getDefaultConfig());
      const storedPreferences = loadFromStorage(STORAGE_KEYS.PREFERENCES, getDefaultPreferences());
      console.log('storedConfig', storedConfig);
      console.log('storedPreferences', storedPreferences);
      
      // Only update if values are different from defaults to prevent unnecessary re-renders
      if (JSON.stringify(storedConfig) !== JSON.stringify(getDefaultConfig())) {
        setConfig(storedConfig);
      }
      if (JSON.stringify(storedPreferences) !== JSON.stringify(getDefaultPreferences())) {
        setPreferences(storedPreferences);
      }
      
      // Mark as loaded
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<AppConfig>): Promise<void> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.CONFIG, newConfig);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      setError('Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<void> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.PREFERENCES, newPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  const resetConfig = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const defaultConfig = getDefaultConfig();
      setConfig(defaultConfig);
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.CONFIG, defaultConfig);
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      setError('Failed to reset configuration');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const resetPreferences = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const defaultPreferences = getDefaultPreferences();
      setPreferences(defaultPreferences);
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.PREFERENCES, defaultPreferences);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      setError('Failed to reset preferences');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearErrors = useCallback((): void => {
    setError(null);
  }, []);

  const contextValue: ConfigContextValue = {
    config,
    preferences,
    teamList,
    setTeamList,
    activeTeam,
    setActiveTeam,
    isLoading,
    isSaving,
    error,
    updateConfig,
    updatePreferences,
    resetConfig,
    resetPreferences,
    clearErrors
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useConfigContext = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  
  if (context === undefined) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  
  return context;
}; 