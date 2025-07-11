import React from 'react';

import type { Team } from '@/types/contexts/team-context-value';

interface TeamWithStatus extends Team {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

interface TeamCardProps {
  team: TeamWithStatus;
  isActive: boolean;
  onSwitch: () => void;
  onRemove: () => void;
  onRefresh: () => void;
  onUpdate: () => void;
}

const SwitchButton: React.FC<{ isActive: boolean; onSwitch: () => void }> = ({ isActive, onSwitch }) => (
  !isActive ? (
    <button
      onClick={onSwitch}
      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
    >
      Switch
    </button>
  ) : null
);

const RefreshButton: React.FC<{ isLoading: boolean; onRefresh: () => void }> = ({ isLoading, onRefresh }) => (
  <button
    onClick={onRefresh}
    disabled={isLoading}
    className={`p-2 rounded-md transition-colors ${
      isLoading
        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
    title="Refresh team data"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  </button>
);

const UpdateButton: React.FC<{ isLoading: boolean; onUpdate: () => void }> = ({ isLoading, onUpdate }) => (
  <button
    onClick={onUpdate}
    disabled={isLoading}
    className={`p-2 rounded-md transition-colors ${
      isLoading
        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
    title="Update team data"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  </button>
);

const RemoveButton: React.FC<{ isLoading: boolean; onRemove: () => void }> = ({ isLoading, onRemove }) => (
  <button
    onClick={onRemove}
    disabled={isLoading}
    className={`p-2 rounded-md transition-colors ${
      isLoading
        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
    }`}
    title="Remove team"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>
);

const ActionButtons: React.FC<{
  isActive: boolean;
  isLoading: boolean;
  onSwitch: () => void;
  onRemove: () => void;
  onRefresh: () => void;
  onUpdate: () => void;
}> = ({ isActive, isLoading, onSwitch, onRemove, onRefresh, onUpdate }) => (
  <div className="flex items-center space-x-2">
    <SwitchButton isActive={isActive} onSwitch={onSwitch} />
    <RefreshButton isLoading={isLoading} onRefresh={onRefresh} />
    <UpdateButton isLoading={isLoading} onUpdate={onUpdate} />
    <RemoveButton isLoading={isLoading} onRemove={onRemove} />
  </div>
);

const ActiveTeamIndicator: React.FC = () => (
  <div data-testid="active-indicator" className="w-2 h-2 bg-blue-500 rounded-full"></div>
);

const ActiveTeamFooter: React.FC = () => (
  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
      ✓ Active Team
    </span>
  </div>
);

const TeamInfo: React.FC<{ team: TeamWithStatus; isActive: boolean }> = ({ team, isActive }) => {
  const isLoading = team.isLoading;
  const hasError = team.isError;
  return (
    <div className="flex-1">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {isActive && <ActiveTeamIndicator />}
          <div>
            <h3 className={`font-medium ${
              isActive 
                ? 'text-blue-900 dark:text-blue-100' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {team.name || `Team ${team.id}`}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              League: {team.leagueName || `League ${team.leagueId}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              ID: {team.id} • League: {team.leagueId}
            </p>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="mt-2">
          <div data-testid="loading-skeleton" className="animate-pulse flex space-x-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      )}
      {hasError && (
        <div className="mt-2">
          <p className="text-sm text-red-600 dark:text-red-400">
            {team.errorMessage || 'Failed to load team data'}
          </p>
        </div>
      )}
    </div>
  );
};

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isActive,
  onSwitch,
  onRemove,
  onRefresh,
  onUpdate
}) => {
  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      isActive 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}>
      <div className="flex items-center justify-between">
        <TeamInfo team={team} isActive={isActive} />
        <ActionButtons
          isActive={isActive}
          isLoading={!!team.isLoading}
          onSwitch={onSwitch}
          onRemove={onRemove}
          onRefresh={onRefresh}
          onUpdate={onUpdate}
        />
      </div>
      {isActive && <ActiveTeamFooter />}
    </div>
  );
}; 