import React, { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Match, TeamMatchMetadata } from '@/frontend/lib/app-data-types';
import { MatchDetailsPanelDraft } from '@/frontend/matches/components/details/MatchDetailsPanelDraft';
import { MatchDetailsPanelEvents } from '@/frontend/matches/components/details/MatchDetailsPanelEvents';
import { MatchDetailsPanelHeader } from '@/frontend/matches/components/details/MatchDetailsPanelHeader';
import { MatchDetailsPanelPlayers } from '@/frontend/matches/components/details/MatchDetailsPanelPlayers';

export type MatchDetailsPanelMode = 'draft' | 'players' | 'events';

type DraftFilter = 'picks' | 'bans' | 'both';

interface MatchDetailsPanelProps {
  match: Match;
  teamMatch: TeamMatchMetadata | undefined;
  viewMode: MatchDetailsPanelMode;
  onViewModeChange: (mode: MatchDetailsPanelMode) => void;
  allMatches: Match[];
  teamMatches: Map<number, TeamMatchMetadata>;
  hiddenMatchIds: Set<number>;
}

export const MatchDetailsPanel: React.FC<MatchDetailsPanelProps> = ({
  match,
  teamMatch,
  viewMode,
  onViewModeChange,
  allMatches,
  teamMatches,
  hiddenMatchIds,
}) => {
  const [draftFilter, setDraftFilter] = useState<DraftFilter>('both');
  return (
    <Card className="flex flex-col min-h-[calc(100vh-19rem)] max-h-[calc(100vh-19rem)] @container">
      <CardHeader className="flex-shrink-0">
        <MatchDetailsPanelHeader match={match} viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 @[90px]:block hidden">
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
          <div className="space-y-4" data-testid="players-panel">
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
            <MatchDetailsPanelEvents match={match} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
