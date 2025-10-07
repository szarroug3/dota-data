import { useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { refreshTeamsCachedMetadata } from '@/frontend/lib/app-data-metadata-helpers';
import { useAppData } from '@/hooks/use-app-data';

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
    const hydrate = async () => {
      if (hasHydratedRef.current) return;

      try {
        setHydrationError(null);

        if (contextsRef.current.appData.getTeams().length === 0) {
          await contextsRef.current.appData.loadFromStorage();
        }

        await fetchConstantsIfNeeded(contextsRef.current.appData);
        refreshTeamsCachedMetadata(contextsRef.current.appData);
        const ensuredKey = await ensureActiveTeam(contextsRef.current.configContext, contextsRef.current.appData);
        if (ensuredKey) {
          ensuredActiveTeamKeyRef.current = ensuredKey;
        }

        const { activeTeam, otherTeams } = getRefreshTargets(contextsRef.current.appData);

        if (activeTeam) {
          try {
            await contextsRef.current.appData.refreshTeam(activeTeam.teamId, activeTeam.leagueId);
          } catch (error) {
            console.error(`Hydration: failed to refresh active team ${activeTeam.teamKey}`, error);
          }
        }

        otherTeams.forEach(({ teamKey, teamId, leagueId }) => {
          contextsRef.current.appData
            .refreshTeam(teamId, leagueId)
            .catch((error) => console.error(`Hydration: failed to refresh team ${teamKey}`, error));
        });

        await contextsRef.current.appData.loadAllManualMatches();
        await contextsRef.current.appData.loadAllManualPlayers();

        hasHydratedRef.current = true;
        setHasHydrated(true);
      } catch (error) {
        console.error('Hydration: failed:', error);
        setHydrationError(error instanceof Error ? error.message : 'Hydration failed');
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    const active = contextsRef.current.configContext.activeTeam;
    const key = active ? `${active.teamId}-${active.leagueId}` : null;
    if (active && ensuredActiveTeamKeyRef.current !== key) {
      contextsRef.current.appData.loadTeam(active.teamId, active.leagueId).then(() => {
        ensuredActiveTeamKeyRef.current = key;
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

async function ensureActiveTeam(
  configContext: ReturnType<typeof useConfigContext>,
  appData: ReturnType<typeof useAppData>,
): Promise<string | null> {
  const active = configContext.activeTeam;
  if (active) {
    await appData.loadTeam(active.teamId, active.leagueId);
    return `${active.teamId}-${active.leagueId}`;
  }

  return null;
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
