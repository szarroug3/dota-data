import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamData } from '@/types/contexts/team-types';

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
      <Card>
        <CardHeader>
          <CardTitle>Your Teams</CardTitle>
          <CardDescription>
            Manage your tracked teams and view their performance
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[139px] flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Teams Added</h3>
            <p className="text-sm text-muted-foreground">
              Add your first team using the add team form to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Teams</CardTitle>
        <CardDescription>
          Manage your tracked teams and view their performance
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-34rem)] min-h-[139px] overflow-y-auto px-4">
        <div>
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
      </CardContent>
    </Card>
  );
}; 