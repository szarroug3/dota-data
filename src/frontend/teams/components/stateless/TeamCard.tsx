import { Pencil, RefreshCw, Trash2, Users } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TeamDisplayData } from '@/frontend/lib/app-data-types';

interface TeamCardProps {
  teamData: TeamDisplayData;
  isActive: boolean;
  onRemoveTeam: (teamId: number, leagueId: number) => Promise<void> | void;
  onRefreshTeam: (teamId: number, leagueId: number) => Promise<void> | void;
  onSetActiveTeam: (teamId: number, leagueId: number) => Promise<void> | void;
  onEditTeam: (teamId: number, leagueId: number) => void;
}

interface TeamInformationProps {
  teamData: TeamDisplayData;
  isActive: boolean;
  teamName: string;
  leagueName: string;
  hasError: boolean;
}

function getTeamStatsForDisplay(teamData: TeamDisplayData, hasError: boolean, isLoading: boolean) {
  if (hasError || isLoading) return null;

  // Performance is always set (defaulted to 0s in formatter)
  return {
    totalMatches: teamData.performance.totalMatches,
    overallWinRate: teamData.performance.overallWinRate,
    erroredMatches: teamData.performance.erroredMatches,
  };
}

const TeamInformation: React.FC<TeamInformationProps> = ({ teamData, isActive, teamName, leagueName, hasError }) => {
  const isLoading = Boolean(teamData.isLoading);
  const stats = getTeamStatsForDisplay(teamData, hasError, isLoading);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="font-semibold truncate">{teamName}</h3>
          {isActive && (
            <Badge variant="default" className="flex-shrink-0">
              Active
            </Badge>
          )}
          {isLoading && (
            <div
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0"
              role="status"
              aria-live="polite"
              aria-busy="true"
              aria-label="Loading team data"
              data-testid="team-loading-spinner"
            />
          )}
          {hasError && (
            <Badge variant="destructive" className="text-xs ml-2">
              Error
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground truncate">{leagueName}</p>
        {!hasError && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {stats ? (
              <>
                <span>{stats.totalMatches} matches</span>
                <span>•</span>
                <span>{stats.overallWinRate.toFixed(1)}% win rate</span>
                {stats.erroredMatches > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-destructive">{stats.erroredMatches} failed</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-muted-foreground/50">Loading stats...</span>
            )}
          </div>
        )}
        {hasError && <p className="text-xs text-destructive">{teamData.error}</p>}
      </div>
    </div>
  );
};

interface TeamCardActionsProps {
  teamData: TeamDisplayData;
  onRefreshTeam: (teamId: number, leagueId: number) => Promise<void> | void;
  onEditTeam: (teamId: number, leagueId: number) => void;
  onRemoveTeam: (teamId: number, leagueId: number) => Promise<void> | void;
  isLoading: boolean;
}

const TeamCardActions: React.FC<TeamCardActionsProps> = ({
  teamData,
  onRefreshTeam,
  onEditTeam,
  onRemoveTeam,
  isLoading,
}) => {
  // Hide buttons for global team
  if (teamData.isGlobal) {
    return null;
  }

  const handleRefreshTeam = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onRefreshTeam(teamData.team.id, teamData.league.id);
  };

  const handleEditTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditTeam(teamData.team.id, teamData.league.id);
  };

  const handleRemoveTeam = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onRemoveTeam(teamData.team.id, teamData.league.id);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        title="Refresh team data"
        onClick={handleRefreshTeam}
        disabled={isLoading}
        aria-label={`Refresh data for ${teamData.team.name || teamData.league.name}`}
        className="h-8 w-8"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Edit team"
        onClick={handleEditTeam}
        disabled={isLoading}
        aria-label="Edit team"
        className="h-8 w-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Delete team"
        onClick={handleRemoveTeam}
        disabled={isLoading}
        aria-label={`Delete team ${teamData.team.name || teamData.league.name}`}
        className="h-8 w-8 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

function useTeamCardHandlers(
  teamData: TeamDisplayData,
  hasError: boolean,
  onSetActiveTeam: (teamId: number, leagueId: number) => Promise<void> | void,
) {
  const handleSelectTeam = () => {
    onSetActiveTeam(teamData.team.id, teamData.league.id);
  };

  const handleKeyDown = hasError
    ? undefined
    : (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelectTeam();
        }
      };

  return { handleSelectTeam, handleKeyDown };
}

function getTeamDisplayNames(teamData: TeamDisplayData, isLoading: boolean, isGlobal: boolean) {
  const teamName = isLoading ? `Loading ${teamData.team.id}...` : teamData.team.name || `Team ${teamData.team.id}`;

  // Global team doesn't have a league
  let leagueName = '';
  if (!isGlobal) {
    leagueName = isLoading
      ? `Loading ${teamData.league.id}...`
      : teamData.league.name || `League ${teamData.league.id}`;
  }

  return { teamName, leagueName };
}

export const TeamCard: React.FC<TeamCardProps> = ({
  teamData,
  isActive,
  onRemoveTeam,
  onRefreshTeam,
  onSetActiveTeam,
  onEditTeam,
}) => {
  const isLoading = Boolean(teamData.isLoading);
  const hasError = Boolean(teamData.error);
  const isGlobal = Boolean(teamData.isGlobal);

  const { handleSelectTeam, handleKeyDown } = useTeamCardHandlers(teamData, hasError, onSetActiveTeam);
  const { teamName, leagueName } = getTeamDisplayNames(teamData, isLoading, isGlobal);

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
    <div className="p-1">
      <Card
        className={`transition-all duration-200 ${
          isActive ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
        } ${hasError ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
        onClick={hasError ? undefined : handleSelectTeam}
        role={hasError ? undefined : 'button'}
        tabIndex={hasError ? -1 : 0}
        onKeyDown={handleKeyDown}
        aria-label={getAriaLabel()}
        title={getTitle()}
      >
        <CardContent className="px-4">
          <div className="flex items-start justify-between">
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
        </CardContent>
      </Card>
    </div>
  );
};
