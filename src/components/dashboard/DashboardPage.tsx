'use client';

import React, { useCallback, useState } from 'react';

import { useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useTeamContext } from '@/contexts/team-context';
import { useMatchData } from '@/hooks/use-match-data';
import { usePlayerData } from '@/hooks/use-player-data';
import { useTeamData } from '@/hooks/use-team-data';

import { AddTeamForm } from './AddTeamForm';
import { EditTeamModal } from './EditTeamModal';
import { TeamList } from './TeamList';

// ============================================================================
// Main Dashboard Component
// ============================================================================
export const DashboardPage: React.FC = () => {
  const form = useTeamForm();
  const modal = useEditTeamModal();
  const actions = useDashboardActions();
  const teamData = useTeamData();
  const teamContext = useTeamContext();

  // Handle form submission
  const handleSubmit = useCallback(async (newTeamId: string, newLeagueId: string) => {
    try {
      form.setIsSubmitting(true);
      await actions.handleAddTeam(newTeamId, newLeagueId);
      form.reset();
    } catch (error) {
      console.error('Failed to add team:', error);
      // The error will be displayed in the team card if it's a team-specific error
      // For now, we just log it to avoid the stack trace in the console
    } finally {
      form.setIsSubmitting(false);
    }
  }, [actions, form]);

  // Check if team already exists
  const checkTeamExists = useCallback(() => {
    return teamData.teams.some(team => 
      team.id === form.teamId && team.leagueId === form.leagueId
    );
  }, [teamData.teams, form.teamId, form.leagueId]);

  // Handle edit team
  const handleEditTeam = useCallback((teamId: string, leagueId: string) => {
    modal.open(teamId, leagueId);
  }, [modal]);

  // Handle edit team save
  const handleEditTeamSave = useCallback(async (newTeamId: string, newLeagueId: string) => {
    try {
      await actions.handleEditTeam(modal.editingTeamId, modal.editingLeagueId, newTeamId, newLeagueId);
      modal.close();
    } catch (error) {
      console.error('Failed to save edited team:', error);
      // The error will be displayed in the team card if it's a team-specific error
      // For now, we just log it to avoid the stack trace in the console
    } finally {
      // No need to set isSubmitting here, as it's handled by the action
    }
  }, [actions, modal]);

  return (
    <>
      <AddTeamForm
        teamId={form.teamId}
        leagueId={form.leagueId}
        onTeamIdChange={form.setTeamId}
        onLeagueIdChange={form.setLeagueId}
        onAddTeam={handleSubmit}
        teamExists={checkTeamExists}
        isSubmitting={form.isSubmitting}
        onReset={form.reset}
      />

      <TeamList
        teamDataList={teamContext.teamDataList}
        activeTeam={teamContext.activeTeam}
        onRefreshTeam={actions.handleRefreshTeam}
        onRemoveTeam={teamContext.removeTeam}
        onSetActiveTeam={teamContext.setActiveTeam}
        onEditTeam={handleEditTeam}
      />

      <EditTeamModal
        isOpen={modal.isEditModalOpen}
        onClose={modal.close}
        currentTeamId={modal.editingTeamId}
        currentLeagueId={modal.editingLeagueId}
        onSave={handleEditTeamSave}
        teamExists={checkTeamExists}
      />
    </>
  );
};

// ============================================================================
// Internal: Team Form State Hook
// ============================================================================
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

// ============================================================================
// Internal: Edit Team Modal Hook
// ============================================================================
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

// ============================================================================
// Internal: Dashboard Actions Hook
// ============================================================================
function useDashboardActions() {
  const teamData = useTeamData();
  const matchData = useMatchData();
  const playerData = usePlayerData();
  const { addTeamWithFullData, refreshTeamWithFullData } = useDataCoordinator();

  const handleAddTeam = useCallback(async (teamId: string, leagueId: string) => {
    try {
      // Use the data coordinator to add team with full data (including matches)
      await addTeamWithFullData(teamId, leagueId);
    } catch (error) {
      console.error('Failed to add team:', error);
      // Don't re-throw the error - let the team be added with error state
      // The team context will handle displaying the error in the UI
    }
  }, [addTeamWithFullData]);

  const handleRemoveTeam = useCallback(async (teamId: string, _leagueId: string) => {
    try {
      await teamData.removeTeam(teamId);
    } catch (error) {
      console.error('Failed to remove team:', error);
      throw error;
    }
  }, [teamData]);

  const handleRefreshTeam = useCallback(async (teamId: string, leagueId: string) => {
    try {
      await refreshTeamWithFullData(teamId, leagueId);
    } catch (error) {
      console.error('Failed to refresh team:', error);
      // Don't re-throw the error - let the team be refreshed with error state
    }
  }, [refreshTeamWithFullData]);

  const handleSetActiveTeam = useCallback(async (teamId: string, _leagueId: string) => {
    try {
      await teamData.setActiveTeam(teamId);
    } catch (error) {
      console.error('Failed to set active team:', error);
      throw error;
    }
  }, [teamData]);

  const handleEditTeam = useCallback(async (currentTeamId: string, currentLeagueId: string, newTeamId: string, newLeagueId: string) => {
    try {
      // Remove the old team and add the new one with full data
      await teamData.removeTeam(currentTeamId);
      await addTeamWithFullData(newTeamId, newLeagueId);
    } catch (error) {
      console.error('Failed to edit team:', error);
      // Don't re-throw the error - handle it gracefully in the UI
    }
  }, [teamData, addTeamWithFullData]);

  const handleClearErrors = useCallback(() => {
    teamData.clearErrors();
    matchData.clearErrors();
    playerData.clearErrors();
  }, [teamData, matchData, playerData]);

  return {
    handleAddTeam,
    handleRemoveTeam,
    handleRefreshTeam,
    handleSetActiveTeam,
    handleEditTeam,
    handleClearErrors
  };
} 