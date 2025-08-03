'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { usePlayerContext } from '@/contexts/player-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Player } from '@/types/contexts/player-context-value';

import type { PlayerDetailsPanelMode } from './details/PlayerDetailsPanel';
import type { PlayerFilters as PlayerFiltersType } from './filters/PlayerFilters';
import type { PlayerListViewMode } from './list/PlayerListView';
import { EmptyStateContent } from './player-stats-page/EmptyStateContent';
import { ErrorContent } from './player-stats-page/ErrorContent';
import { ResizablePlayerLayout, type ResizablePlayerLayoutRef } from './ResizablePlayerLayout';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function usePlayerData() {
  const { players, isLoading } = usePlayerContext();
  const { selectedTeamId } = useTeamContext();

  const playersArray = useMemo(() => {
    return Array.from(players.values());
  }, [players]);

  return {
    players: playersArray,
    isLoading,
    error: null, // TODO: Add error handling from player context
    selectedTeamId
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

function usePlayerFilters() {
  const [filters, setFilters] = useState<PlayerFiltersType>({
    search: '',
    sortBy: 'name',
    sortDirection: 'asc'
  });

  return {
    filters,
    setFilters
  };
}

function usePlayerViewModes() {
  const [viewMode, setViewMode] = useState<PlayerListViewMode>('list');
  const [playerDetailsViewMode, setPlayerDetailsViewMode] = useState<PlayerDetailsPanelMode>('summary');

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
// MAIN COMPONENT
// ============================================================================

export const PlayerStatsPage: React.FC = () => {
  const { players, isLoading, error, selectedTeamId } = usePlayerData();
  const { selectedPlayer, selectedPlayerId, selectPlayer } = usePlayerSelection();
  const { filters, setFilters } = usePlayerFilters();
  const { viewMode, setViewMode, playerDetailsViewMode, setPlayerDetailsViewMode } = usePlayerViewModes();
  const { hiddenPlayers, showHiddenModal, setShowHiddenModal, handleHidePlayer, handleUnhidePlayer, visiblePlayers } = useHiddenPlayers(players);
  
  const resizableLayoutRef = useRef<ResizablePlayerLayoutRef | null>(null);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(player => 
        player.profile.profile.personaname.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.profile.profile.personaname;
          bValue = b.profile.profile.personaname;
          break;
        case 'rank':
          aValue = a.profile.rank_tier;
          bValue = b.profile.rank_tier;
          break;
        case 'games':
          aValue = a.wl.win + a.wl.lose;
          bValue = b.wl.win + b.wl.lose;
          break;
        case 'winRate':
          aValue = a.wl.win + a.wl.lose > 0 ? a.wl.win / (a.wl.win + a.wl.lose) : 0;
          bValue = b.wl.win + b.wl.lose > 0 ? b.wl.win / (b.wl.win + b.wl.lose) : 0;
          break;
        case 'heroes':
          aValue = a.heroes.length;
          bValue = b.heroes.length;
          break;
        default:
          aValue = a.profile.profile.personaname;
          bValue = b.profile.profile.personaname;
      }

      if (filters.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [players, filters]);

  const handleRefreshPlayer = useCallback((playerId: number) => {
    // TODO: Implement player refresh functionality
    console.log('Refresh player:', playerId);
  }, []);

  const handleAddPlayer = useCallback(() => {
    // TODO: Implement add player functionality
    console.log('Add player');
  }, []);

  const handleScrollToPlayer = useCallback((playerId: number) => {
    resizableLayoutRef.current?.scrollToPlayer(playerId);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton type="text" lines={8} />;
    }

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
        filters={filters}
        onFiltersChange={setFilters}
        players={players}
        visiblePlayers={visiblePlayers}
        filteredPlayers={filteredPlayers}
        onHidePlayer={handleHidePlayer}
        onRefreshPlayer={handleRefreshPlayer}
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
        onScrollToPlayer={handleScrollToPlayer}
        onAddPlayer={handleAddPlayer}
      />
    );
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
        {renderContent()}
      </Suspense>
    </ErrorBoundary>
  );
}; 