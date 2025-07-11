import React, { useState } from 'react';

interface Team {
  id: string;
  name: string;
  league: string;
}

interface QuickLinksProps {
  teams: Team[];
  onTeamClick: (teamId: string) => void;
  isCollapsed: boolean;
}

const CollapsedQuickLinks: React.FC<{ onToggleTeams: () => void; onToggleLeagues: () => void }> = ({ onToggleTeams, onToggleLeagues }) => (
  <div className="p-4 space-y-4">
    <div className="flex justify-center">
      <button
        onClick={onToggleTeams}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        title="Teams"
      >
        👥
      </button>
    </div>
    <div className="flex justify-center">
      <button
        onClick={onToggleLeagues}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        title="Leagues"
      >
        🏆
      </button>
    </div>
  </div>
);

const ExpandedQuickLinks: React.FC<{
  teams: Team[];
  leagues: string[];
  teamsExpanded: boolean;
  leaguesExpanded: boolean;
  onToggleTeams: () => void;
  onToggleLeagues: () => void;
  onTeamClick: (teamId: string) => void;
}> = ({ teams, leagues, teamsExpanded, leaguesExpanded, onToggleTeams, onToggleLeagues, onTeamClick }) => (
  <div className="p-4 space-y-4">
    {/* Teams Section */}
    <div>
      <button
        onClick={onToggleTeams}
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <span className="flex items-center">
          <span className="mr-2">👥</span>
          Teams
        </span>
        <span className={`transform transition-transform duration-200 ${teamsExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {teamsExpanded && (
        <div className="mt-2 space-y-1">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => onTeamClick(team.id)}
              className="w-full text-left px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              {team.name}
            </button>
          ))}
        </div>
      )}
    </div>
    {/* Leagues Section */}
    <div>
      <button
        onClick={onToggleLeagues}
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <span className="flex items-center">
          <span className="mr-2">🏆</span>
          Leagues
        </span>
        <span className={`transform transition-transform duration-200 ${leaguesExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {leaguesExpanded && (
        <div className="mt-2 space-y-1">
          {leagues.map((league) => (
            <div
              key={league}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400"
            >
              {league}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export const QuickLinks: React.FC<QuickLinksProps> = ({
  teams,
  onTeamClick,
  isCollapsed,
}) => {
  const [teamsExpanded, setTeamsExpanded] = useState(true);
  const [leaguesExpanded, setLeaguesExpanded] = useState(true);

  const handleTeamClick = (teamId: string) => {
    onTeamClick(teamId);
  };

  const toggleTeams = () => {
    setTeamsExpanded(!teamsExpanded);
  };

  const toggleLeagues = () => {
    setLeaguesExpanded(!leaguesExpanded);
  };

  // Extract unique leagues from teams
  const leagues = Array.from(new Set(teams.map(team => team.league)));

  if (isCollapsed) {
    return <CollapsedQuickLinks onToggleTeams={toggleTeams} onToggleLeagues={toggleLeagues} />;
  }

  return (
    <ExpandedQuickLinks
      teams={teams}
      leagues={leagues}
      teamsExpanded={teamsExpanded}
      leaguesExpanded={leaguesExpanded}
      onToggleTeams={toggleTeams}
      onToggleLeagues={toggleLeagues}
      onTeamClick={handleTeamClick}
    />
  );
}; 