/* eslint-disable max-lines */
import React from 'react';

import { Team } from '@/types/contexts/team-context-value';

/**
 * Team Card Component
 * 
 * A reusable component for displaying team information, roster, logo, stats,
 * recent performance, and upcoming matches with different layout options.
 */

interface TeamCardProps {
  team: Team;
  isSelected?: boolean;
  isActive?: boolean;
  isHidden?: boolean;
  onSelect?: (teamId: string) => void;
  onActivate?: (teamId: string) => void;
  onHide?: (teamId: string) => void;
  onViewDetails?: (teamId: string) => void;
  layout?: 'compact' | 'default' | 'detailed';
  showRoster?: boolean;
  showStats?: boolean;
  showSchedule?: boolean;
  className?: string;
}

interface TeamStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: {
    type: 'win' | 'loss';
    count: number;
  };
  averageMatchDuration: number;
  lastPlayedDate: string;
  ranking: {
    position: number;
    division: string;
    points: number;
  };
  recentForm: Array<{
    matchId: string;
    result: 'win' | 'loss';
    opponent: string;
    date: string;
    score: string;
  }>;
}

interface TeamRoster {
  players: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    isActive: boolean;
  }>;
  coach?: {
    id: string;
    name: string;
    avatar?: string;
  };
  captain?: {
    id: string;
    name: string;
  };
}

interface TeamSchedule {
  upcomingMatches: Array<{
    matchId: string;
    opponent: string;
    date: string;
    league: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  nextMatch?: {
    matchId: string;
    opponent: string;
    date: string;
    timeUntil: string;
  };
}

// Mock data generators - in real app these would come from API
const generateMockTeamStats = (): TeamStats => {
  return {
    totalMatches: 47,
    wins: 32,
    losses: 15,
    winRate: 68.1,
    currentStreak: {
      type: 'win',
      count: 3
    },
    averageMatchDuration: 2847,
    lastPlayedDate: '2024-01-15T18:30:00Z',
    ranking: {
      position: 8,
      division: 'Division 1',
      points: 1847
    },
    recentForm: [
      { matchId: '1', result: 'win', opponent: 'Team Alpha', date: '2024-01-15', score: '2-0' },
      { matchId: '2', result: 'win', opponent: 'Team Beta', date: '2024-01-12', score: '2-1' },
      { matchId: '3', result: 'loss', opponent: 'Team Gamma', date: '2024-01-10', score: '1-2' },
      { matchId: '4', result: 'win', opponent: 'Team Delta', date: '2024-01-08', score: '2-0' },
      { matchId: '5', result: 'win', opponent: 'Team Epsilon', date: '2024-01-05', score: '2-1' }
    ]
  };
};

const generateMockTeamRoster = (): TeamRoster => {
  return {
    players: [
      { id: '1', name: 'Player1', role: 'Carry', avatar: '/avatars/player1.jpg', isActive: true },
      { id: '2', name: 'Player2', role: 'Mid', avatar: '/avatars/player2.jpg', isActive: true },
      { id: '3', name: 'Player3', role: 'Offlane', avatar: '/avatars/player3.jpg', isActive: true },
      { id: '4', name: 'Player4', role: 'Support', avatar: '/avatars/player4.jpg', isActive: true },
      { id: '5', name: 'Player5', role: 'Support', avatar: '/avatars/player5.jpg', isActive: true }
    ],
    coach: {
      id: 'coach1',
      name: 'Coach Smith',
      avatar: '/avatars/coach1.jpg'
    },
    captain: {
      id: '1',
      name: 'Player1'
    }
  };
};

const generateMockTeamSchedule = (): TeamSchedule => {
  return {
    upcomingMatches: [
      { matchId: '1', opponent: 'Team Zeta', date: '2024-01-18T19:00:00Z', league: 'Division 1', importance: 'high' },
      { matchId: '2', opponent: 'Team Eta', date: '2024-01-20T20:00:00Z', league: 'Division 1', importance: 'medium' },
      { matchId: '3', opponent: 'Team Theta', date: '2024-01-22T18:00:00Z', league: 'Division 1', importance: 'low' }
    ],
    nextMatch: {
      matchId: '1',
      opponent: 'Team Zeta',
      date: '2024-01-18T19:00:00Z',
      timeUntil: '2 days'
    }
  };
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getWinRateColor = (winRate: number): string => {
  if (winRate >= 70) return 'text-green-600';
  if (winRate >= 60) return 'text-blue-600';
  if (winRate >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const getStreakColor = (type: 'win' | 'loss'): string => {
  return type === 'win' ? 'text-green-600' : 'text-red-600';
};

const getStreakIcon = (type: 'win' | 'loss'): string => {
  return type === 'win' ? '📈' : '📉';
};

const getRankingColor = (position: number): string => {
  if (position <= 3) return 'text-yellow-600';
  if (position <= 8) return 'text-blue-600';
  if (position <= 16) return 'text-green-600';
  return 'text-gray-600';
};

const getImportanceColor = (importance: 'high' | 'medium' | 'low'): string => {
  switch (importance) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const TeamLogo: React.FC<{ 
  team: Team; 
  size: 'small' | 'medium' | 'large' 
}> = ({ team, size }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
      <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">
        {team.name.substring(0, 2).toUpperCase()}
      </span>
    </div>
  );
};

const TeamStatusBadge: React.FC<{ 
  isActive: boolean; 
  isSelected: boolean 
}> = ({ isActive, isSelected }) => {
  if (isActive) {
    return (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
        Active
      </span>
    );
  }
  if (isSelected) {
    return (
      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
        Selected
      </span>
    );
  }
  return null;
};

const RecentFormIndicator: React.FC<{ 
  form: TeamStats['recentForm'] 
}> = ({ form }) => (
  <div className="flex items-center space-x-1">
    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Form:</span>
    {form.map((match, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`}
        title={`${match.result === 'win' ? 'Win' : 'Loss'} vs ${match.opponent} (${match.score})`}
      />
    ))}
  </div>
);

const PlayerAvatar: React.FC<{ 
  player: TeamRoster['players'][0]; 
  size: 'small' | 'medium' 
}> = ({ player, size }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
      {player.avatar ? (
        <img 
          src={player.avatar} 
          alt={player.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
          {player.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function
const CompactTeamCard: React.FC<TeamCardProps & { stats: TeamStats; roster: TeamRoster; schedule: TeamSchedule }> = ({
  team,
  stats,
  roster,
  isSelected,
  isActive,
  onSelect,
  onActivate,
  onHide,
  onViewDetails,
  showRoster,
  showStats,
  className
}) => {
  const handleSelect = () => {
    if (onSelect) onSelect(team.id);
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onActivate) onActivate(team.id);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHide) onHide(team.id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(team.id);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TeamLogo team={team} size="small" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {team.name}
                <span data-testid="team-tag" className="ml-2 text-xs text-gray-500 dark:text-gray-400">{team.name}</span>
              </h3>
              <TeamStatusBadge isActive={isActive ?? false} isSelected={isSelected ?? false} />
            </div>
            {showRoster && (
              <div className="flex items-center space-x-1 mt-1">
                {roster.players.slice(0, 3).map((player) => (
                  <PlayerAvatar key={player.id} player={player} size="small" />
                ))}
                {roster.players.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{roster.players.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {showStats && (
            <div className="text-right">
              <div className={`text-sm font-medium ${getWinRateColor(stats.winRate)}`}>
                {stats.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                WR
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {onViewDetails && (
              <button
                onClick={handleViewDetails}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="View team details"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onActivate && (
              <button
                onClick={handleActivate}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Activate team"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            {onHide && (
              <button
                onClick={handleHide}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Hide team"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function, complexity
const DefaultTeamCard: React.FC<TeamCardProps & { stats: TeamStats; roster: TeamRoster; schedule: TeamSchedule }> = ({
  team,
  stats,
  roster,
  schedule,
  isSelected,
  isActive,
  onSelect,
  onActivate,
  onHide,
  onViewDetails,
  showRoster,
  showStats,
  showSchedule,
  className
}) => {
  const handleSelect = () => {
    if (onSelect) onSelect(team.id);
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onActivate) onActivate(team.id);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHide) onHide(team.id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(team.id);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${isActive ? 'ring-2 ring-green-500 border-green-500' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <TeamLogo team={team} size="medium" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {team.name}
                <span data-testid="team-tag" className="ml-2 text-xs text-gray-500 dark:text-gray-400">{team.name}</span>
              </h3>
              <TeamStatusBadge isActive={isActive ?? false} isSelected={isSelected ?? false} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {team.leagueName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onActivate && !isActive && (
            <button
              onClick={handleActivate}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Activate team"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="View team details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {onHide && (
            <button
              onClick={handleHide}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Hide team"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-lg font-semibold ${getWinRateColor(stats.winRate)}`}>
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.wins}-{stats.losses}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">W-L</div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-semibold ${getRankingColor(stats.ranking.position)}`}>
              #{stats.ranking.position}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Rank</div>
          </div>
        </div>
      )}

      {showRoster && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roster</h4>
          <div className="flex items-center space-x-2">
            {roster.players.map((player) => (
              <div key={player.id} className="flex items-center space-x-1">
                <PlayerAvatar player={player} size="medium" />
                <div className="text-xs">
                  <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">{player.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSchedule && schedule.nextMatch && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Next: <span className="font-medium text-gray-900 dark:text-white">vs {schedule.nextMatch.opponent}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {schedule.nextMatch.timeUntil}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3">
        <RecentFormIndicator form={stats.recentForm} />
      </div>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function, complexity
const DetailedTeamCard: React.FC<TeamCardProps & { stats: TeamStats; roster: TeamRoster; schedule: TeamSchedule }> = ({
  team,
  stats,
  roster,
  schedule,
  isSelected,
  isActive,
  onSelect,
  onActivate,
  onHide,
  onViewDetails,
  showRoster,
  showStats,
  showSchedule,
  className
}) => {
  const handleSelect = () => {
    if (onSelect) onSelect(team.id);
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onActivate) onActivate(team.id);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHide) onHide(team.id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(team.id);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${isActive ? 'ring-2 ring-green-500 border-green-500' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <TeamLogo team={team} size="large" />
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {team.name}
                <span data-testid="team-tag" className="ml-2 text-xs text-gray-500 dark:text-gray-400">{team.name}</span>
              </h3>
              <TeamStatusBadge isActive={isActive ?? false} isSelected={isSelected ?? false} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {team.leagueName}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current streak: 
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-sm">{getStreakIcon(stats.currentStreak.type)}</span>
                <span className={`text-sm font-medium ${getStreakColor(stats.currentStreak.type)}`}>
                  {stats.currentStreak.count} {stats.currentStreak.type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onActivate && !isActive && (
            <button
              onClick={handleActivate}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Activate team"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="View team details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {onHide && (
            <button
              onClick={handleHide}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Hide team"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`text-2xl font-bold ${getWinRateColor(stats.winRate)}`}>
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.wins}-{stats.losses}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">W-L Record</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`text-2xl font-bold ${getRankingColor(stats.ranking.position)}`}>
              #{stats.ranking.position}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Ranking</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              <span data-testid="team-points">{stats.ranking.points}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Points</div>
          </div>
        </div>
      )}

      {showRoster && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Roster</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roster.players.map((player) => (
              <div key={player.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <PlayerAvatar player={player} size="medium" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {player.name}
                    {roster.captain?.id === player.id && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Captain
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{player.role}</div>
                </div>
              </div>
            ))}
          </div>
          
          {roster.coach && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">C</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {roster.coach.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Coach</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showSchedule && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Upcoming Matches</h4>
          <div className="space-y-2">
            {schedule.upcomingMatches.slice(0, 3).map((match) => (
              <div key={match.matchId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getImportanceColor(match.importance)}`}>
                    {match.importance}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    vs {match.opponent}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(match.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <RecentFormIndicator form={stats.recentForm} />
      </div>
    </div>
  );
};

// eslint-disable-next-line complexity
export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isSelected = false,
  isActive = false,
  isHidden = false,
  onSelect,
  onActivate,
  onHide,
  onViewDetails,
  layout = 'default',
  showRoster = true,
  showStats = true,
  showSchedule = true,
  className = ''
}) => {
  // Don't render if team is hidden
  if (isHidden) {
    return null;
  }

  // Mock data - in real app, this would come from API/context
  const stats = generateMockTeamStats();
  const roster = generateMockTeamRoster();
  const schedule = generateMockTeamSchedule();

  const commonProps = {
    team,
    stats,
    roster,
    schedule,
    isSelected,
    isActive,
    onSelect,
    onActivate,
    onHide,
    onViewDetails,
    showRoster,
    showStats,
    showSchedule,
    className
  };

  switch (layout) {
    case 'compact':
      return <CompactTeamCard {...commonProps} />;
    case 'detailed':
      return <DetailedTeamCard {...commonProps} />;
    default:
      return <DefaultTeamCard {...commonProps} />;
  }
};

/**
 * Team Card Skeleton Component
 * 
 * Loading skeleton for team cards
 */
export const TeamCardSkeleton: React.FC<{ 
  layout?: 'compact' | 'default' | 'detailed';
  className?: string;
}> = ({ layout = 'default', className = '' }) => {
  const baseClasses = `bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse ${className}`;

  if (layout === 'compact') {
    return (
      <div className={`${baseClasses} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-1">
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (layout === 'detailed') {
    return (
      <div className={`${baseClasses} p-6`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-2">
              <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-28 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-12 h-6 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2"></div>
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} p-4`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="space-y-2">
            <div className="w-28 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <div className="w-12 h-5 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};

/**
 * Team Card List Component
 * 
 * A list wrapper for multiple team cards
 */
export const TeamCardList: React.FC<{
  teams: Team[];
  selectedTeamId?: string | null;
  activeTeamId?: string | null;
  hiddenTeamIds?: string[];
  onSelectTeam?: (teamId: string) => void;
  onActivateTeam?: (teamId: string) => void;
  onHideTeam?: (teamId: string) => void;
  onViewDetails?: (teamId: string) => void;
  layout?: 'compact' | 'default' | 'detailed';
  showRoster?: boolean;
  showStats?: boolean;
  showSchedule?: boolean;
  className?: string;
}> = ({
  teams,
  selectedTeamId,
  activeTeamId,
  hiddenTeamIds = [],
  onSelectTeam,
  onActivateTeam,
  onHideTeam,
  onViewDetails,
  layout = 'default',
  showRoster = true,
  showStats = true,
  showSchedule = true,
  className = ''
}) => {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No teams found
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          isSelected={selectedTeamId === team.id}
          isActive={activeTeamId === team.id}
          isHidden={hiddenTeamIds.includes(team.id)}
          onSelect={onSelectTeam}
          onActivate={onActivateTeam}
          onHide={onHideTeam}
          onViewDetails={onViewDetails}
          layout={layout}
          showRoster={showRoster}
          showStats={showStats}
          showSchedule={showSchedule}
        />
      ))}
    </div>
  );
}; 