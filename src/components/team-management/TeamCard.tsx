import { Pencil, RefreshCw, Trash2, Users } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
          {hasError && (
            <Badge variant="destructive" className="text-xs ml-2">
              Error
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Loading indicator */}
          {teamData.team.isLoading && (
            <Badge variant="secondary" className="text-xs">
              Loading...
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground truncate">
          {leagueName}
        </p>
        {!hasError && stats && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.totalMatches} matches</span>
            <span>•</span>
            <span>{stats.overallWinRate.toFixed(1)}% win rate</span>
          </div>
        )}
        {hasError && (
          <p className="text-xs text-destructive">
            {teamData.team.error}
          </p>
        )}
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
    <div className="flex items-center gap-1">
      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="icon"
        title="Refresh team data"
        onClick={handleRefreshTeam}
        disabled={isLoading}
        aria-label={`Refresh data for ${teamData.team.name || teamData.team.leagueName}`}
        className="h-8 w-8"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      {/* Edit Button */}
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

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        title="Delete team"
        onClick={handleRemoveTeam}
        disabled={isLoading}
        aria-label={`Delete team ${teamData.team.name || teamData.team.leagueName}`}
        className="h-8 w-8 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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
          isActive 
            ? 'ring-2 ring-primary bg-primary/5' 
            : 'hover:bg-accent/50'
        } ${
          hasError 
            ? 'opacity-75 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-md'
        }`}
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