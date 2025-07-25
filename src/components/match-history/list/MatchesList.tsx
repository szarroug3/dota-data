import { Eye, LayoutGrid, List, SquareStack } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
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
  <div className="@[160px]:flex hidden">
    <button
      type="button"
      className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
      aria-label="List view"
      onClick={() => setViewMode('list')}
    >
      <List className="w-5 h-5" />
    </button>
    <button
      type="button"
      className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
      aria-label="Card view"
      onClick={() => setViewMode('card')}
    >
      <SquareStack className="w-5 h-5" />
    </button>
    <button
      type="button"
      className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
      aria-label="Grid view"
      onClick={() => setViewMode('grid')}
    >
      <LayoutGrid className="w-5 h-5" />
    </button>
  </div>
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
    <div className="bg-card dark:bg-card rounded-lg shadow-md flex flex-col max-h-[calc(100vh-14rem)]">
    <div className="p-6 flex items-center justify-between flex-shrink-0 min-w-0">
      <div className="min-w-0 flex-1 overflow-hidden opacity-0 invisible @[250px]:opacity-100 @[250px]:visible">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground truncate">
          Match History
        </h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
          {matches.length} matches found
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
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
        <MatchListLayoutButtons
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2">
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
  </div>
);
};

export default MatchesList;