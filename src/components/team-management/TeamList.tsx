import React from 'react';

import type { TeamData } from '@/types/contexts/team-context-value';

import { TeamCard } from './TeamCard';

interface TeamListProps {
  teamDataList: TeamData[];
  activeTeam: { teamId: string; leagueId: string } | null;
  onRemoveTeam: (teamId: string, leagueId: string) => Promise<void>;
  onRefreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  onSetActiveTeam: (teamId: string, leagueId: string) => void;
  onEditTeam: (teamId: string, leagueId: string) => void;
}

export const TeamList: React.FC<TeamListProps> = ({ 
  teamDataList, 
  activeTeam,
  onRemoveTeam, 
  onRefreshTeam, 
  onSetActiveTeam,
  onEditTeam
}) => {
  if (teamDataList.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Teams Added
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add your first team using the form above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Your Teams ({teamDataList.length})
      </h2>
      <div className="space-y-3">
        {teamDataList.map((teamData) => (
          <TeamCard
            key={`${teamData.team.id}-${teamData.team.leagueId}`}
            teamData={teamData}
            isActive={activeTeam?.teamId === teamData.team.id && activeTeam?.leagueId === teamData.team.leagueId}
            onRemoveTeam={onRemoveTeam}
            onRefreshTeam={onRefreshTeam}
            onSetActiveTeam={onSetActiveTeam}
            onEditTeam={onEditTeam}
          />
        ))}
      </div>
    </div>
  );
}; 