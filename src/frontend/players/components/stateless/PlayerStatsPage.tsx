'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { useAppData } from '@/contexts/app-data-context';
import { useConfigContext } from '@/frontend/contexts/config-context';
import type { PlayerListViewEntry } from '@/frontend/lib/app-data/app-data-computed-ops';
import type { Player } from '@/frontend/lib/app-data/app-data-types';
import { AddPlayerSheet } from '@/frontend/players/components/stateless/AddPlayerSheet';
import { EditPlayerSheet } from '@/frontend/players/components/stateless/EditPlayerSheet';
import { ErrorContent } from '@/frontend/players/components/stateless/ErrorContent';
import {
  ResizablePlayerLayout,
  type ResizablePlayerLayoutRef,
} from '@/frontend/players/components/stateless/ResizablePlayerLayout';
import {
  useHiddenPlayers as useHiddenPlayersHook,
  usePlayerEditActions,
  usePlayerListActions,
  usePlayerSelection as usePlayerSelectionHook,
  usePlayerScroll,
  usePlayerViewModes as usePlayerViewModesHook,
  useTeamPlayerOperations,
  useWaitForPlayerReadySource,
} from '@/frontend/players/hooks/usePlayerStatsPage';
import { ErrorBoundary } from '@/frontend/shared/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/frontend/shared/layout/LoadingSkeleton';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';

import type { PlayerDetailsPanelMode } from './details/PlayerDetailsPanel';
import type { PlayerListViewMode } from './PlayerListView';

function usePlayerIdValidation({
  appData,
  selectedTeamId,
  addPlayerId,
  editPlayerIdInput,
  currentEditPlayerId,
}: {
  appData: ReturnType<typeof useAppData>;
  selectedTeamId: string;
  addPlayerId: string;
  editPlayerIdInput: string;
  currentEditPlayerId: number;
}) {
  const addValidation = useMemo(() => appData.validatePlayerIdInput(addPlayerId), [appData, addPlayerId]);
  const addDuplicateError = useMemo(
    () => appData.getAddManualPlayerDuplicateError(selectedTeamId, addPlayerId),
    [appData, selectedTeamId, addPlayerId],
  );
  const addValidationError = addPlayerId.trim().length > 0 ? addValidation.error : undefined;
  const addIsValid = addPlayerId.trim().length > 0 && addValidation.isValid;

  const editValidation = useMemo(() => appData.validatePlayerIdInput(editPlayerIdInput), [appData, editPlayerIdInput]);
  const editDuplicateError = useMemo(
    () => appData.getEditManualPlayerDuplicateError(selectedTeamId, editPlayerIdInput, currentEditPlayerId),
    [appData, selectedTeamId, editPlayerIdInput, currentEditPlayerId],
  );
  const editValidationError = editPlayerIdInput.trim().length > 0 ? editValidation.error : undefined;
  const editIsValid = editPlayerIdInput.trim().length > 0 && editValidation.isValid;

  return {
    addValidationError,
    addIsDuplicate: Boolean(addDuplicateError),
    addIsValid,
    editValidationError,
    editIsDuplicate: Boolean(editDuplicateError),
    editIsValid,
  };
}

type PlayerIdValidationState = ReturnType<typeof usePlayerIdValidation>;
type PlayerSheetState = ReturnType<typeof usePlayerSheetState>;

function usePlayerSheetState() {
  const [showAddPlayerSheet, setShowAddPlayerSheet] = useState(false);
  const [showEditPlayerSheet, setShowEditPlayerSheet] = useState<{ open: boolean; playerId: number | null }>({
    open: false,
    playerId: null,
  });
  const [addPlayerId, setAddPlayerId] = useState('');
  const [editPlayerIdInput, setEditPlayerIdInput] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  return {
    showAddPlayerSheet,
    setShowAddPlayerSheet,
    showEditPlayerSheet,
    setShowEditPlayerSheet,
    addPlayerId,
    setAddPlayerId,
    editPlayerIdInput,
    setEditPlayerIdInput,
    isSubmittingEdit,
    setIsSubmittingEdit,
    editError,
    setEditError,
  };
}

function PlayerSheetsContainer({
  sheetState,
  validation,
  editActions,
}: {
  sheetState: PlayerSheetState;
  validation: PlayerIdValidationState;
  editActions: ReturnType<typeof usePlayerEditActions>;
}) {
  const {
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
  } = sheetState;
  const { addValidationError, addIsDuplicate, addIsValid, editValidationError, editIsDuplicate, editIsValid } =
    validation;

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
      addValidationError={addValidationError}
      addIsDuplicate={addIsDuplicate}
      addIsValid={addIsValid}
      showEditPlayerSheet={showEditPlayerSheet}
      setShowEditPlayerSheet={setShowEditPlayerSheet}
      editPlayerIdInput={editPlayerIdInput}
      setEditPlayerIdInput={setEditPlayerIdInput}
      isSubmittingEdit={isSubmittingEdit}
      setIsSubmittingEdit={setIsSubmittingEdit}
      editError={editError}
      setEditError={setEditError}
      editValidationError={editValidationError}
      editIsDuplicate={editIsDuplicate}
      editIsValid={editIsValid}
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
  const appData = useAppData();
  const error = appData.state.error;
  const selectedTeamId = appData.state.selectedTeamId;
  if (!selectedTeamId) {
    throw new Error('No selected team ID');
  }
  const { selectedPlayer, selectedPlayerId, selectPlayer } = usePlayerSelectionHook();
  const { viewMode, setViewMode, playerDetailsViewMode, setPlayerDetailsViewMode } = usePlayerViewModesHook();
  const preferredSite: PreferredExternalSite = useConfigContext().config.preferredExternalSite;

  const { manualPlayerIds, sortedPlayers, teamPlayers } = appData.getTeamPlayersViewData(
    Array.from(appData.players.values()),
    selectedTeamId,
  );
  const { hiddenPlayers, setShowHiddenModal, visiblePlayers } = useHiddenPlayersHook(sortedPlayers);
  const playerListViewEntries = useMemo(
    () => appData.getPlayerListViewEntries(visiblePlayers),
    [appData, visiblePlayers],
  );

  const resizableLayoutRef = useRef<ResizablePlayerLayoutRef | null>(null);
  const sheetState = usePlayerSheetState();
  const { showEditPlayerSheet, addPlayerId, editPlayerIdInput } = sheetState;

  const waitForPlayerReady = useWaitForPlayerReadySource(teamPlayers);
  const scrollToPlayer = usePlayerScroll(resizableLayoutRef);
  const { addPlayerToTeam, removeManualPlayer, editManualPlayer } = useTeamPlayerOperations();
  const addPlayer = useCallback(async (accountId: number) => appData.loadPlayer(accountId), [appData]);
  const refreshPlayer = useCallback(async (accountId: number) => appData.refreshPlayer(accountId), [appData]);

  const editActions = usePlayerEditActions({
    addPlayer,
    addPlayerToTeam: selectedTeamId ? addPlayerToTeam : undefined,
    removeManualPlayer,
    editManualPlayer,
    selectPlayer,
    waitForPlayerReady,
    scrollToPlayer,
  });

  const listActions = usePlayerListActions({
    refreshPlayer,
    resizableLayoutRef,
    setShowAddPlayerSheet: sheetState.setShowAddPlayerSheet,
  });
  const currentEditPlayerId = showEditPlayerSheet.playerId ?? 0;
  const validation = usePlayerIdValidation({
    appData,
    selectedTeamId,
    addPlayerId,
    editPlayerIdInput,
    currentEditPlayerId,
  });

  const contentProps = {
    resizableLayoutRef,
    visiblePlayers,
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
    setShowAddPlayerSheet: sheetState.setShowAddPlayerSheet,
    manualPlayerIds,
    handleEditManualPlayer: (playerId: number) => {
      sheetState.setEditPlayerIdInput(String(playerId));
      sheetState.setShowEditPlayerSheet({ open: true, playerId });
    },
    handleRemoveManualPlayer: editActions.handleRemoveManualPlayer,
    playerListViewEntries,
    preferredSite,
  } as const;

  const renderContent = () => {
    if (error) return <ErrorContent error={error} />;
    return <PlayerStatsContent {...contentProps} />;
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>{renderContent()}</Suspense>
      <PlayerSheetsContainer sheetState={sheetState} validation={validation} editActions={editActions} />
    </ErrorBoundary>
  );
}

export function PlayerStatsPage(): React.ReactElement {
  return <PlayerStatsPageInner />;
}

function PlayerStatsContent({
  resizableLayoutRef,
  visiblePlayers,
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
  playerListViewEntries,
  preferredSite,
}: {
  resizableLayoutRef: React.RefObject<ResizablePlayerLayoutRef | null>;
  visiblePlayers: Player[];
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
  playerListViewEntries: PlayerListViewEntry[];
  preferredSite: PreferredExternalSite;
}) {
  return (
    <ResizablePlayerLayout
      ref={resizableLayoutRef}
      visiblePlayers={visiblePlayers}
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
      selectedPlayer={selectedPlayer}
      playerDetailsViewMode={playerDetailsViewMode}
      setPlayerDetailsViewMode={setPlayerDetailsViewMode}
      onScrollToPlayer={handleScrollToPlayer}
      onAddPlayer={() => setShowAddPlayerSheet(true)}
      manualPlayerIds={manualPlayerIds}
      onEditPlayer={handleEditManualPlayer}
      onRemovePlayer={handleRemoveManualPlayer}
      playerListViewEntries={playerListViewEntries}
      preferredSite={preferredSite}
    />
  );
}
function PlayerSheets({
  showAddPlayerSheet,
  setShowAddPlayerSheet,
  addPlayerId,
  setAddPlayerId,
  onSubmitAdd,
  addValidationError,
  addIsDuplicate,
  addIsValid,
  showEditPlayerSheet,
  setShowEditPlayerSheet,
  editPlayerIdInput,
  setEditPlayerIdInput,
  isSubmittingEdit,
  setIsSubmittingEdit,
  editError,
  setEditError,
  editValidationError,
  editIsDuplicate,
  editIsValid,
  onSubmitEdit,
}: {
  showAddPlayerSheet: boolean;
  setShowAddPlayerSheet: (open: boolean) => void;
  addPlayerId: string;
  setAddPlayerId: (val: string) => void;
  onSubmitAdd: () => Promise<void>;
  addValidationError: string | undefined;
  addIsDuplicate: boolean;
  addIsValid: boolean;
  showEditPlayerSheet: { open: boolean; playerId: number | null };
  setShowEditPlayerSheet: (s: { open: boolean; playerId: number | null }) => void;
  editPlayerIdInput: string;
  setEditPlayerIdInput: (val: string) => void;
  isSubmittingEdit: boolean;
  setIsSubmittingEdit: (b: boolean) => void;
  editError: string | undefined;
  setEditError: (s: string | undefined) => void;
  editValidationError: string | undefined;
  editIsDuplicate: boolean;
  editIsValid: boolean;
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
        validationError={addValidationError}
        isDuplicate={addIsDuplicate}
        isValid={addIsValid}
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
        validationError={editValidationError}
        isDuplicate={editIsDuplicate}
        isValid={editIsValid}
      />
    </>
  );
}
