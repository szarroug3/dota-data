'use client';

/**
 * AppData Context
 *
 * Provides the AppData instance to all components via React Context.
 * Teams Map is stored in React state for automatic re-renders.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { AppData } from '@/frontend/lib/app-data/app-data';
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

// ============================================================================
// PROVIDER
// ============================================================================

export interface AppDataProviderProps {
  children: React.ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  // Create a single AppData instance
  const [appData] = useState(() => new AppData());

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
