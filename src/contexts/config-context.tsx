"use client";

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
} from '@/types/contexts/config-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import { getParsedData, isLocalStorageAvailable, setData } from '@/utils/storage';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

const STORAGE_KEYS = {
  CONFIG: 'dota-scout-assistant-config',
  TEAMS: 'dota-scout-assistant-teams',
  ACTIVE_TEAM: 'dota-scout-assistant-active-team'
} as const;

// Helper function to load data from localStorage with proper typing
function loadFromStorage<T>(key: string, defaultValue: T): T {
  // Only access localStorage on the client side
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }
  
  const stored = getParsedData<T>(key);
  return stored ?? defaultValue;
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  // Only access localStorage on the client side
  if (typeof window === 'undefined') {
    return;
  }
  
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  const success = setData(key, value);
  if (!success) {
    console.warn(`Failed to save ${key} to localStorage`);
  }
}

// Helper function to load teams Map from localStorage
function loadTeamsFromStorage(): Map<string, TeamData> {
  if (typeof window === 'undefined') {
    return new Map();
  }
  
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    return new Map();
  }
  
  const teamsData = getParsedData<{ [key: string]: TeamData }>(STORAGE_KEYS.TEAMS);
  if (teamsData) {
    return new Map(Object.entries(teamsData));
  }
  return new Map();
}

// Helper function to save teams Map to localStorage
function saveTeamsToStorage(teams: Map<string, TeamData>): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  const teamsObject = Object.fromEntries(teams);
  
  const success = setData(STORAGE_KEYS.TEAMS, teamsObject);
  if (!success) {
    console.warn('Failed to save teams to localStorage');
  }
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const getDefaultConfig = (): AppConfig => ({
  preferredExternalSite: 'dotabuff',
  preferredMatchlistView: 'list',
  theme: 'system',
});

// ============================================================================
// CONFIG CONTEXT PROVIDER
// ============================================================================

// Custom hook to load config from localStorage
function useLoadConfig(setConfig: (c: AppConfig) => void, setIsLoading: (b: boolean) => void) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConfig = loadFromStorage(STORAGE_KEYS.CONFIG, getDefaultConfig());
      if (JSON.stringify(storedConfig) !== JSON.stringify(getDefaultConfig())) {
        setConfig(storedConfig);
      }
      setIsLoading(false);
    }
  }, [setConfig, setIsLoading]);
}

function useUpdateConfig(config: AppConfig, setConfig: (c: AppConfig) => void, setIsSaving: (b: boolean) => void, setError: (e: string | null) => void) {
  return useCallback(async (updates: Partial<AppConfig>): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);
      saveToStorage(STORAGE_KEYS.CONFIG, newConfig);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      setError('Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  }, [config, setConfig, setIsSaving, setError]);
}

function useResetConfig(setConfig: (c: AppConfig) => void, setIsSaving: (b: boolean) => void, setError: (e: string | null) => void) {
  return useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const defaultConfig = getDefaultConfig();
      setConfig(defaultConfig);
      saveToStorage(STORAGE_KEYS.CONFIG, defaultConfig);
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      setError('Failed to reset configuration');
    } finally {
      setIsSaving(false);
    }
  }, [setConfig, setIsSaving, setError]);
}

function useClearErrors(setError: (e: string | null) => void) {
  return useCallback(() => {
    setError(null);
  }, [setError]);
}

export const ConfigProvider: React.FC<ConfigContextProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(getDefaultConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active team state (persistent) - initialize with defaults, load from localStorage in useEffect
  const [activeTeam, setActiveTeamState] = useState<{ teamId: number; leagueId: number } | null>(null);

  // Load active team from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedActiveTeam = loadFromStorage<{ teamId: number; leagueId: number } | null>(STORAGE_KEYS.ACTIVE_TEAM, null);
      setActiveTeamState(storedActiveTeam);
    }
  }, []);

  // Get teams directly from localStorage
  const getTeams = useCallback((): Map<string, TeamData> => {
    return loadTeamsFromStorage();
  }, []);

  // Sync teams to localStorage
  const setTeams = useCallback((teams: Map<string, TeamData>) => {
    saveTeamsToStorage(teams);
  }, []);

  // Sync activeTeam to localStorage
  const setActiveTeam = useCallback((newActiveTeam: { teamId: number; leagueId: number } | null) => {
    setActiveTeamState(newActiveTeam);
    saveToStorage(STORAGE_KEYS.ACTIVE_TEAM, newActiveTeam);
  }, []);

  // Load config from localStorage
  useLoadConfig(setConfig, setIsLoading);

  const updateConfig = useUpdateConfig(config, setConfig, setIsSaving, setError);
  const resetConfig = useResetConfig(setConfig, setIsSaving, setError);
  const clearErrors = useClearErrors(setError);

  const contextValue: ConfigContextValue = {
    config,
    getTeams,
    setTeams,
    activeTeam,
    setActiveTeam,
    isLoading,
    isSaving,
    error,
    updateConfig,
    resetConfig,
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