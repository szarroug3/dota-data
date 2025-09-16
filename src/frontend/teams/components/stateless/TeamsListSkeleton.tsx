import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamCardSkeleton } from '@/frontend/teams/components/stateless/TeamCardSkeleton';

interface TeamsListSkeletonProps {
  teamsCount: number;
}

export const TeamsListSkeleton: React.FC<TeamsListSkeletonProps> = ({ teamsCount }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Teams</CardTitle>
        <CardDescription>Manage your tracked teams and view their performance</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-34rem)] min-h-[139px] overflow-y-auto px-4">
        <div>
          {Array.from({ length: teamsCount }, (_, index) => (
            <TeamCardSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
