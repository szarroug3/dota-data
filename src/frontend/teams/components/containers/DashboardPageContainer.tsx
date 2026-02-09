'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { AddTeamForm } from '@/frontend/teams/components/stateless/AddTeamForm';
import { EditTeamSheet } from '@/frontend/teams/components/stateless/EditTeamSheet';
import { TeamList } from '@/frontend/teams/components/stateless/TeamList';
import { useAppData } from '@/hooks/app-data/use-app-data';

function useAddTeamForm(appData: ReturnType<typeof useAppData>) {
  const [teamId, setTeamId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setTeamId('');
    setLeagueId('');
  }, []);

  const handleSubmit = useCallback(
    async (teamIdInput: string, leagueIdInput: string) => {
      try {
        setIsSubmitting(true);
        await appData.addTeamFromInputs(teamIdInput, leagueIdInput);
      } catch (error) {
        console.error('Failed to add team:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [appData],
  );

  const checkTeamExists = useCallback(() => {
    const validation = appData.validateTeamFormInputs(teamId, leagueId);
    if (!validation.isValid) {
      return false;
    }

    try {
      const parsedIds = appData.parseTeamIdsFromInputs(teamId, leagueId);
      const key = `${parsedIds.teamId}-${parsedIds.leagueId}`;
      return appData.getTeam(key) !== undefined;
    } catch (error) {
      console.error('Failed to parse team inputs for existence check:', error);
      return false;
    }
  }, [appData, teamId, leagueId]);

  return { teamId, leagueId, setTeamId, setLeagueId, isSubmitting, handleSubmit, checkTeamExists, reset };
}

function useEditTeamSheet(appData: ReturnType<typeof useAppData>) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState('');
  const [currentLeagueId, setCurrentLeagueId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [newLeagueId, setNewLeagueId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = useCallback((t: string, l: string) => {
    setCurrentTeamId(t);
    setCurrentLeagueId(l);
    setNewTeamId(t);
    setNewLeagueId(l);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentTeamId('');
    setCurrentLeagueId('');
    setNewTeamId('');
    setNewLeagueId('');
    setIsSubmitting(false);
  }, []);

  const handleEditTeam = useCallback((tId: number, lId: number) => open(String(tId), String(lId)), [open]);

  const handleSave = useCallback(
    async (payload: { current: { teamId: string; leagueId: string }; next: { teamId: string; leagueId: string } }) => {
      try {
        setIsSubmitting(true);
        const result = await appData.editTeamFromInputs(
          payload.current.teamId,
          payload.current.leagueId,
          payload.next.teamId,
          payload.next.leagueId,
        );
        if (!result.didChange) {
          close();
          return;
        }

        close();
      } catch (error) {
        console.error('Failed to save edited team:', error);
        close();
      } finally {
        setIsSubmitting(false);
      }
    },
    [appData, close],
  );

  const teamExistsFor = useCallback(
    (t: string, l: string) => {
      const validation = appData.validateTeamFormInputs(t, l);
      if (!validation.isValid) {
        return false;
      }

      try {
        const parsedIds = appData.parseTeamIdsFromInputs(t, l);
        return appData.getTeam(`${parsedIds.teamId}-${parsedIds.leagueId}`) !== undefined;
      } catch (error) {
        console.error('Failed to parse team inputs for duplicate check:', error);
        return false;
      }
    },
    [appData],
  );

  return {
    isOpen,
    open,
    close,
    currentTeamId,
    currentLeagueId,
    newTeamId,
    newLeagueId,
    setNewTeamId,
    setNewLeagueId,
    handleEditTeam,
    handleSave,
    teamExistsFor,
    isSubmitting,
  };
}

function useActiveTeam(appData: ReturnType<typeof useAppData>) {
  const activeTeamId = appData.state.selectedTeamId;
  const activeTeam = activeTeamId
    ? (() => {
        const team = appData.getTeam(activeTeamId);
        return team ? { teamId: team.teamId, leagueId: team.leagueId } : null;
      })()
    : null;

  const handleSetActiveTeam = useCallback(
    async (t: number, l: number) => {
      appData.setSelectedTeamByIds(t, l);
    },
    [appData],
  );

  return { activeTeam, handleSetActiveTeam };
}

function useRemoveTeam(appData: ReturnType<typeof useAppData>) {
  const handleRemoveTeam = useCallback(
    async (teamId: number, leagueId: number) => {
      try {
        appData.removeTeamByIds(teamId, leagueId);
      } catch (error) {
        console.error('Failed to remove team:', error);
      }
    },
    [appData],
  );

  return { handleRemoveTeam };
}

function useRefreshTeam(appData: ReturnType<typeof useAppData>) {
  const handleRefreshTeam = useCallback(
    async (teamId: number, leagueId: number) => {
      try {
        await appData.refreshTeam(teamId, leagueId);
      } catch (error) {
        console.error('Failed to refresh team:', error);
      }
    },
    [appData],
  );

  return { handleRefreshTeam };
}

export function DashboardPageContainer(): React.ReactElement {
  const appData = useAppData();

  const addForm = useAddTeamForm(appData);
  const editSheet = useEditTeamSheet(appData);
  const { activeTeam, handleSetActiveTeam } = useActiveTeam(appData);
  const { handleRemoveTeam } = useRemoveTeam(appData);
  const { handleRefreshTeam } = useRefreshTeam(appData);

  const addFormValidation = useMemo(() => {
    return appData.validateTeamFormInputs(addForm.teamId, addForm.leagueId);
  }, [addForm.leagueId, addForm.teamId, appData]);

  const editFormValidation = useMemo(() => {
    return appData.validateTeamFormInputs(editSheet.newTeamId, editSheet.newLeagueId);
  }, [appData, editSheet.newLeagueId, editSheet.newTeamId]);

  const orderedTeams = useMemo(() => {
    return appData.getAllTeamsForDisplayOrdered();
    // Dependencies:
    // - appData: access to methods
    // - appData.teams: re-run when teams change (triggered by updateTeamsRef)
    // Intentional: use appData.teams ref updates to refresh this memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, appData.teams]);

  return (
    <>
      <AddTeamForm
        teamId={addForm.teamId}
        leagueId={addForm.leagueId}
        onTeamIdChange={addForm.setTeamId}
        onLeagueIdChange={addForm.setLeagueId}
        onAddTeam={addForm.handleSubmit}
        teamExists={addForm.checkTeamExists}
        validation={addFormValidation}
        isSubmitting={addForm.isSubmitting}
        onReset={addForm.reset}
      />

      <TeamList
        teamDataList={orderedTeams}
        activeTeam={activeTeam}
        onRefreshTeam={handleRefreshTeam}
        onRemoveTeam={handleRemoveTeam}
        onSetActiveTeam={handleSetActiveTeam as (teamId: number, leagueId: number) => Promise<void>}
        onEditTeam={editSheet.handleEditTeam}
      />

      <EditTeamSheet
        isOpen={editSheet.isOpen}
        onClose={editSheet.close}
        currentTeamId={editSheet.currentTeamId}
        currentLeagueId={editSheet.currentLeagueId}
        newTeamId={editSheet.newTeamId}
        newLeagueId={editSheet.newLeagueId}
        onChangeTeamId={editSheet.setNewTeamId}
        onChangeLeagueId={editSheet.setNewLeagueId}
        onSubmit={editSheet.handleSave}
        teamExists={editSheet.teamExistsFor}
        validation={editFormValidation}
        isSubmitting={editSheet.isSubmitting}
        error={undefined}
      />
    </>
  );
}
