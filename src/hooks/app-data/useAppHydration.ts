import { useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { refreshTeamsCachedMetadata } from '@/frontend/lib/app-data/app-data-metadata-helpers';

import { useAppData } from './use-app-data';

/**
 * Hook for app-wide data hydration
 */
export function useAppHydration() {
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasHydratedRef = useRef(false);
  const ensuredActiveTeamKeyRef = useRef<string | null>(null);

  const configContext = useConfigContext();
  const appData = useAppData();

  const contextsRef = useRef({ configContext, appData });
  contextsRef.current = { configContext, appData };

  useEffect(() => {
    if (hasHydratedRef.current) return;

    const { configContext: currentConfig, appData: currentAppData } = contextsRef.current;

    hydrateAppData({
      configContext: currentConfig,
      appData: currentAppData,
      ensuredActiveTeamKeyRef,
      hasHydratedRef,
      setHasHydrated,
      setHydrationError,
    });
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const active = contextsRef.current.configContext.activeTeam;
    if (!active) return;
    const key = `${active.teamId}-${active.leagueId}`;
    if (ensuredActiveTeamKeyRef.current !== key) {
      const existingTeam = contextsRef.current.appData.getTeam(key);
      if (existingTeam) {
        contextsRef.current.appData.setSelectedTeam(key);
        ensuredActiveTeamKeyRef.current = key;
        return;
      }

      contextsRef.current.appData
        .loadTeam(active.teamId, active.leagueId)
        .then(() => {
          ensuredActiveTeamKeyRef.current = key;
        })
        .catch((error) => {
          console.error(`Hydration: failed to load active team ${key}`, error);
          setHydrationError(error instanceof Error ? error.message : 'Hydration failed');
        });
    }
  }, [contextsRef.current.configContext.activeTeam]);

  return {
    hydrationError,
    hasHydrated,
  };
}

async function fetchConstantsIfNeeded(appData: ReturnType<typeof useAppData>): Promise<void> {
  const tasks: Array<Promise<unknown>> = [];

  if (appData.heroes.size === 0) tasks.push(appData.loadHeroesData());
  if (appData.items.size === 0) tasks.push(appData.loadItemsData());
  if (appData.leagues.size === 0) tasks.push(appData.loadLeaguesData());

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

async function hydrateAppData({
  configContext,
  appData,
  ensuredActiveTeamKeyRef,
  hasHydratedRef,
  setHasHydrated,
  setHydrationError,
}: {
  configContext: ReturnType<typeof useConfigContext>;
  appData: ReturnType<typeof useAppData>;
  ensuredActiveTeamKeyRef: React.MutableRefObject<string | null>;
  hasHydratedRef: React.MutableRefObject<boolean>;
  setHasHydrated: (value: boolean) => void;
  setHydrationError: (value: string | null) => void;
}): Promise<void> {
  try {
    setHydrationError(null);

    if (appData.getTeams().length === 0) {
      await appData.loadFromStorage();
    }

    await fetchConstantsIfNeeded(appData);
    refreshTeamsCachedMetadata(appData);

    const ensuredActiveTeam = await ensureActiveTeam(configContext, appData);
    if (ensuredActiveTeam.key) {
      ensuredActiveTeamKeyRef.current = ensuredActiveTeam.key;
    }

    const { activeTeam, otherTeams } = getRefreshTargets(appData);
    if (!ensuredActiveTeam.didLoad) {
      await refreshActiveTeam(appData, activeTeam);
    }
    refreshOtherTeams(appData, otherTeams);

    await appData.loadAllManualMatches();
    await appData.loadAllManualPlayers();

    hasHydratedRef.current = true;
    setHasHydrated(true);
  } catch (error) {
    console.error('Hydration: failed:', error);
    setHydrationError(error instanceof Error ? error.message : 'Hydration failed');
  }
}

async function refreshActiveTeam(
  appData: ReturnType<typeof useAppData>,
  activeTeam: { teamKey: string; teamId: number; leagueId: number } | null,
): Promise<void> {
  if (!activeTeam) return;
  try {
    await appData.refreshTeam(activeTeam.teamId, activeTeam.leagueId);
  } catch (error) {
    console.error(`Hydration: failed to refresh active team ${activeTeam.teamKey}`, error);
  }
}

function refreshOtherTeams(
  appData: ReturnType<typeof useAppData>,
  otherTeams: Array<{ teamKey: string; teamId: number; leagueId: number }>,
): void {
  otherTeams.forEach(({ teamKey, teamId, leagueId }) => {
    appData.refreshTeam(teamId, leagueId).catch((error) => {
      console.error(`Hydration: failed to refresh team ${teamKey}`, error);
    });
  });
}

async function ensureActiveTeam(
  configContext: ReturnType<typeof useConfigContext>,
  appData: ReturnType<typeof useAppData>,
): Promise<{ key: string | null; didLoad: boolean }> {
  const active = configContext.activeTeam;
  if (active) {
    const key = `${active.teamId}-${active.leagueId}`;
    const existingTeam = appData.getTeam(key);

    if (existingTeam) {
      if (appData.state.selectedTeamId !== key) {
        appData.setSelectedTeam(key);
      }
      return { key, didLoad: false };
    }

    await appData.loadTeam(active.teamId, active.leagueId);
    return { key, didLoad: true };
  }

  return { key: null, didLoad: false };
}

function getRefreshTargets(appData: ReturnType<typeof useAppData>): {
  activeTeam: { teamKey: string; teamId: number; leagueId: number } | null;
  otherTeams: Array<{ teamKey: string; teamId: number; leagueId: number }>;
} {
  const teams = appData.getTeams();
  const refreshable = teams.filter((team) => !team.isGlobal && team.teamId && team.leagueId);
  const activeTeam = refreshable.find((team) => team.id === appData.state.selectedTeamId) ?? null;
  const otherTeams = refreshable
    .filter((team) => !activeTeam || team.id !== activeTeam.id)
    .map((team) => ({ teamKey: team.id, teamId: team.teamId, leagueId: team.leagueId }));

  return {
    activeTeam: activeTeam
      ? { teamKey: activeTeam.id, teamId: activeTeam.teamId, leagueId: activeTeam.leagueId }
      : null,
    otherTeams,
  };
}
