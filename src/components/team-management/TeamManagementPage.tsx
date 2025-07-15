'use client';

import React, { useCallback, useState } from 'react';

import { useTeamContext } from '@/contexts/team-context';

import { AddTeamForm } from './AddTeamForm';
import { EditTeamModal } from './EditTeamModal';
import { TeamList } from './TeamList';

function useEditTeamModal() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState('');
  const [editingLeagueId, setEditingLeagueId] = useState('');

  const open = useCallback((teamId: string, leagueId: string) => {
    setEditingTeamId(teamId);
    setEditingLeagueId(leagueId);
    setIsEditModalOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingTeamId('');
    setEditingLeagueId('');
  }, []);

  return {
    isEditModalOpen,
    editingTeamId,
    editingLeagueId,
    open,
    close,
  };
}

function useTeamForm() {
  const [teamId, setTeamId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setTeamId('');
    setLeagueId('');
  }, []);

  return {
    teamId,
    setTeamId,
    leagueId,
    setLeagueId,
    isSubmitting,
    setIsSubmitting,
    reset,
  };
}

async function handleAddTeamWrapper(
  addTeam: (teamId: string, leagueId: string) => Promise<void>,
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
  setTeamId: React.Dispatch<React.SetStateAction<string>>,
  setLeagueId: React.Dispatch<React.SetStateAction<string>>,
  newTeamId: string,
  newLeagueId: string
) {
  try {
    setIsSubmitting(true);
    await addTeam(newTeamId, newLeagueId);
    setTeamId('');
    setLeagueId('');
  } catch (error) {
    console.error('Failed to add team:', error);
  } finally {
    setIsSubmitting(false);
  }
}

function useTeamHandlers(
  addTeam: (teamId: string, leagueId: string) => Promise<void>,
  updateTeam: (oldTeamId: string, oldLeagueId: string, newTeamId: string, newLeagueId: string) => Promise<void>,
  teamExists: (teamId: string, leagueId: string) => boolean,
  form: ReturnType<typeof useTeamForm>,
  modal: ReturnType<typeof useEditTeamModal>
) {
  const handleAddTeam = useCallback(
    (newTeamId: string, newLeagueId: string) =>
      handleAddTeamWrapper(addTeam, form.setIsSubmitting, form.setTeamId, form.setLeagueId, newTeamId, newLeagueId),
    [addTeam, form.setIsSubmitting, form.setTeamId, form.setLeagueId]
  );

  const handleEditTeam = useCallback((teamId: string, leagueId: string) => {
    modal.open(teamId, leagueId);
  }, [modal]);

  const handleSaveTeamChanges = useCallback(async (
    oldTeamId: string,
    oldLeagueId: string,
    newTeamId: string,
    newLeagueId: string
  ) => {
    try {
      await updateTeam(oldTeamId, oldLeagueId, newTeamId, newLeagueId);
    } finally {
      modal.close();
    }
  }, [updateTeam, modal]);

  const checkTeamExists = useCallback(() => {
    return teamExists(form.teamId, form.leagueId);
  }, [teamExists, form.teamId, form.leagueId]);

  return {
    handleAddTeam,
    handleEditTeam,
    handleSaveTeamChanges,
    checkTeamExists,
  };
}

export const TeamManagementPage: React.FC = () => {
  const form = useTeamForm();
  const modal = useEditTeamModal();
  const context = useTeamContext();

  const handlers = useTeamHandlers(
    context.addTeam,
    context.updateTeam,
    context.teamExists,
    form,
    modal
  );

  return (
    <>
      <AddTeamForm
        teamId={form.teamId}
        leagueId={form.leagueId}
        onTeamIdChange={form.setTeamId}
        onLeagueIdChange={form.setLeagueId}
        onAddTeam={handlers.handleAddTeam}
        teamExists={handlers.checkTeamExists}
        isSubmitting={form.isSubmitting}
        onReset={form.reset}
      />

      <TeamList
        teamDataList={context.teamDataList}
        activeTeam={context.activeTeam}
        onRefreshTeam={context.refreshTeam}
        onRemoveTeam={context.removeTeam}
        onSetActiveTeam={context.setActiveTeam}
        onEditTeam={handlers.handleEditTeam}
      />

      <EditTeamModal
        isOpen={modal.isEditModalOpen}
        onClose={modal.close}
        currentTeamId={modal.editingTeamId}
        currentLeagueId={modal.editingLeagueId}
        onSave={handlers.handleSaveTeamChanges}
        teamExists={context.teamExists}
      />
    </>
  );
}; 