'use client';

/**
 * Config Context Provider (Frontend)
 *
 * Storage/config abstraction for the frontend. Centralizes persistence and
 * prevents direct localStorage access elsewhere.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { Serializable, SharePayload } from '@/frontend/contexts/share-context';
import { useShareContext } from '@/frontend/contexts/share-context';
import type { AppConfig, ConfigContextProviderProps, ConfigContextValue } from '@/types/contexts/config-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import { getParsedData, isLocalStorageAvailable, setData } from '@/utils/storage';

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  CONFIG: 'dota-scout-assistant-config',
  TEAMS: 'dota-scout-assistant-teams',
  ACTIVE_TEAM: 'dota-scout-assistant-active-team',
  GLOBAL_MANUAL_MATCHES: 'dota-scout-assistant-global-manual-matches',
  GLOBAL_MANUAL_PLAYERS: 'dota-scout-assistant-global-manual-players',
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
    const sanitized = new Map<string, TeamData>();
    Object.entries(teamsData).forEach(([key, value]) => {
      const next: TeamData = { ...value };
      if (typeof (next as { isLoading?: boolean }).isLoading !== 'undefined') {
        (next as { isLoading?: boolean }).isLoading = false;
      }
      sanitized.set(key, next);
    });
    return sanitized;
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

// removed: config is now in-memory only

function toTeamsMapFromPayload(payload: SharePayload | null): Map<string, TeamData> {
  if (!payload || !payload.teams) return new Map();
  const entries: Array<[string, TeamData]> = [];
  Object.entries(payload.teams).forEach(([key, value]) => {
    if (isTeamDataLike(value)) {
      const next: TeamData = { ...(value as TeamData) };
      if (typeof (next as { isLoading?: boolean }).isLoading !== 'undefined') {
        (next as { isLoading?: boolean }).isLoading = false;
      }
      entries.push([key, next]);
    }
  });
  return new Map(entries);
}

function isTeamDataLike(value: Serializable | null | undefined): value is TeamData {
  if (!value) return false;
  const obj = value as Record<string, Serializable>;
  return (
    'team' in obj &&
    'league' in obj &&
    'timeAdded' in obj &&
    'matches' in obj &&
    'manualMatches' in obj &&
    'manualPlayers' in obj &&
    'players' in obj &&
    'performance' in obj
  );
}

// Note: coerceTeamsFromShare is now inlined into accessors to avoid unused warnings.

function useInitializeActiveTeam(
  isShareMode: boolean,
  payload: { activeTeam?: { teamId: number; leagueId: number } | null } | null,
  setActiveTeamState: (t: { teamId: number; leagueId: number } | null) => void,
  setIsLoading: (b: boolean) => void,
) {
  useEffect(() => {
    if (isShareMode) {
      setActiveTeamState(payload?.activeTeam ?? null);
      setIsLoading(false);
      return;
    }
    if (typeof window !== 'undefined') {
      const storedActiveTeam = loadFromStorage<{ teamId: number; leagueId: number } | null>(
        STORAGE_KEYS.ACTIVE_TEAM,
        null,
      );
      setActiveTeamState(storedActiveTeam);
      setIsLoading(false);
    }
  }, [isShareMode, payload, setActiveTeamState, setIsLoading]);
}

function useTeamAccessors(
  isShareMode: boolean,
  payload: SharePayload | null,
  setSharePayload: ((p: SharePayload) => void) | null,
) {
  const coercePayload = useCallback(
    (base: Partial<SharePayload> = {}): SharePayload => {
      const teams = (payload && (payload as SharePayload).teams) || {};
      const activeTeam =
        (payload as { activeTeam?: { teamId: number; leagueId: number } | null } | null)?.activeTeam || null;
      const globalManualMatches = (payload as { globalManualMatches?: number[] } | null)?.globalManualMatches || [];
      const globalManualPlayers = (payload as { globalManualPlayers?: number[] } | null)?.globalManualPlayers || [];
      return {
        teams,
        activeTeam,
        globalManualMatches,
        globalManualPlayers,
        ...base,
      };
    },
    [payload],
  );
  const getTeams = useCallback((): Map<string, TeamData> => {
    return isShareMode ? toTeamsMapFromPayload(payload) : loadTeamsFromStorage();
  }, [isShareMode, payload]);

  const setTeams = useCallback(
    (teams: Map<string, TeamData>) => {
      if (isShareMode) {
        // In share mode, persist to in-memory share payload only (no localStorage)
        if (!setSharePayload) return;
        const teamsObject = Object.fromEntries(teams) as Record<string, TeamData>;
        setTimeout(() => setSharePayload(coercePayload({ teams: teamsObject })), 0);
        return;
      }
      saveTeamsToStorage(teams);
    },
    [isShareMode, setSharePayload, coercePayload],
  );

  return { getTeams, setTeams };
}

function useGlobalManualAccessors(
  isShareMode: boolean,
  payload: {
    globalManualMatches?: number[];
    globalManualPlayers?: number[];
    teams?: Record<string, TeamData>;
    activeTeam?: { teamId: number; leagueId: number } | null;
  } | null,
  setSharePayload: ((p: SharePayload) => void) | null,
) {
  const coercePayload = useCallback(
    (base: Partial<SharePayload> = {}): SharePayload => {
      const teams = (payload && (payload as { teams?: Record<string, TeamData> }).teams) || {};
      const activeTeam =
        (payload as { activeTeam?: { teamId: number; leagueId: number } | null } | null)?.activeTeam || null;
      const globalManualMatches = (payload as { globalManualMatches?: number[] } | null)?.globalManualMatches || [];
      const globalManualPlayers = (payload as { globalManualPlayers?: number[] } | null)?.globalManualPlayers || [];
      return {
        teams,
        activeTeam,
        globalManualMatches,
        globalManualPlayers,
        ...base,
      };
    },
    [payload],
  );
  const getGlobalManualMatches = useCallback((): number[] => {
    return isShareMode
      ? (payload?.globalManualMatches ?? [])
      : loadFromStorage<number[]>(STORAGE_KEYS.GLOBAL_MANUAL_MATCHES, []);
  }, [isShareMode, payload]);

  const setGlobalManualMatches = useCallback(
    (ids: number[]) => {
      if (isShareMode) {
        if (!setSharePayload) return;
        setTimeout(() => setSharePayload(coercePayload({ globalManualMatches: ids })), 0);
        return;
      }
      saveToStorage(STORAGE_KEYS.GLOBAL_MANUAL_MATCHES, ids);
    },
    [isShareMode, setSharePayload, coercePayload],
  );

  const getGlobalManualPlayers = useCallback((): number[] => {
    return isShareMode
      ? (payload?.globalManualPlayers ?? [])
      : loadFromStorage<number[]>(STORAGE_KEYS.GLOBAL_MANUAL_PLAYERS, []);
  }, [isShareMode, payload]);

  const setGlobalManualPlayers = useCallback(
    (ids: number[]) => {
      if (isShareMode) {
        if (!setSharePayload) return;
        setTimeout(() => setSharePayload(coercePayload({ globalManualPlayers: ids })), 0);
        return;
      }
      saveToStorage(STORAGE_KEYS.GLOBAL_MANUAL_PLAYERS, ids);
    },
    [isShareMode, setSharePayload, coercePayload],
  );

  return { getGlobalManualMatches, setGlobalManualMatches, getGlobalManualPlayers, setGlobalManualPlayers };
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

export function ConfigProvider({ children }: ConfigContextProviderProps) {
  const [config, setConfig] = useState<AppConfig>(() => getDefaultConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTeam, setActiveTeamState] = useState<{ teamId: number; leagueId: number } | null>(null);

  const { isShareMode, payload, setPayload } = useShareContext();

  useInitializeActiveTeam(isShareMode, payload, setActiveTeamState, setIsLoading);

  const { getTeams, setTeams } = useTeamAccessors(isShareMode, (payload as SharePayload) || null, setPayload);

  const setActiveTeam = useCallback(
    (newActiveTeam: { teamId: number; leagueId: number } | null) => {
      setActiveTeamState(newActiveTeam);
      if (isShareMode) {
        if (setPayload) {
          const teams = (payload && (payload as { teams?: Record<string, TeamData> }).teams) || {};
          const globalManualMatches = (payload as { globalManualMatches?: number[] } | null)?.globalManualMatches || [];
          const globalManualPlayers = (payload as { globalManualPlayers?: number[] } | null)?.globalManualPlayers || [];
          setTimeout(
            () => setPayload({ teams, activeTeam: newActiveTeam, globalManualMatches, globalManualPlayers }),
            0,
          );
        }
      } else {
        saveToStorage(STORAGE_KEYS.ACTIVE_TEAM, newActiveTeam);
      }
    },
    [isShareMode, payload, setPayload],
  );

  const { getGlobalManualMatches, setGlobalManualMatches, getGlobalManualPlayers, setGlobalManualPlayers } =
    useGlobalManualAccessors(
      isShareMode,
      payload as SharePayload as { globalManualMatches?: number[]; globalManualPlayers?: number[] },
      setPayload,
    );

  // Keep config purely in-memory
  useEffect(() => {
    setConfig((prev) => ({ ...prev }));
    setIsLoading(false);
  }, []);

  const updateConfig = useUpdateConfig(config, setConfig, setIsSaving, setError);
  const resetConfig = useResetConfig(setConfig, setIsSaving, setError);
  const clearErrors = useClearErrors(setError);

  const contextValue: ConfigContextValue = {
    config,
    getTeams,
    setTeams,
    activeTeam,
    setActiveTeam,
    getGlobalManualMatches,
    setGlobalManualMatches,
    getGlobalManualPlayers,
    setGlobalManualPlayers,
    isLoading,
    isSaving,
    error,
    updateConfig,
    resetConfig,
    clearErrors,
  };

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>;
}

export const useConfigContext = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
};
