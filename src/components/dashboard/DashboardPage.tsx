'use client';

import React, { useCallback, useState } from 'react';

import { useTeamContext } from '@/contexts/team-context';

import { AddTeamForm } from './AddTeamForm';
import { EditTeamSheet } from './EditTeamModal';
import { TeamList } from './TeamList';

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Safely convert string IDs to numbers with validation
 */
function convertToNumber(value: string, fieldName: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid ${fieldName}: must be a positive number`);
  }
  return num;
}

/**
 * Convert team and league IDs from strings to numbers
 */
function convertTeamIds(teamId: string, leagueId: string): { teamId: number; leagueId: number } {
  return {
    teamId: convertToNumber(teamId, 'team ID'),
    leagueId: convertToNumber(leagueId, 'league ID')
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const DashboardPage: React.FC = () => {
  const form = useTeamForm();
  const modal = useEditTeamModal();
  const actions = useDashboardActions();
  const teamContext = useTeamContext();

  // Handle form submission
  const handleSubmit = useCallback(async (newTeamId: string, newLeagueId: string) => {
    try {
      form.setIsSubmitting(true);
      const { teamId, leagueId } = convertTeamIds(newTeamId, newLeagueId);
      await actions.handleAddTeam(teamId, leagueId);
      form.reset();
    } catch (error) {
      console.error('Failed to add team:', error);
    } finally {
      form.setIsSubmitting(false);
    }
  }, [actions, form]);

  // Check if team already exists
  const checkTeamExists = useCallback(() => {
    const teamKey = `${form.teamId}-${form.leagueId}`;
    return teamContext.teams.has(teamKey);
  }, [teamContext.teams, form.teamId, form.leagueId]);

  // Handle edit team
  const handleEditTeam = useCallback((teamId: number, leagueId: number) => {
    modal.open(teamId.toString(), leagueId.toString());
  }, [modal]);

  // Handle edit team save
  const handleEditTeamSave = useCallback(async (newTeamId: string, newLeagueId: string) => {
    try {
      const { teamId: newTeamIdNum, leagueId: newLeagueIdNum } = convertTeamIds(newTeamId, newLeagueId);
      const { teamId: currentTeamId, leagueId: currentLeagueId } = convertTeamIds(modal.editingTeamId, modal.editingLeagueId);
      await actions.handleEditTeam(currentTeamId, currentLeagueId, newTeamIdNum, newLeagueIdNum);
      modal.close();
    } catch (error) {
      console.error('Failed to save edited team:', error);
    }
  }, [actions, modal]);

  // Convert selectedTeamId to the format expected by TeamList
  const activeTeam = teamContext.selectedTeamId ? {
    teamId: teamContext.selectedTeamId.teamId,
    leagueId: teamContext.selectedTeamId.leagueId
  } : null;

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
        teamDataList={Array.from(teamContext.teams.values())}
        activeTeam={activeTeam}
        onRefreshTeam={actions.handleRefreshTeam}
        onRemoveTeam={actions.handleRemoveTeam}
        onSetActiveTeam={actions.handleSetActiveTeam}
        onEditTeam={handleEditTeam}
      />

      <EditTeamSheet
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
  const teamContext = useTeamContext();

  const handleAddTeam = useCallback(async (teamId: number, leagueId: number) => {
    try {
      // Use team context directly to add team
      await teamContext.addTeam(teamId, leagueId);
    } catch (error) {
      console.error('Failed to add team:', error);
    }
  }, [teamContext]);

  const handleRemoveTeam = useCallback(async (teamId: number, leagueId: number) => {
    try {
      // Use team context for removal
      teamContext.removeTeam(teamId, leagueId);
    } catch (error) {
      console.error('Failed to remove team:', error);
      throw error;
    }
  }, [teamContext]);

  const handleRefreshTeam = useCallback(async (teamId: number, leagueId: number) => {
    try {
      await teamContext.refreshTeam(teamId, leagueId);
    } catch (error) {
      console.error('Failed to refresh team:', error);
    }
  }, [teamContext]);

  const handleSetActiveTeam = useCallback(async (teamId: number, leagueId: number) => {
    try {
      teamContext.setSelectedTeamId(teamId, leagueId);
    } catch (error) {
      console.error('Failed to set active team:', error);
      throw error;
    }
  }, [teamContext]);

  const handleEditTeam = useCallback(async (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number) => {
    try {
      // Use team context to edit team in place
      await teamContext.editTeam(currentTeamId, currentLeagueId, newTeamId, newLeagueId);
    } catch (error) {
      console.error('Failed to edit team:', error);
    }
  }, [teamContext]);

  return {
    handleAddTeam,
    handleRemoveTeam,
    handleRefreshTeam,
    handleSetActiveTeam,
    handleEditTeam,
  };
} 