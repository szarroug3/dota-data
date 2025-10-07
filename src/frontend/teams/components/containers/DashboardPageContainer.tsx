'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { AddTeamForm } from '@/frontend/teams/components/stateless/AddTeamForm';
import { EditTeamSheet } from '@/frontend/teams/components/stateless/EditTeamSheet';
import { TeamList } from '@/frontend/teams/components/stateless/TeamList';
import { useAppData } from '@/hooks/use-app-data';
import { validateTeamForm } from '@/utils/validation';

function convertToNumber(value: string, fieldName: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid ${fieldName}: must be a positive number`);
  }
  return num;
}

function convertTeamIds(teamId: string, leagueId: string): { teamId: number; leagueId: number } {
  return {
    teamId: convertToNumber(teamId, 'team ID'),
    leagueId: convertToNumber(leagueId, 'league ID'),
  };
}

function useAddTeamForm(appData: ReturnType<typeof useAppData>) {
  const [teamId, setTeamId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setTeamId('');
    setLeagueId('');
  }, []);

  const handleSubmit = useCallback(
    async (newTeamId: string, newLeagueId: string) => {
      try {
        setIsSubmitting(true);
        const { teamId: tId, leagueId: lId } = convertTeamIds(newTeamId, newLeagueId);
        await appData.loadTeam(tId, lId);
        reset();
      } catch (error) {
        console.error('Failed to add team:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [appData, reset],
  );

  const checkTeamExists = useCallback(() => {
    const key = `${teamId}-${leagueId}`;
    return appData.getTeam(key) !== undefined;
  }, [appData, teamId, leagueId]);

  return { teamId, leagueId, setTeamId, setLeagueId, isSubmitting, handleSubmit, checkTeamExists, reset };
}

function useEditTeamSheet(appData: ReturnType<typeof useAppData>) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState('');
  const [currentLeagueId, setCurrentLeagueId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [newLeagueId, setNewLeagueId] = useState('');

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
  }, []);

  const handleEditTeam = useCallback((tId: number, lId: number) => open(String(tId), String(lId)), [open]);

  const handleSave = useCallback(async () => {
    try {
      const { teamId: newT, leagueId: newL } = convertTeamIds(newTeamId, newLeagueId);
      const { teamId: curT, leagueId: curL } = convertTeamIds(currentTeamId, currentLeagueId);

      const oldKey = `${curT}-${curL}`;
      const newKey = `${newT}-${newL}`;

      // If IDs haven't changed, nothing to do
      if (oldKey === newKey) {
        close();
        return;
      }

      appData.removeTeam(oldKey);
      await appData.loadTeam(newT, newL);
      close();
    } catch (error) {
      console.error('Failed to save edited team:', error);
      appData.saveToStorage();
      close();
    }
  }, [appData, currentTeamId, currentLeagueId, newTeamId, newLeagueId, close]);

  const teamExistsFor = useCallback((t: string, l: string) => appData.getTeam(`${t}-${l}`) !== undefined, [appData]);

  const validation = useMemo(() => validateTeamForm(newTeamId, newLeagueId), [newTeamId, newLeagueId]);

  const buttonState = useMemo(() => {
    if (!newTeamId.trim() || !newLeagueId.trim()) {
      return { text: 'Save Changes', disabled: true } as const;
    }
    if (!validation.isValid) {
      return { text: 'Save Changes', disabled: true } as const;
    }
    return teamExistsFor(newTeamId, newLeagueId)
      ? ({ text: 'Team already imported', disabled: true } as const)
      : ({ text: 'Save Changes', disabled: false } as const);
  }, [newTeamId, newLeagueId, validation.isValid, teamExistsFor]);

  const teamIdError = newTeamId.trim().length > 0 ? validation.errors.teamId : undefined;
  const leagueIdError = newLeagueId.trim().length > 0 ? validation.errors.leagueId : undefined;

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
    buttonState,
    teamIdError,
    leagueIdError,
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
      const teamKey = `${t}-${l}`;
      appData.setSelectedTeam(teamKey);
    },
    [appData],
  );

  return { activeTeam, handleSetActiveTeam };
}

function useRemoveTeam(appData: ReturnType<typeof useAppData>) {
  const handleRemoveTeam = useCallback(
    async (teamId: number, leagueId: number) => {
      try {
        const teamKey = `${teamId}-${leagueId}`;
        appData.removeTeam(teamKey);
        appData.saveToStorage();
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

  const orderedTeams = useMemo(() => {
    const list = appData.getAllTeamsForDisplay();

    if (!activeTeam) return list;

    const activeIndex = list.findIndex(
      (t) => t && t.team.id === activeTeam.teamId && t.league.id === activeTeam.leagueId,
    );

    if (activeIndex <= 0) return list;

    const [active] = list.splice(activeIndex, 1);

    if (!active) return list;
    return [active, ...list];
    // this okay because we're using the appData.teams map inside the functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData.teams, activeTeam]);

  return (
    <>
      <AddTeamForm
        teamId={addForm.teamId}
        leagueId={addForm.leagueId}
        onTeamIdChange={addForm.setTeamId}
        onLeagueIdChange={addForm.setLeagueId}
        onAddTeam={addForm.handleSubmit}
        teamExists={addForm.checkTeamExists}
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
        isSubmitting={false}
        error={undefined}
        teamIdError={editSheet.teamIdError}
        leagueIdError={editSheet.leagueIdError}
        buttonText={editSheet.buttonState.text}
        buttonDisabled={editSheet.buttonState.disabled}
      />
    </>
  );
}
