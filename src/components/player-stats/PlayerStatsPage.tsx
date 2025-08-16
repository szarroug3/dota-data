'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { useConfigContext } from '@/contexts/config-context';
import { usePlayerContext } from '@/contexts/player-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Player } from '@/types/contexts/player-context-value';

import { AddPlayerSheet } from './AddPlayerSheet';
import type { PlayerDetailsPanelMode } from './details/PlayerDetailsPanel';
import { EditPlayerSheet } from './EditPlayerSheet';
import type { PlayerListViewMode } from './list/PlayerListView';
import { EmptyStateContent } from './player-stats-page/EmptyStateContent';
import { ErrorContent } from './player-stats-page/ErrorContent';
import { ResizablePlayerLayout, type ResizablePlayerLayoutRef } from './ResizablePlayerLayout';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function usePlayerData() {
  const { players, isLoading, refreshPlayer, addPlayer } = usePlayerContext();
  const { selectedTeamId } = useTeamContext();

  const playersArray = useMemo(() => {
    return Array.from(players.values());
  }, [players]);

  return {
    players: playersArray,
    isLoading,
    error: null, // TODO: Add error handling from player context
    selectedTeamId,
    refreshPlayer,
    addPlayer
  };
}

function usePlayerSelection() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const { players } = usePlayerContext();

  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return Array.from(players.values()).find(player => 
      player.profile.profile.account_id === selectedPlayerId
    ) || null;
  }, [selectedPlayerId, players]);

  const selectPlayer = (playerId: number) => {
    setSelectedPlayerId(playerId);
  };

  return {
    selectedPlayer,
    selectedPlayerId,
    selectPlayer
  };
}

function useHiddenPlayers(filteredPlayers: Player[]) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Player[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState(false);

  // Hide a player (remove from visible, add to hidden)
  const handleHidePlayer = useCallback((id: number) => {
    setHiddenPlayers(prev => {
      const playerToHide = filteredPlayers.find((p: Player) => p.profile.profile.account_id === id);
      if (!playerToHide) return prev;
      return [...prev, playerToHide];
    });
  }, [filteredPlayers]);

  // Unhide a player (remove from hidden, add back to visible)
  const handleUnhidePlayer = useCallback((id: number) => {
    setHiddenPlayers(prev => prev.filter((p: Player) => p.profile.profile.account_id !== id));
  }, []);

  // Filter out hidden players from the visible list
  const visiblePlayers = useMemo(() => {
    const hiddenIds = new Set(hiddenPlayers.map((p: Player) => p.profile.profile.account_id));
    return filteredPlayers.filter((p: Player) => !hiddenIds.has(p.profile.profile.account_id));
  }, [filteredPlayers, hiddenPlayers]);

  return {
    hiddenPlayers,
    showHiddenModal,
    setShowHiddenModal,
    handleHidePlayer,
    handleUnhidePlayer,
    visiblePlayers
  };
}

function usePlayerViewModes() {
  const { config, updateConfig } = useConfigContext();
  const [viewMode, setViewModeState] = useState<PlayerListViewMode>(config.preferredPlayerlistView ?? 'list');
  const [playerDetailsViewMode, setPlayerDetailsViewMode] = useState<PlayerDetailsPanelMode>('summary');

  const setViewMode = useCallback((mode: PlayerListViewMode) => {
    setViewModeState(mode);
    updateConfig({ preferredPlayerlistView: mode }).catch((error) => {
      console.error('Failed to save player list view mode preference:', error);
    });
  }, [updateConfig]);

  return {
    viewMode,
    setViewMode,
    playerDetailsViewMode,
    setPlayerDetailsViewMode
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPlayerStatsEmptyState(players: Player[], selectedTeamId: { teamId: number; leagueId: number } | null) {
  if (!selectedTeamId) {
    return <EmptyStateContent type="no-selection" />;
  }
  if (players.length === 0) {
    return <EmptyStateContent type="no-teams" />;
  }
  return null;
}

// ============================================================================
// DERIVED STATE HOOKS (to keep main component small)
// ============================================================================

function useSortedPlayers(players: Player[]) {
  return useMemo(() => {
    return [...players].sort((a, b) =>
      a.profile.profile.personaname.localeCompare(b.profile.profile.personaname)
    );
  }, [players]);
}

function useManualPlayerIds(getSelectedTeam?: () => import('@/types/contexts/team-context-value').TeamData | undefined) {
  return useMemo(() => {
    const selectedTeam = getSelectedTeam?.();
    const manual = selectedTeam?.manualPlayers ?? [];
    return new Set<number>(manual);
  }, [getSelectedTeam]);
}

function useWaitForPlayerReadySource(players: Player[]) {
  const playersRef = useRef<Player[]>(players);
  React.useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const waitForPlayerReady = useCallback(async (playerId: number, timeoutMs = 3000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const player = playersRef.current.find(p => p.profile.profile.account_id === playerId);
      if (player && !player.error) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    return false;
  }, []);

  return waitForPlayerReady;
}

function usePlayerStatsHandlers(
  deps: {
    refreshPlayer: (id: number) => Promise<void | object | null>;
    addPlayer: (id: number) => Promise<Player | null>;
    addPlayerToTeam?: (id: number) => Promise<void>;
    removeManualPlayer?: (id: number) => void;
    editManualPlayer?: (oldId: number, newId: number) => Promise<void>;
    selectPlayer: (id: number) => void;
    resizableLayoutRef: React.MutableRefObject<ResizablePlayerLayoutRef | null>;
    setShowAddPlayerSheet: React.Dispatch<React.SetStateAction<boolean>>;
    setShowEditPlayerSheet: React.Dispatch<React.SetStateAction<{ open: boolean; playerId: number | null }>>;
    waitForPlayerReady: (playerId: number, timeoutMs?: number) => Promise<boolean>;
  }
) {
  const {
    refreshPlayer,
    addPlayer,
    addPlayerToTeam,
    removeManualPlayer,
    editManualPlayer,
    selectPlayer,
    resizableLayoutRef,
    setShowAddPlayerSheet,
    setShowEditPlayerSheet,
    waitForPlayerReady
  } = deps;

  const handleRefreshPlayer = useCallback(async (playerId: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      await refreshPlayer(playerId);
    } catch (error) {
      console.error('Error in handleRefreshPlayer:', error);
    }
  }, [refreshPlayer]);

  const handleRemoveManualPlayer = useCallback((playerId: number) => {
    try {
      removeManualPlayer?.(playerId);
    } catch (e) {
      console.error('Failed to remove manual player:', e);
    }
  }, [removeManualPlayer]);

  const handleEditManualPlayer = useCallback((playerId: number) => {
    setShowEditPlayerSheet({ open: true, playerId });
  }, [setShowEditPlayerSheet]);

  const handleAddPlayer = useCallback(async (playerId: string) => {
    const playerIdNum = parseInt(playerId, 10);
    if (isNaN(playerIdNum)) {
      throw new Error('Invalid player ID');
    }

    const added = await addPlayer(playerIdNum);
    try {
      await addPlayerToTeam?.(playerIdNum);
    } catch (e) {
      console.warn('addPlayerToTeam failed, player added to context only:', e);
    }

    if (added && !added.error) {
      selectPlayer(playerIdNum);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
    resizableLayoutRef.current?.scrollToPlayer(playerIdNum);
  }, [addPlayer, addPlayerToTeam, selectPlayer, resizableLayoutRef]);

  const handleOpenAddPlayerSheet = useCallback(() => {
    setShowAddPlayerSheet(true);
  }, [setShowAddPlayerSheet]);

  const handleScrollToPlayer = useCallback((playerId: number) => {
    resizableLayoutRef.current?.scrollToPlayer(playerId);
  }, [resizableLayoutRef]);

  const onEditPlayer = useCallback(async (oldId: number, newPlayerId: string) => {
    if (!Number.isFinite(Number(newPlayerId))) return;
    const newIdNum = Number(newPlayerId);
    await editManualPlayer?.(oldId, newIdNum);
    await new Promise(resolve => setTimeout(resolve, 10));
    resizableLayoutRef.current?.scrollToPlayer(newIdNum);
    const ready = await waitForPlayerReady(newIdNum);
    if (ready) {
      selectPlayer(newIdNum);
    }
  }, [editManualPlayer, resizableLayoutRef, waitForPlayerReady, selectPlayer]);

  return {
    handleRefreshPlayer,
    handleRemoveManualPlayer,
    handleEditManualPlayer,
    handleAddPlayer,
    handleOpenAddPlayerSheet,
    handleScrollToPlayer,
    onEditPlayer
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlayerStatsPage(): React.ReactElement {
  const { players, error, refreshPlayer, addPlayer } = usePlayerData();
  const {
    selectedTeamId,
    addPlayerToTeam,
    getSelectedTeam,
    removeManualPlayer,
    editManualPlayer,
  } = useTeamContext();
  const { selectedPlayer, selectedPlayerId, selectPlayer } = usePlayerSelection();
  const { viewMode, setViewMode, playerDetailsViewMode, setPlayerDetailsViewMode } = usePlayerViewModes();
  const { hiddenPlayers, setShowHiddenModal, visiblePlayers } = useHiddenPlayers(players);
  const sortedPlayers = useSortedPlayers(players);
  const manualPlayerIds = useManualPlayerIds(getSelectedTeam);
  
  const resizableLayoutRef = useRef<ResizablePlayerLayoutRef | null>(null);
  const [showAddPlayerSheet, setShowAddPlayerSheet] = useState(false);
  const [showEditPlayerSheet, setShowEditPlayerSheet] = useState<{ open: boolean; playerId: number | null }>({ open: false, playerId: null });

  const waitForPlayerReady = useWaitForPlayerReadySource(players);
  const handlers = usePlayerStatsHandlers({
    refreshPlayer,
    addPlayer,
    addPlayerToTeam,
    removeManualPlayer,
    editManualPlayer,
    selectPlayer,
    resizableLayoutRef,
    setShowAddPlayerSheet,
    setShowEditPlayerSheet,
    waitForPlayerReady,
  });

  const renderContent = () => {
    if (error) {
      return <ErrorContent error={error} />;
    }

    const emptyState = getPlayerStatsEmptyState(players, selectedTeamId);
    if (emptyState) {
      return emptyState;
    }

    return (
      <ResizablePlayerLayout
        ref={resizableLayoutRef}
        players={players}
        visiblePlayers={visiblePlayers}
        filteredPlayers={sortedPlayers}
        onHidePlayer={() => {}}
        onRefreshPlayer={handlers.handleRefreshPlayer}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={selectPlayer}
        hiddenPlayersCount={hiddenPlayers.length}
        onShowHiddenPlayers={() => setShowHiddenModal(true)}
        hiddenPlayerIds={new Set(hiddenPlayers.map(p => p.profile.profile.account_id))}
        selectedPlayer={selectedPlayer}
        playerDetailsViewMode={playerDetailsViewMode}
        setPlayerDetailsViewMode={setPlayerDetailsViewMode}
        onScrollToPlayer={handlers.handleScrollToPlayer}
        onAddPlayer={handlers.handleOpenAddPlayerSheet}
        manualPlayerIds={manualPlayerIds}
        onEditPlayer={handlers.handleEditManualPlayer}
        onRemovePlayer={handlers.handleRemoveManualPlayer}
      />
    );
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
        {renderContent()}
      </Suspense>
      
      <AddPlayerSheet
        isOpen={showAddPlayerSheet}
        onClose={() => setShowAddPlayerSheet(false)}
        onAddPlayer={handlers.handleAddPlayer}
        existingPlayers={players}
      />

      <EditPlayerSheet
        isOpen={showEditPlayerSheet.open}
        onClose={() => setShowEditPlayerSheet({ open: false, playerId: null })}
        existingPlayers={players}
        currentPlayerId={showEditPlayerSheet.playerId ?? 0}
        onEditPlayer={async (newPlayerId: string) => {
          const oldId = showEditPlayerSheet.playerId;
          if (oldId == null) return;
          await handlers.onEditPlayer(oldId, newPlayerId);
        }}
      />
    </ErrorBoundary>
  );
}