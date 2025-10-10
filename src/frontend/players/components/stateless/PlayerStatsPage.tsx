'use client';

import React, { Suspense, useMemo, useState } from 'react';

import type { TeamPlayerOverview } from '@/frontend/lib/app-data-statistics-ops';
import type { Hero, Player } from '@/frontend/lib/app-data-types';
import { AddPlayerSheet } from '@/frontend/players/components/stateless/AddPlayerSheet';
import { EditPlayerSheet } from '@/frontend/players/components/stateless/EditPlayerSheet';
import { ErrorContent } from '@/frontend/players/components/stateless/ErrorContent';
import {
  ResizablePlayerLayout,
  type ResizablePlayerLayoutRef,
} from '@/frontend/players/components/stateless/ResizablePlayerLayout';
import { usePlayerListActions } from '@/frontend/players/hooks/usePlayerStatsPage';
import { ErrorBoundary } from '@/frontend/shared/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/frontend/shared/layout/LoadingSkeleton';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import { validatePlayerId } from '@/utils/validation';

import type { PlayerDetailsPanelMode } from './details/PlayerDetailsPanel';
import type { PlayerListViewMode } from './PlayerListView';

export interface PlayerEditActions {
  handleRemoveManualPlayer: (playerId: number) => void;
  handleEditManualPlayer: (playerId: number) => void;
  handleAddPlayer: (playerId: string) => Promise<void>;
  onEditPlayer: (oldId: number, newPlayerId: string) => Promise<void>;
}

export interface PlayerStatsPageProps {
  resizableLayoutRef: React.MutableRefObject<ResizablePlayerLayoutRef | null>;
  players: Player[];
  filteredPlayers: Player[];
  visiblePlayers: Player[];
  hiddenPlayers: Player[];
  onHidePlayer: (playerId: number) => void;
  onRefreshPlayer: (playerId: number) => Promise<void | object | null>;
  viewMode: PlayerListViewMode;
  setViewMode: (mode: PlayerListViewMode) => void;
  selectedPlayerId: number | null;
  selectPlayer: (playerId: number) => void;
  selectedPlayer: Player | null;
  playerDetailsViewMode: PlayerDetailsPanelMode;
  setPlayerDetailsViewMode: (mode: PlayerDetailsPanelMode) => void;
  setShowHiddenModal: React.Dispatch<React.SetStateAction<boolean>>;
  manualPlayerIds: Set<number>;
  heroes: Map<number, Hero>;
  preferredSite: PreferredExternalSite;
  playerTeamOverview: TeamPlayerOverview | null;
  editActions: PlayerEditActions;
  error: string | null;
}

function PlayerSheetsContainer({
  existingPlayerIds,
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
  existingPlayerIds: Set<number>;
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
  editActions: PlayerEditActions;
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
      existingPlayerIds={existingPlayerIds}
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

export function PlayerStatsPage({
  resizableLayoutRef,
  players,
  filteredPlayers,
  visiblePlayers,
  hiddenPlayers,
  onHidePlayer,
  onRefreshPlayer,
  viewMode,
  setViewMode,
  selectedPlayerId,
  selectPlayer,
  selectedPlayer,
  playerDetailsViewMode,
  setPlayerDetailsViewMode,
  setShowHiddenModal,
  manualPlayerIds,
  heroes,
  preferredSite,
  playerTeamOverview,
  editActions,
  error,
}: PlayerStatsPageProps): React.ReactElement {
  const existingPlayerIds = useMemo(() => new Set(players.map((player) => player.accountId)), [players]);
  const [showAddPlayerSheet, setShowAddPlayerSheet] = useState(false);
  const [showEditPlayerSheet, setShowEditPlayerSheet] = useState<{ open: boolean; playerId: number | null }>({
    open: false,
    playerId: null,
  });
  const [addPlayerId, setAddPlayerId] = useState('');
  const [editPlayerIdInput, setEditPlayerIdInput] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  const listActions = usePlayerListActions({ refreshPlayer: onRefreshPlayer, resizableLayoutRef, setShowAddPlayerSheet });

  const contentProps = {
    resizableLayoutRef,
    players,
    visiblePlayers,
    filteredPlayers,
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
    handleEditManualPlayer: (playerId: number) => {
      setEditPlayerIdInput(String(playerId));
      setEditError(undefined);
      setShowEditPlayerSheet({ open: true, playerId });
    },
    handleRemoveManualPlayer: editActions.handleRemoveManualPlayer,
    handleHidePlayer: onHidePlayer,
    heroes,
    preferredSite,
    playerTeamOverview,
  } as const;

  const renderContent = () => {
    if (error) return <ErrorContent error={error} />;
    return <PlayerStatsContent {...contentProps} />;
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>{renderContent()}</Suspense>
      <PlayerSheetsContainer
        existingPlayerIds={existingPlayerIds}
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
  handleHidePlayer,
  heroes,
  preferredSite,
  playerTeamOverview,
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
  setShowHiddenModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPlayer: Player | null;
  playerDetailsViewMode: PlayerDetailsPanelMode;
  setPlayerDetailsViewMode: (m: PlayerDetailsPanelMode) => void;
  handleScrollToPlayer: (id: number) => void;
  setShowAddPlayerSheet: React.Dispatch<React.SetStateAction<boolean>>;
  manualPlayerIds: Set<number>;
  handleEditManualPlayer: (playerId: number) => void;
  handleRemoveManualPlayer: (playerId: number) => void;
  handleHidePlayer: (playerId: number) => void;
  heroes: Map<number, Hero>;
  preferredSite: PreferredExternalSite;
  playerTeamOverview: TeamPlayerOverview | null;
}) {
  return (
    <ResizablePlayerLayout
      ref={resizableLayoutRef}
      players={players}
      visiblePlayers={visiblePlayers}
      filteredPlayers={filteredPlayers}
      onHidePlayer={handleHidePlayer}
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
      playerTeamOverview={playerTeamOverview}
    />
  );
}
function PlayerSheets({
  showAddPlayerSheet,
  setShowAddPlayerSheet,
  addPlayerId,
  setAddPlayerId,
  onSubmitAdd,
  existingPlayerIds,
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
  existingPlayerIds: Set<number>;
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
          return existingPlayerIds.has(idNum);
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
          return existingPlayerIds.has(nextId);
        })()}
        isValid={editPlayerIdInput.trim().length > 0 && validatePlayerId(editPlayerIdInput).isValid}
      />
    </>
  );
}
