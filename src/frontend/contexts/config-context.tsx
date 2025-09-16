'use client';

/**
 * Config Context Provider (Frontend)
 *
 * Storage/config abstraction for the frontend. Centralizes persistence and
 * prevents direct localStorage access elsewhere.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { AppConfig, ConfigContextProviderProps, ConfigContextValue } from '@/types/contexts/config-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import { getParsedData, isLocalStorageAvailable, setData } from '@/utils/storage';

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  CONFIG: 'dota-scout-assistant-config',
  TEAMS: 'dota-scout-assistant-teams',
  ACTIVE_TEAM: 'dota-scout-assistant-active-team',
} as const;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  if (!isLocalStorageAvailable()) return defaultValue;
  const stored = getParsedData<T>(key);
  return stored ?? defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  if (!isLocalStorageAvailable()) return;
  const success = setData(key, value);
  if (!success) {
    console.warn(`Failed to save ${key} to localStorage`);
  }
}

function loadTeamsFromStorage(): Map<string, TeamData> {
  if (typeof window === 'undefined') return new Map();
  if (!isLocalStorageAvailable()) return new Map();
  const teamsData = getParsedData<{ [key: string]: TeamData }>(STORAGE_KEYS.TEAMS);
  if (teamsData) {
    return new Map(Object.entries(teamsData));
  }
  return new Map();
}

function saveTeamsToStorage(teams: Map<string, TeamData>): void {
  if (typeof window === 'undefined') return;
  if (!isLocalStorageAvailable()) return;
  const teamsObject = Object.fromEntries(teams);
  const success = setData(STORAGE_KEYS.TEAMS, teamsObject);
  if (!success) {
    console.warn('Failed to save teams to localStorage');
  }
}

const getDefaultConfig = (): AppConfig => ({
  preferredExternalSite: 'dotabuff',
  preferredMatchlistView: 'list',
  preferredPlayerlistView: 'list',
  theme: 'system',
});

function useLoadConfig(setConfig: (c: AppConfig) => void, setIsLoading: (b: boolean) => void) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConfig = loadFromStorage(STORAGE_KEYS.CONFIG, getDefaultConfig());
      const mergedConfig: AppConfig = { ...getDefaultConfig(), ...storedConfig };
      setConfig(mergedConfig);
      setIsLoading(false);
    }
  }, [setConfig, setIsLoading]);
}

function useUpdateConfig(
  config: AppConfig,
  setConfig: (c: AppConfig) => void,
  setIsSaving: (b: boolean) => void,
  setError: (e: string | null) => void,
) {
  return useCallback(
    async (updates: Partial<AppConfig>): Promise<void> => {
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
    },
    [config, setConfig, setIsSaving, setError],
  );
}

function useResetConfig(
  setConfig: (c: AppConfig) => void,
  setIsSaving: (b: boolean) => void,
  setError: (e: string | null) => void,
) {
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
  const [config, setConfig] = useState<AppConfig>(() => loadFromStorage(STORAGE_KEYS.CONFIG, getDefaultConfig()));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTeam, setActiveTeamState] = useState<{ teamId: number; leagueId: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedActiveTeam = loadFromStorage<{ teamId: number; leagueId: number } | null>(
        STORAGE_KEYS.ACTIVE_TEAM,
        null,
      );
      setActiveTeamState(storedActiveTeam);
    }
  }, []);

  const getTeams = useCallback((): Map<string, TeamData> => {
    return loadTeamsFromStorage();
  }, []);

  const setTeams = useCallback((teams: Map<string, TeamData>) => {
    saveTeamsToStorage(teams);
  }, []);

  const setActiveTeam = useCallback((newActiveTeam: { teamId: number; leagueId: number } | null) => {
    setActiveTeamState(newActiveTeam);
    saveToStorage(STORAGE_KEYS.ACTIVE_TEAM, newActiveTeam);
  }, []);

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
    clearErrors,
  };

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>;
};

export const useConfigContext = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
};
