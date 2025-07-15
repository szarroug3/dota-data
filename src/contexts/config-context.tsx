/**
 * Config Context Provider
 *
 * Manages application configuration, user preferences, and settings persistence.
 * Provides centralized configuration management for the entire application.
 */

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import type {
  AppConfig,
  ConfigContextProviderProps,
  ConfigContextValue,
  UserPreferences
} from '@/types/contexts/config-context-value';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// ============================================================================
// STATE TYPES
// ============================================================================

interface ConfigState {
  // Configuration data
  config: AppConfig;
  preferences: UserPreferences;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Error states
  error: string | null;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

type ConfigAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_CONFIG' }
  | { type: 'RESET_PREFERENCES' };

// ============================================================================
// REDUCER
// ============================================================================

const handleLoadingStates = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    default:
      return state;
  }
};

const handleConfigActions = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'RESET_CONFIG':
      return { ...state, config: getDefaultConfig() };
    default:
      return state;
  }
};

const handlePreferencesActions = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'UPDATE_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    case 'RESET_PREFERENCES':
      return { ...state, preferences: getDefaultPreferences() };
    default:
      return state;
  }
};

const handleErrorActions = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERRORS':
      return { ...state, error: null };
    default:
      return state;
  }
};

const configReducer = (state: ConfigState, action: ConfigAction): ConfigState => {
  const loadingResult = handleLoadingStates(state, action);
  if (loadingResult !== state) return loadingResult;

  const configResult = handleConfigActions(state, action);
  if (configResult !== state) return configResult;

  const preferencesResult = handlePreferencesActions(state, action);
  if (preferencesResult !== state) return preferencesResult;

  const errorResult = handleErrorActions(state, action);
  if (errorResult !== state) return errorResult;

  return state;
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const getDefaultConfig = (): AppConfig => ({
  // Theme and appearance
  theme: 'system',
  uiDensity: 'comfortable',
  
  // External site preferences
  preferredExternalSite: 'opendota',
  
  // Data and refresh settings
  autoRefresh: true,
  refreshInterval: 300, // 5 minutes
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour
  
  // UI preferences
  sidebarCollapsed: true, // Start collapsed by default
  showAdvancedStats: false,
  showPerformanceGraphs: true,
  showTrends: true,
  
  // Notification settings
  notifications: {
    matchUpdates: true,
    teamUpdates: true,
    errorAlerts: true
  },
  
  // Development settings
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
// INITIAL STATE
// ============================================================================

// Note: Initial state is now created dynamically in the provider
// to load localStorage values synchronously

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

const STORAGE_KEYS = {
  CONFIG: 'dota-scout-assistant-config',
  PREFERENCES: 'dota-scout-assistant-preferences'
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
// CONFIG CONTEXT PROVIDER
// ============================================================================

export const ConfigProvider: React.FC<ConfigContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(configReducer, {
    config: getDefaultConfig(),
    preferences: getDefaultPreferences(),
    isLoading: true, // Start with loading true
    isSaving: false,
    error: null
  });

  // Load localStorage values on the client side after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConfig = loadFromStorage(STORAGE_KEYS.CONFIG, getDefaultConfig());
      const storedPreferences = loadFromStorage(STORAGE_KEYS.PREFERENCES, getDefaultPreferences());
      
      // Only update if values are different from defaults to prevent unnecessary re-renders
      if (JSON.stringify(storedConfig) !== JSON.stringify(getDefaultConfig())) {
        dispatch({ type: 'SET_CONFIG', payload: storedConfig });
      }
      if (JSON.stringify(storedPreferences) !== JSON.stringify(getDefaultPreferences())) {
        dispatch({ type: 'SET_PREFERENCES', payload: storedPreferences });
      }
      
      // Mark as loaded
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Note: localStorage saving is now handled explicitly in update functions
  // to properly handle errors and provide better error feedback

  const updateConfig = useCallback(async (updates: Partial<AppConfig>): Promise<void> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'CLEAR_ERRORS' });
    
    try {
      dispatch({ type: 'UPDATE_CONFIG', payload: updates });
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.CONFIG, { ...state.config, ...updates });
    } catch (error) {
      console.error('Failed to update configuration:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update configuration' });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.config]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<void> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'CLEAR_ERRORS' });
    
    try {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: updates });
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.PREFERENCES, { ...state.preferences, ...updates });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.preferences]);

  const resetConfig = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'CLEAR_ERRORS' });
    
    try {
      const defaultConfig = getDefaultConfig();
      dispatch({ type: 'RESET_CONFIG' });
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.CONFIG, defaultConfig);
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset configuration' });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, []);

  const resetPreferences = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'CLEAR_ERRORS' });
    
    try {
      const defaultPreferences = getDefaultPreferences();
      dispatch({ type: 'RESET_PREFERENCES' });
      // Save to localStorage after updating state
      saveToStorage(STORAGE_KEYS.PREFERENCES, defaultPreferences);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset preferences' });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, []);

  const clearErrors = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const contextValue: ConfigContextValue = {
    config: state.config,
    preferences: state.preferences,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
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