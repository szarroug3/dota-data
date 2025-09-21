'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { AddTeamForm } from '@/frontend/teams/components/stateless/AddTeamForm';
import { EditTeamSheet } from '@/frontend/teams/components/stateless/EditTeamSheet';
import { TeamList } from '@/frontend/teams/components/stateless/TeamList';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';

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

function useAddTeamForm(teamContext: ReturnType<typeof useTeamContext>) {
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
        await teamContext.addTeam(tId, lId);
        reset();
      } catch (error) {
        console.error('Failed to add team:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [teamContext, reset],
  );

  const checkTeamExists = useCallback(() => {
    const key = `${teamId}-${leagueId}`;
    return teamContext.teams.has(key);
  }, [teamContext.teams, teamId, leagueId]);

  return { teamId, leagueId, setTeamId, setLeagueId, isSubmitting, handleSubmit, checkTeamExists, reset };
}

function useEditTeamSheet(teamContext: ReturnType<typeof useTeamContext>) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState('');
  const [editingLeagueId, setEditingLeagueId] = useState('');

  const open = useCallback((t: string, l: string) => {
    setEditingTeamId(t);
    setEditingLeagueId(l);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingTeamId('');
    setEditingLeagueId('');
  }, []);

  const handleEditTeam = useCallback((tId: number, lId: number) => open(String(tId), String(lId)), [open]);

  const handleSave = useCallback(
    async (newTeamId: string, newLeagueId: string) => {
      try {
        const { teamId: newT, leagueId: newL } = convertTeamIds(newTeamId, newLeagueId);
        const { teamId: curT, leagueId: curL } = convertTeamIds(editingTeamId, editingLeagueId);
        await teamContext.editTeam(curT, curL, newT, newL);
        close();
      } catch (error) {
        console.error('Failed to save edited team:', error);
      }
    },
    [teamContext, editingTeamId, editingLeagueId, close],
  );

  const teamExistsFor = useCallback((t: string, l: string) => teamContext.teams.has(`${t}-${l}`), [teamContext.teams]);

  const buttonState = useMemo(() => {
    if (!editingTeamId.trim() || !editingLeagueId.trim()) {
      return { text: 'Save Changes', disabled: true } as const;
    }
    return teamExistsFor(editingTeamId, editingLeagueId)
      ? ({ text: 'Team already imported', disabled: true } as const)
      : ({ text: 'Save Changes', disabled: false } as const);
  }, [editingTeamId, editingLeagueId, teamExistsFor]);

  return {
    isOpen,
    open,
    close,
    editingTeamId,
    editingLeagueId,
    setEditingTeamId,
    setEditingLeagueId,
    handleEditTeam,
    handleSave,
    buttonState,
  };
}

function useActiveTeam(teamContext: ReturnType<typeof useTeamContext>) {
  const activeTeam = teamContext.selectedTeamId
    ? { teamId: teamContext.selectedTeamId.teamId, leagueId: teamContext.selectedTeamId.leagueId }
    : null;

  const handleSetActiveTeam = useCallback(
    async (t: number, l: number) => {
      teamContext.setSelectedTeamId(t, l);
    },
    [teamContext],
  );

  return { activeTeam, handleSetActiveTeam };
}

export function DashboardPageContainer(): React.ReactElement {
  const teamContext = useTeamContext();

  const addForm = useAddTeamForm(teamContext);
  const editSheet = useEditTeamSheet(teamContext);
  const { activeTeam, handleSetActiveTeam } = useActiveTeam(teamContext);

  const orderedTeams = useMemo(() => {
    const list = Array.from(teamContext.teams.values());
    if (!activeTeam) return list;
    const activeIndex = list.findIndex((t) => t.team.id === activeTeam.teamId && t.league.id === activeTeam.leagueId);
    if (activeIndex <= 0) return list;
    const [active] = list.splice(activeIndex, 1);
    return [active, ...list];
  }, [teamContext.teams, activeTeam]);

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
        onRefreshTeam={teamContext.refreshTeam}
        onRemoveTeam={teamContext.removeTeam}
        onSetActiveTeam={handleSetActiveTeam as (teamId: number, leagueId: number) => Promise<void>}
        onEditTeam={editSheet.handleEditTeam}
      />

      <EditTeamSheet
        isOpen={editSheet.isOpen}
        onClose={editSheet.close}
        currentTeamId={editSheet.editingTeamId}
        currentLeagueId={editSheet.editingLeagueId}
        newTeamId={editSheet.editingTeamId}
        newLeagueId={editSheet.editingLeagueId}
        onChangeTeamId={editSheet.setEditingTeamId}
        onChangeLeagueId={editSheet.setEditingLeagueId}
        onSubmit={() => editSheet.handleSave(editSheet.editingTeamId, editSheet.editingLeagueId)}
        isSubmitting={false}
        error={undefined}
        teamIdError={undefined}
        leagueIdError={undefined}
        buttonText={editSheet.buttonState.text}
        buttonDisabled={editSheet.buttonState.disabled}
      />
    </>
  );
}
