'use client';

/**
 * AppData Context
 *
 * Provides the AppData instance to all components via React Context.
 * Teams Map is stored in React state for automatic re-renders.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { SharePayload } from '@/frontend/contexts/share-context';
import { useShareContext } from '@/frontend/contexts/share-context';
import { AppData } from '@/frontend/lib/app-data/app-data';
import { refreshTeamsCachedMetadata } from '@/frontend/lib/app-data/app-data-metadata-helpers';
import { GLOBAL_TEAM_KEY } from '@/frontend/lib/app-data/app-data-types';
import type { Match, Player, Team } from '@/frontend/lib/app-data/app-data-types';

// ============================================================================
// CONTEXT
// ============================================================================

interface AppDataContextValue {
  appData: AppData;
  teams: Map<string, Team>;
  matches: Map<number, Match>;
  players: Map<number, Player>;
  setTeams: React.Dispatch<React.SetStateAction<Map<string, Team>>>;
  setMatches: React.Dispatch<React.SetStateAction<Map<number, Match>>>;
  setPlayers: React.Dispatch<React.SetStateAction<Map<number, Player>>>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);
type RefreshTarget = { teamKey: string; teamId: number; leagueId: number };

async function loadReferenceData(appData: AppData): Promise<void> {
  try {
    await Promise.all([appData.loadHeroesData(), appData.loadItemsData(), appData.loadLeaguesData()]);
    refreshTeamsCachedMetadata(appData);
  } catch (error) {
    console.error('Failed to load reference data:', error);
  }
}

async function loadTeamMatchesAndPlayers(appData: AppData, teamKey: string, force = false): Promise<void> {
  try {
    await appData.loadTeamMatches(teamKey, force);
  } catch (error) {
    console.error(`Failed to load matches and players for team ${teamKey}:`, error);
  }
}

async function refreshActiveTeam(appData: AppData, activeTeam: RefreshTarget): Promise<void> {
  try {
    await appData.refreshTeam(activeTeam.teamId, activeTeam.leagueId);
    await loadTeamMatchesAndPlayers(appData, activeTeam.teamKey, true);
  } catch (error) {
    console.error(`Failed to fully refresh active team ${activeTeam.teamKey}:`, error);
  }
}

async function refreshInactiveTeams(appData: AppData, inactiveTeams: RefreshTarget[]): Promise<void> {
  for (const { teamKey, teamId, leagueId } of inactiveTeams) {
    try {
      await appData.refreshTeam(teamId, leagueId);
      await loadTeamMatchesAndPlayers(appData, teamKey);
    } catch (error) {
      console.error(`Failed to refresh inactive team ${teamKey}:`, error);
    }
  }
}

async function refreshGlobalTeam(appData: AppData): Promise<void> {
  const globalTeam = appData.getTeam(GLOBAL_TEAM_KEY);
  if (!globalTeam) {
    return;
  }

  await loadTeamMatchesAndPlayers(appData, globalTeam.id, true);
}

async function hydrateManualPlayers(appData: AppData): Promise<void> {
  try {
    await appData.loadAllManualPlayers();
  } catch (error) {
    console.error('Failed to hydrate manual players:', error);
  }
}

async function initializeAppData({
  appData,
  isShareMode,
  payload,
  setIsInitialized,
}: {
  appData: AppData;
  isShareMode: boolean;
  payload: SharePayload | null;
  setIsInitialized: (value: boolean) => void;
}): Promise<void> {
  try {
    const { activeTeam, otherTeams } =
      isShareMode && payload
        ? await appData.loadFromSharePayload({
            teams: payload.teams,
            activeTeam: payload.activeTeam ?? null,
          })
        : await appData.loadFromStorage();

    setIsInitialized(true);

    await loadReferenceData(appData);

    if (activeTeam) {
      await refreshActiveTeam(appData, activeTeam);
    }

    const inactiveTeams = otherTeams.filter(({ teamKey }) => teamKey !== activeTeam?.teamKey);
    if (inactiveTeams.length > 0) {
      await refreshInactiveTeams(appData, inactiveTeams);
    }

    await refreshGlobalTeam(appData);
    await hydrateManualPlayers(appData);
  } catch (error) {
    console.error('Failed to initialize app data:', error);
    setIsInitialized(true);
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

export interface AppDataProviderProps {
  children: React.ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  // Create a single AppData instance
  const [appData] = useState(() => new AppData());
  const [isInitialized, setIsInitialized] = useState(false);
  const { isShareMode, payload } = useShareContext();

  // Store teams, matches, and players in React state for reactivity
  const [teams, setTeams] = useState<Map<string, Team>>(new Map());
  const [matches, setMatches] = useState<Map<number, Match>>(new Map());
  const [players, setPlayers] = useState<Map<number, Player>>(new Map());

  // Wire up AppData to use React state setters
  useEffect(() => {
    appData.setTeamsStateFn(setTeams);
    appData.setMatchesStateFn(setMatches);
    appData.setPlayersStateFn(setPlayers);
  }, [appData]);

  // Initialize app data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialized) return;
    if (isShareMode && !payload) {
      return;
    }
    initializeAppData({ appData, isShareMode, payload, setIsInitialized });
  }, [appData, isInitialized, isShareMode, payload]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: AppDataContextValue = useMemo(
    () => ({
      appData,
      teams,
      matches,
      players,
      setTeams,
      setMatches,
      setPlayers,
    }),
    [appData, teams, matches, players, setTeams, setMatches, setPlayers],
  );

  // Show loading state while initializing
  if (!isInitialized) {
    return null;
  }

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the full AppData context (including reactive state)
 *
 * @throws Error if used outside AppDataProvider
 */
export const useAppDataContext = (): AppDataContextValue => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppDataContext must be used within AppDataProvider');
  }

  return context;
};

/**
 * Hook to access AppData from any component
 *
 * Returns the AppData instance which has access to the reactive Maps
 * stored in React state. Components automatically re-render when
 * teams or matches change because they're stored in React state.
 *
 * @throws Error if used outside AppDataProvider
 */
export const useAppData = (): AppData => {
  const context = useAppDataContext();

  // The appData instance has getters that return the reactive Maps from context
  // Components that use appData.teams or appData.matches in dependencies
  // will automatically re-render when those Maps change
  return context.appData;
};
