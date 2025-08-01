import { Eye, LayoutGrid, List, SquareStack } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import { MatchListView, MatchListViewMode } from './MatchListView';

interface MatchesListProps {
  matches: Match[];
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  teamMatches?: Record<number, TeamMatchParticipation>;
}

interface MatchListLayoutButtonsProps {
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
}

const MatchListLayoutButtons: React.FC<MatchListLayoutButtonsProps> = ({ 
  viewMode, 
  setViewMode,
}) => (
  <>
    <div className="@[180px]:flex hidden">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as MatchListViewMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span className="@[420px]:block hidden">List</span>
          </TabsTrigger>
          <TabsTrigger value="card" className="flex items-center gap-2">
            <SquareStack className="w-4 h-4" />
            <span className="@[420px]:block hidden">Card</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="@[420px]:block hidden">Grid</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <div className="@[180px]:hidden h-9 w-24">
      {/* Invisible placeholder to maintain space when tabs are hidden */}
    </div>
  </>
)
const MatchesList: React.FC<MatchesListProps> = ({ 
  matches, 
  onHideMatch, 
  onRefreshMatch,
  viewMode, 
  setViewMode,
  selectedMatchId,
  onSelectMatch,
  hiddenMatchesCount = 0,
  onShowHiddenMatches,
  teamMatches
}) => {
  return (
    <Card className="flex flex-col min-h-[calc(100vh-19rem)] max-h-[calc(100vh-19rem)]">
      <CardHeader className="flex items-center justify-between flex-shrink-0 min-w-0">
        <div className="min-w-0 flex-1 overflow-hidden opacity-0 invisible @[250px]:opacity-100 @[250px]:visible">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground truncate">
            Match History
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
            {matches.length} matches found
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="@[200px]:flex hidden">
            {hiddenMatchesCount > 0 && onShowHiddenMatches && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowHiddenMatches}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                <span>{hiddenMatchesCount}</span>
              </Button>
            )}
          </div>
          <MatchListLayoutButtons
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 px-0 py-0 @[35px]:block hidden">
        <div className="px-4 py-2">
          <MatchListView
            matches={matches}
            selectedMatchId={selectedMatchId || null}
            onSelectMatch={onSelectMatch || (() => {})}
            onHideMatch={onHideMatch}
            onRefreshMatch={onRefreshMatch}
            viewMode={viewMode}
            teamMatches={teamMatches}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchesList;