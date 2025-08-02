import React, { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { MatchDetailsPanelDraft } from './MatchDetailsPanelDraft';
import { MatchDetailsPanelEvents } from './MatchDetailsPanelEvents';
import { MatchDetailsPanelHeader } from './MatchDetailsPanelHeader';
import { MatchDetailsPanelPlayers } from './MatchDetailsPanelPlayers';

export type MatchDetailsPanelMode = 'draft' | 'players' | 'events';

type DraftFilter = 'picks' | 'bans' | 'both';

interface MatchDetailsPanelProps {
  match: Match;
  teamMatch: TeamMatchParticipation;
  viewMode: MatchDetailsPanelMode;
  onViewModeChange: (mode: MatchDetailsPanelMode) => void;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}

export const MatchDetailsPanel: React.FC<MatchDetailsPanelProps> = ({
  match,
  teamMatch,
  viewMode,
  onViewModeChange,
  allMatches = [],
  teamMatches = {},
  hiddenMatchIds = new Set(),
}) => {
  console.log('📋 MatchDetailsPanel:', {
    matchId: match?.id,
    teamMatchSide: teamMatch?.side,
    hasTeamMatch: !!teamMatch,
    viewMode,
    allMatchesCount: allMatches.length,
    teamMatchesCount: Object.keys(teamMatches).length,
    hiddenMatchIdsCount: hiddenMatchIds.size,
    teamMatchesKeys: Object.keys(teamMatches),
    teamMatch: JSON.stringify(teamMatch),
    allMatchesIds: allMatches.map(m => m.id),
    hiddenMatchIds: Array.from(hiddenMatchIds)
  });

  if (!teamMatch) {
    console.log('❌ MatchDetailsPanel: No teamMatch provided for match:', match?.id);
  }

  const [draftFilter, setDraftFilter] = useState<DraftFilter>('both');

  return (
    <Card className="flex flex-col min-h-[calc(100vh-19rem)] max-h-[calc(100vh-19rem)] @container">
      <CardHeader className="flex-shrink-0">
        <MatchDetailsPanelHeader 
          match={match}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 @[90px]:block hidden">
          {/* Content based on view mode */}
          {viewMode === 'draft' && (
            <div className="space-y-4">
              <MatchDetailsPanelDraft 
                match={match} 
                teamMatch={teamMatch} 
                filter={draftFilter}
                onFilterChange={setDraftFilter}
                allMatches={allMatches}
                teamMatches={teamMatches}
                hiddenMatchIds={hiddenMatchIds}
              />
            </div>
          )}

          {viewMode === 'players' && (
            <div className="space-y-4">
              <MatchDetailsPanelPlayers 
                match={match} 
                teamMatch={teamMatch}
                allMatches={allMatches}
                teamMatches={teamMatches}
                hiddenMatchIds={hiddenMatchIds}
              />
            </div>
          )}

          {viewMode === 'events' && (
            <div className="space-y-4">
              <MatchDetailsPanelEvents match={match} teamMatch={teamMatch} />
            </div>
          )}
      </CardContent>
    </Card>
  );
}; 