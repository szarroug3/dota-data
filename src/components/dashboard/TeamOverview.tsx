import React from 'react';

import { useTeamData } from '@/hooks/use-team-data';
import type { Team } from '@/types/contexts/team-context-value';

import { RecentPerformance } from './RecentPerformance';


interface TeamOverviewProps {
  teamData: {
    totalMatches?: number;
    winRate?: number;
    recentTrend?: string;
    recentMatches?: Match[];
  };
}

interface Match {
  id: string;
  win: boolean;
}

const TeamOverviewHeader: React.FC<{ teamName?: string; leagueName?: string }> = ({ teamName, leagueName }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
      {teamName || 'Team Overview'}
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      {leagueName || 'League information'}
    </p>
  </div>
);

const TeamSwitcher: React.FC<{ teams: Team[]; activeTeamId: string | null; onSwitch: (teamId: string) => void }> = ({ teams, activeTeamId, onSwitch }) => (
  <div className="relative">
    <select
      value={activeTeamId || ''}
      onChange={(e) => onSwitch(e.target.value)}
      className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
    >
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name || `Team ${team.id}`}
        </option>
      ))}
    </select>
  </div>
);

const QuickStats: React.FC<{ totalMatches?: number; winRate?: number; recentTrend?: string }> = ({ totalMatches, winRate, recentTrend }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <StatCard title="Total Matches" value={totalMatches || 0} icon="🎮" />
    <StatCard title="Win Rate" value={`${winRate || 0}%`} icon="🏆" />
    <StatCard title="Recent Trend" value={recentTrend || 'Stable'} icon="📈" />
  </div>
);

export const TeamOverview: React.FC<TeamOverviewProps> = ({ teamData }) => {
  const { teams, activeTeamId, setActiveTeam } = useTeamData();
  const activeTeam = teams?.find((team) => team.id === activeTeamId);

  const handleTeamSwitch = (teamId: string) => {
    setActiveTeam(teamId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <TeamOverviewHeader teamName={activeTeam?.name} leagueName={activeTeam?.leagueName} />
        {teams && teams.length > 1 && (
          <TeamSwitcher teams={teams} activeTeamId={activeTeamId} onSwitch={handleTeamSwitch} />
        )}
      </div>
      <QuickStats totalMatches={teamData?.totalMatches} winRate={teamData?.winRate} recentTrend={teamData?.recentTrend} />
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Performance</h3>
        <RecentPerformance matches={teamData?.recentMatches} />
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}; 