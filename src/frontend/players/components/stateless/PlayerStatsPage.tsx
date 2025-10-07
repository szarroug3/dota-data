'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { useAppData } from '@/contexts/app-data-context';
import { useConfigContext } from '@/frontend/contexts/config-context';
import type { Hero, Match, Player, Team } from '@/frontend/lib/app-data-types';
import { AddPlayerSheet } from '@/frontend/players/components/stateless/AddPlayerSheet';
import { EditPlayerSheet } from '@/frontend/players/components/stateless/EditPlayerSheet';
import { ErrorContent } from '@/frontend/players/components/stateless/ErrorContent';
import {
  ResizablePlayerLayout,
  type ResizablePlayerLayoutRef,
} from '@/frontend/players/components/stateless/ResizablePlayerLayout';
import {
  useFilteredTeamPlayers,
  useHiddenPlayers as useHiddenPlayersHook,
  usePlayerData as usePlayerDataHook,
  usePlayerEditActions,
  usePlayerListActions,
  usePlayerSelection as usePlayerSelectionHook,
  usePlayerViewModes as usePlayerViewModesHook,
  useSortedPlayers as useSortedPlayersHook,
  useTeamPlayerIds,
  useTeamPlayerOperations,
  useWaitForPlayerReadySource,
} from '@/frontend/players/hooks/usePlayerStatsPage';
import { ErrorBoundary } from '@/frontend/shared/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/frontend/shared/layout/LoadingSkeleton';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import { validatePlayerId } from '@/utils/validation';

import type { PlayerDetailsPanelMode } from './details/PlayerDetailsPanel';
import type { PlayerListViewMode } from './PlayerListView';

function PlayerSheetsContainer({
  teamPlayerIds,
  showAddPlayerSheet,
  setShowAddPlayerSheet,
  addPlayerId,
  setAddPlayerId,
  showEditPlayerSheet,
  setShowEditPlayerSheet,
  editPlayerIdInput,
  setEditPlayerIdInput,
  isSubmittingEdit,
  setIsSubmittingEdit,
  editError,
  setEditError,
  editActions,
}: {
  teamPlayerIds: Set<number>;
  showAddPlayerSheet: boolean;
  setShowAddPlayerSheet: (open: boolean) => void;
  addPlayerId: string;
  setAddPlayerId: (val: string) => void;
  showEditPlayerSheet: { open: boolean; playerId: number | null };
  setShowEditPlayerSheet: (s: { open: boolean; playerId: number | null }) => void;
  editPlayerIdInput: string;
  setEditPlayerIdInput: (val: string) => void;
  isSubmittingEdit: boolean;
  setIsSubmittingEdit: (b: boolean) => void;
  editError: string | undefined;
  setEditError: (s: string | undefined) => void;
  editActions: ReturnType<typeof usePlayerEditActions>;
}) {
  return (
    <PlayerSheets
      showAddPlayerSheet={showAddPlayerSheet}
      setShowAddPlayerSheet={setShowAddPlayerSheet}
      addPlayerId={addPlayerId}
      setAddPlayerId={setAddPlayerId}
      onSubmitAdd={async () => {
        await editActions.handleAddPlayer(addPlayerId);
        setAddPlayerId('');
        setShowAddPlayerSheet(false);
      }}
      teamPlayerIds={teamPlayerIds}
      showEditPlayerSheet={showEditPlayerSheet}
      setShowEditPlayerSheet={setShowEditPlayerSheet}
      editPlayerIdInput={editPlayerIdInput}
      setEditPlayerIdInput={setEditPlayerIdInput}
      isSubmittingEdit={isSubmittingEdit}
      setIsSubmittingEdit={setIsSubmittingEdit}
      editError={editError}
      setEditError={setEditError}
      onSubmitEdit={async () => {
        const oldId = showEditPlayerSheet.playerId;
        if (oldId == null) return;
        try {
          setIsSubmittingEdit(true);
          await editActions.onEditPlayer(oldId, editPlayerIdInput);
          setShowEditPlayerSheet({ open: false, playerId: null });
          setEditPlayerIdInput('');
        } catch (e) {
          setEditError(e instanceof Error ? e.message : 'Failed to update player');
        } finally {
          setIsSubmittingEdit(false);
        }
      }}
    />
  );
}

function PlayerStatsPageInner(): React.ReactElement {
  const { players, error, addPlayer, refreshPlayer } = usePlayerDataHook();
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;
  if (!selectedTeamId) {
    throw new Error('No selected team ID');
  }
  const getSelectedTeam = useCallback(() => {
    const team = appData.getTeam(selectedTeamId);
    if (!team) {
      throw new Error('No selected team found');
    }
    return team;
  }, [appData, selectedTeamId]);
  const { selectedPlayer, selectedPlayerId, selectPlayer } = usePlayerSelectionHook();
  const { viewMode, setViewMode, playerDetailsViewMode, setPlayerDetailsViewMode } = usePlayerViewModesHook();
  const preferredSite: PreferredExternalSite = useConfigContext().config.preferredExternalSite;
  const matchesArray = useMemo(() => Array.from(appData.matches.values()), [appData.matches]);

  // Team-scoped player filtering
  const teamPlayerIds = useTeamPlayerIds();
  const hasActiveTeam = Boolean(selectedTeamId);
  const teamPlayersOnly = useFilteredTeamPlayers(players, teamPlayerIds, hasActiveTeam);

  const sortedPlayers = useSortedPlayersHook(teamPlayersOnly);
  const { hiddenPlayers, setShowHiddenModal, visiblePlayers } = useHiddenPlayersHook(sortedPlayers);
  const manualPlayerIds = useMemo(() => {
    const selectedTeam = getSelectedTeam();
    return new Set<number>(selectedTeam.manualPlayerIds);
  }, [getSelectedTeam]);

  const resizableLayoutRef = useRef<ResizablePlayerLayoutRef | null>(null);
  const [showAddPlayerSheet, setShowAddPlayerSheet] = useState(false);
  const [showEditPlayerSheet, setShowEditPlayerSheet] = useState<{ open: boolean; playerId: number | null }>({
    open: false,
    playerId: null,
  });
  const [addPlayerId, setAddPlayerId] = useState('');
  const [editPlayerIdInput, setEditPlayerIdInput] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  const waitForPlayerReady = useWaitForPlayerReadySource(players);
  const { addPlayerToTeam, removeManualPlayer, editManualPlayer } = useTeamPlayerOperations();

  const editActions = usePlayerEditActions({
    addPlayer,
    addPlayerToTeam: selectedTeamId ? addPlayerToTeam : undefined,
    removeManualPlayer,
    editManualPlayer,
    selectPlayer,
    resizableLayoutRef,
    waitForPlayerReady,
  });

  const listActions = usePlayerListActions({ refreshPlayer, resizableLayoutRef, setShowAddPlayerSheet });

  const contentProps = {
    resizableLayoutRef,
    players: teamPlayersOnly,
    visiblePlayers,
    filteredPlayers: sortedPlayers,
    onRefreshPlayer: listActions.handleRefreshPlayer,
    viewMode,
    setViewMode,
    selectedPlayerId,
    selectPlayer,
    hiddenPlayers,
    setShowHiddenModal,
    selectedPlayer,
    playerDetailsViewMode,
    setPlayerDetailsViewMode,
    handleScrollToPlayer: listActions.handleScrollToPlayer,
    setShowAddPlayerSheet,
    manualPlayerIds,
    handleEditManualPlayer: (playerId: number) => setShowEditPlayerSheet({ open: true, playerId }),
    handleRemoveManualPlayer: editActions.handleRemoveManualPlayer,
    heroes: appData.heroes,
    preferredSite,
    matchesArray,
    selectedTeam: getSelectedTeam(),
  } as const;

  const renderContent = () => {
    if (error) return <ErrorContent error={error} />;
    return <PlayerStatsContent {...contentProps} />;
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>{renderContent()}</Suspense>
      <PlayerSheetsContainer
        teamPlayerIds={teamPlayerIds}
        showAddPlayerSheet={showAddPlayerSheet}
        setShowAddPlayerSheet={setShowAddPlayerSheet}
        addPlayerId={addPlayerId}
        setAddPlayerId={setAddPlayerId}
        showEditPlayerSheet={showEditPlayerSheet}
        setShowEditPlayerSheet={setShowEditPlayerSheet}
        editPlayerIdInput={editPlayerIdInput}
        setEditPlayerIdInput={setEditPlayerIdInput}
        isSubmittingEdit={isSubmittingEdit}
        setIsSubmittingEdit={setIsSubmittingEdit}
        editError={editError}
        setEditError={setEditError}
        editActions={editActions}
      />
    </ErrorBoundary>
  );
}

export function PlayerStatsPage(): React.ReactElement {
  return <PlayerStatsPageInner />;
}

function PlayerStatsContent({
  resizableLayoutRef,
  players,
  visiblePlayers,
  filteredPlayers,
  onRefreshPlayer,
  viewMode,
  setViewMode,
  selectedPlayerId,
  selectPlayer,
  hiddenPlayers,
  setShowHiddenModal,
  selectedPlayer,
  playerDetailsViewMode,
  setPlayerDetailsViewMode,
  handleScrollToPlayer,
  setShowAddPlayerSheet,
  manualPlayerIds,
  handleEditManualPlayer,
  handleRemoveManualPlayer,
  heroes,
  preferredSite,
  matchesArray,
  selectedTeam,
}: {
  resizableLayoutRef: React.RefObject<ResizablePlayerLayoutRef | null>;
  players: Player[];
  visiblePlayers: Player[];
  filteredPlayers: Player[];
  onRefreshPlayer: (id: number) => Promise<void | object | null>;
  viewMode: PlayerListViewMode;
  setViewMode: (m: PlayerListViewMode) => void;
  selectedPlayerId: number | null;
  selectPlayer: (id: number) => void;
  hiddenPlayers: Player[];
  setShowHiddenModal: (b: boolean) => void;
  selectedPlayer: Player | null;
  playerDetailsViewMode: PlayerDetailsPanelMode;
  setPlayerDetailsViewMode: (m: PlayerDetailsPanelMode) => void;
  handleScrollToPlayer: (id: number) => void;
  setShowAddPlayerSheet: (b: boolean) => void;
  manualPlayerIds: Set<number>;
  handleEditManualPlayer: (playerId: number) => void;
  handleRemoveManualPlayer: (playerId: number) => void;
  heroes: Map<number, Hero>;
  preferredSite: PreferredExternalSite;
  matchesArray: Match[];
  selectedTeam: Team;
}) {
  return (
    <ResizablePlayerLayout
      ref={resizableLayoutRef}
      players={players}
      visiblePlayers={visiblePlayers}
      filteredPlayers={filteredPlayers}
      onHidePlayer={() => {
        /* not implemented yet */
      }}
      onRefreshPlayer={onRefreshPlayer}
      viewMode={viewMode}
      setViewMode={setViewMode}
      selectedPlayerId={selectedPlayerId}
      onSelectPlayer={selectPlayer}
      hiddenPlayersCount={hiddenPlayers.length}
      onShowHiddenPlayers={() => setShowHiddenModal(true)}
      hiddenPlayerIds={new Set(hiddenPlayers.map((p) => p.accountId))}
      selectedPlayer={selectedPlayer}
      playerDetailsViewMode={playerDetailsViewMode}
      setPlayerDetailsViewMode={setPlayerDetailsViewMode}
      onScrollToPlayer={handleScrollToPlayer}
      onAddPlayer={() => setShowAddPlayerSheet(true)}
      manualPlayerIds={manualPlayerIds}
      onEditPlayer={handleEditManualPlayer}
      onRemovePlayer={handleRemoveManualPlayer}
      heroes={heroes}
      preferredSite={preferredSite}
      matchesArray={matchesArray}
      selectedTeam={selectedTeam}
    />
  );
}
function PlayerSheets({
  showAddPlayerSheet,
  setShowAddPlayerSheet,
  addPlayerId,
  setAddPlayerId,
  onSubmitAdd,
  teamPlayerIds,
  showEditPlayerSheet,
  setShowEditPlayerSheet,
  editPlayerIdInput,
  setEditPlayerIdInput,
  isSubmittingEdit,
  setIsSubmittingEdit,
  editError,
  setEditError,
  onSubmitEdit,
}: {
  showAddPlayerSheet: boolean;
  setShowAddPlayerSheet: (open: boolean) => void;
  addPlayerId: string;
  setAddPlayerId: (val: string) => void;
  onSubmitAdd: () => Promise<void>;
  teamPlayerIds: Set<number>;
  showEditPlayerSheet: { open: boolean; playerId: number | null };
  setShowEditPlayerSheet: (s: { open: boolean; playerId: number | null }) => void;
  editPlayerIdInput: string;
  setEditPlayerIdInput: (val: string) => void;
  isSubmittingEdit: boolean;
  setIsSubmittingEdit: (b: boolean) => void;
  editError: string | undefined;
  setEditError: (s: string | undefined) => void;
  onSubmitEdit: () => Promise<void>;
}) {
  return (
    <>
      <AddPlayerSheet
        isOpen={showAddPlayerSheet}
        onClose={() => {
          setShowAddPlayerSheet(false);
          setAddPlayerId('');
        }}
        playerId={addPlayerId}
        onChangePlayerId={setAddPlayerId}
        onSubmit={async () => {
          setAddPlayerId('');
          setShowAddPlayerSheet(false);
          await onSubmitAdd();
        }}
        isSubmitting={false}
        error={undefined}
        validationError={addPlayerId.trim().length > 0 ? validatePlayerId(addPlayerId).error : undefined}
        isDuplicate={(() => {
          const idNum = parseInt(addPlayerId, 10);
          if (!Number.isFinite(idNum)) return false;
          return teamPlayerIds.has(idNum);
        })()}
        isValid={addPlayerId.trim().length > 0 && validatePlayerId(addPlayerId).isValid}
      />
      <EditPlayerSheet
        isOpen={showEditPlayerSheet.open}
        onClose={() => {
          setShowEditPlayerSheet({ open: false, playerId: null });
          setEditPlayerIdInput('');
          setIsSubmittingEdit(false);
          setEditError(undefined);
        }}
        playerId={editPlayerIdInput}
        onChangePlayerId={setEditPlayerIdInput}
        onSubmit={onSubmitEdit}
        isSubmitting={isSubmittingEdit}
        error={editError}
        validationError={editPlayerIdInput.trim().length > 0 ? validatePlayerId(editPlayerIdInput).error : undefined}
        isDuplicate={(() => {
          const nextId = parseInt(editPlayerIdInput, 10);
          const currentId = showEditPlayerSheet.playerId ?? 0;
          if (!Number.isFinite(nextId)) return false;
          if (nextId === currentId) return false;
          return teamPlayerIds.has(nextId);
        })()}
        isValid={editPlayerIdInput.trim().length > 0 && validatePlayerId(editPlayerIdInput).isValid}
      />
    </>
  );
}
