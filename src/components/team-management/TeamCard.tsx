import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import React from 'react';

import type { TeamData } from '@/types/contexts/team-context-value';

interface TeamCardProps {
  teamData: TeamData;
  isActive: boolean;
  onRemoveTeam: (teamId: string, leagueId: string) => Promise<void>;
  onRefreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  onSetActiveTeam: (teamId: string, leagueId: string) => void;
  onEditTeam: (teamId: string, leagueId: string) => void;
}

interface TeamInformationProps {
  teamData: TeamData;
  isActive: boolean;
  teamName: string;
  leagueName: string;
  hasError: boolean;
}

const TeamInformation: React.FC<TeamInformationProps> = ({
  teamData,
  isActive,
  teamName,
  leagueName,
  hasError
}) => {
  const getTeamStats = () => {
    if (hasError || !teamData.summary) {
      return null;
    }
    
    const { totalMatches, overallWinRate } = teamData.summary;
    return { totalMatches, overallWinRate };
  };

  const stats = getTeamStats();

  return (
    <div className="flex items-center space-x-3 flex-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
            {teamName}
          </h3>
          {/* Active Badge */}
          {isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Active
            </span>
          )}
          {/* Loading indicator */}
          {teamData.team.isLoading && (
            <span 
              className="inline-block w-4 h-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" 
              aria-label="Loading team data" 
            />
          )}
          {/* Error indicator */}
          {hasError && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Error
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
          <span>{leagueName}</span>
          {hasError && (
            <>
              <span>•</span>
              <span className="text-red-600 dark:text-red-400">{teamData.team.error}</span>
            </>
          )}
          {!hasError && stats && (
            <>
              <span>•</span>
              <span>{stats.totalMatches} matches</span>
              <span>•</span>
              <span>{stats.overallWinRate.toFixed(1)}% win rate</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface TeamCardActionsProps {
  teamData: TeamData;
  onRefreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  onEditTeam: (teamId: string, leagueId: string) => void;
  onRemoveTeam: (teamId: string, leagueId: string) => Promise<void>;
  isLoading: boolean;
}

const TeamCardActions: React.FC<TeamCardActionsProps> = ({
  teamData,
  onRefreshTeam,
  onEditTeam,
  onRemoveTeam,
  isLoading
}) => {
  const handleRefreshTeam = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onRefreshTeam(teamData.team.id, teamData.team.leagueId);
  };

  const handleEditTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditTeam(teamData.team.id, teamData.team.leagueId);
  };

  const handleRemoveTeam = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onRemoveTeam(teamData.team.id, teamData.team.leagueId);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Refresh Button */}
      <button
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md 
                   hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title="Refresh team data"
        onClick={handleRefreshTeam}
        disabled={isLoading}
        aria-label={`Refresh data for ${teamData.team.name || teamData.team.leagueName}`}
        type="button"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
      </button>

      {/* Edit Button */}
      <button
        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md 
                   hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title="Edit team"
        onClick={handleEditTeam}
        disabled={isLoading}
        aria-label="Edit team"
        type="button"
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Delete Button */}
      <button
        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md 
                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        title="Delete team"
        onClick={handleRemoveTeam}
        disabled={isLoading}
        aria-label={`Delete team ${teamData.team.name || teamData.team.leagueName}`}
        type="button"
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export const TeamCard: React.FC<TeamCardProps> = ({ 
  teamData,
  isActive,
  onRemoveTeam, 
  onRefreshTeam, 
  onSetActiveTeam,
  onEditTeam
}) => {
  const handleSelectTeam = () => {
    onSetActiveTeam(teamData.team.id, teamData.team.leagueId);
  };

  const isLoading = teamData.team.isLoading;
  const teamName = teamData.team.name || `Loading ${teamData.team.id}...`;
  const leagueName = teamData.team.leagueName || `Loading ${teamData.team.leagueId}...`;
  const hasError = Boolean(teamData.team.error);

  const getCardClassName = () => {
    const baseClasses = 'bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200';
    
    if (isActive) {
      return `${baseClasses} ring-2 ring-blue-500 ring-opacity-50 shadow-md`;
    }
    
    if (hasError) {
      return `${baseClasses} cursor-not-allowed opacity-75 border-red-200 dark:border-red-700`;
    }
    
    return `${baseClasses} hover:shadow-md cursor-pointer hover:border-gray-300 dark:hover:border-gray-600`;
  };

  const getAriaLabel = () => {
    if (hasError) {
      return `Team ${teamName} has an error and cannot be selected. Click edit to fix the issue.`;
    }
    return `Select team ${teamName}`;
  };

  const getTitle = () => {
    return hasError ? 'Team has an error. Click edit to fix the issue.' : undefined;
  };

  return (
    <div 
      className={getCardClassName()}
      onClick={hasError ? undefined : handleSelectTeam}
      role={hasError ? undefined : 'button'}
      tabIndex={hasError ? -1 : 0}
      onKeyDown={hasError ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelectTeam();
        }
      }}
      aria-label={getAriaLabel()}
      title={getTitle()}
    >
      <div className="flex items-center justify-between">
        <TeamInformation
          teamData={teamData}
          isActive={isActive}
          teamName={teamName}
          leagueName={leagueName}
          hasError={hasError}
        />
        <TeamCardActions
          teamData={teamData}
          onRefreshTeam={onRefreshTeam}
          onEditTeam={onEditTeam}
          onRemoveTeam={onRemoveTeam}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}; 