import { Eye, LayoutGrid, List, SquareStack } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import type { Match } from '@/types/contexts/match-context-value';

import { MatchListView, MatchListViewMode } from './MatchListView';

interface MatchesListProps {
  matches: Match[];
  onHideMatch: (matchId: string) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: string | null;
  onSelectMatch?: (matchId: string) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
}

const MatchesList: React.FC<MatchesListProps> = ({ 
  matches, 
  onHideMatch, 
  viewMode, 
  setViewMode,
  selectedMatchId,
  onSelectMatch,
  hiddenMatchesCount = 0,
  onShowHiddenMatches
}) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-md flex flex-col max-h-[calc(100vh-14rem)]">
    <div className="p-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
          Match History
        </h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          {matches.length} matches found
        </p>
      </div>
      <div className="flex items-center gap-2">
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
    </div>
    <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2">
      <MatchListView
        matches={matches}
        selectedMatchId={selectedMatchId || null}
        onSelectMatch={onSelectMatch || (() => {})}
        onHideMatch={onHideMatch}
        viewMode={viewMode}
      />
    </div>
  </div>
);

export default MatchesList; 