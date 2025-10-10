'use client';

import React, { useMemo, useRef } from 'react';

import { useAppData } from '@/contexts/app-data-context';
import { useConfigContext } from '@/frontend/contexts/config-context';
import {
  PlayerStatsPage,
  type PlayerEditActions,
} from '@/frontend/players/components/stateless/PlayerStatsPage';
import type { ResizablePlayerLayoutRef } from '@/frontend/players/components/stateless/ResizablePlayerLayout';
import {
  useHiddenPlayers,
  usePlayerData,
  usePlayerEditActions,
  usePlayerSelection,
  usePlayerViewModes,
  useSortedPlayers,
  useTeamPlayerOperations,
  useWaitForPlayerReadySource,
} from '@/frontend/players/hooks/usePlayerStatsPage';

export function PlayerStatsPageContainer(): React.ReactElement {
  const { players, error, addPlayer, refreshPlayer } = usePlayerData();
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  if (!selectedTeamId) {
    throw new Error('No selected team ID');
  }

  const selectedTeam = appData.getTeam(selectedTeamId);
  if (!selectedTeam) {
    throw new Error('No selected team found');
  }

  const sortedPlayers = useSortedPlayers(players);
  const { hiddenPlayers, visiblePlayers, handleHidePlayer, setShowHiddenModal } = useHiddenPlayers(sortedPlayers);
  const { selectedPlayer, selectedPlayerId, selectPlayer } = usePlayerSelection();
  const { viewMode, setViewMode, playerDetailsViewMode, setPlayerDetailsViewMode } = usePlayerViewModes();

  const resizableLayoutRef = useRef<ResizablePlayerLayoutRef | null>(null);

  const waitForPlayerReady = useWaitForPlayerReadySource(players);
  const { addPlayerToTeam, removeManualPlayer, editManualPlayer } = useTeamPlayerOperations();

  const editActions: PlayerEditActions = usePlayerEditActions({
    addPlayer,
    addPlayerToTeam,
    removeManualPlayer,
    editManualPlayer,
    selectPlayer,
    resizableLayoutRef,
    waitForPlayerReady,
  });

  const { config } = useConfigContext();
  const preferredSite = config.preferredExternalSite;

  const manualPlayerIds = useMemo(() => {
    const ids: number[] = [];
    selectedTeam.players.forEach((storedPlayer, playerId) => {
      if (storedPlayer.isManual) {
        ids.push(playerId);
      }
    });
    return new Set<number>(ids);
  }, [selectedTeam]);

  const playerTeamOverview = useMemo(() => {
    if (!selectedPlayerId) {
      return null;
    }
    return appData.getTeamPlayerOverview(selectedPlayerId, selectedTeamId);
  }, [appData, selectedPlayerId, selectedTeamId, appData.matches, appData.heroes, appData.players]);

  const normalizedError = typeof error === 'string' ? error : null;

  return (
    <PlayerStatsPage
      resizableLayoutRef={resizableLayoutRef}
      players={players}
      filteredPlayers={sortedPlayers}
      visiblePlayers={visiblePlayers}
      hiddenPlayers={hiddenPlayers}
      onHidePlayer={handleHidePlayer}
      onRefreshPlayer={refreshPlayer}
      viewMode={viewMode}
      setViewMode={setViewMode}
      selectedPlayerId={selectedPlayerId}
      selectPlayer={selectPlayer}
      selectedPlayer={selectedPlayer}
      playerDetailsViewMode={playerDetailsViewMode}
      setPlayerDetailsViewMode={setPlayerDetailsViewMode}
      setShowHiddenModal={setShowHiddenModal}
      manualPlayerIds={manualPlayerIds}
      heroes={appData.heroes}
      preferredSite={preferredSite}
      playerTeamOverview={playerTeamOverview}
      editActions={editActions}
      error={normalizedError}
    />
  );
}
