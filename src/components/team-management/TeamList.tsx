import React from 'react';

import { useTeamData } from '@/hooks/use-team-data';

import { TeamCard } from './TeamCard';

export const TeamList: React.FC = () => {
  const { teams, activeTeamId, setActiveTeam, removeTeam, refreshTeam, updateTeam } = useTeamData();

  const handleSwitchTeam = (teamId: string) => {
    setActiveTeam(teamId);
  };

  const handleRemoveTeam = async (teamId: string) => {
    try {
      await removeTeam(teamId);
    } catch (error) {
      console.error('Failed to remove team:', error);
    }
  };

  const handleRefreshTeam = async (teamId: string) => {
    try {
      await refreshTeam(teamId);
    } catch (error) {
      console.error('Failed to refresh team:', error);
    }
  };

  const handleUpdateTeam = async (teamId: string) => {
    try {
      await updateTeam(teamId);
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  if (!teams || teams.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Teams Added
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first team above to start tracking performance and analyzing matches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Your Teams
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {teams.length} team{teams.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            isActive={team.id === activeTeamId}
            onSwitch={() => handleSwitchTeam(team.id)}
            onRemove={() => handleRemoveTeam(team.id)}
            onRefresh={() => handleRefreshTeam(team.id)}
            onUpdate={() => handleUpdateTeam(team.id)}
          />
        ))}
      </div>
    </div>
  );
}; 