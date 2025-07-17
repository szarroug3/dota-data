import React from 'react';

import type { Match } from '@/types/contexts/match-context-value';

import { MatchListViewCard } from './MatchListViewCard';
import { MatchListViewGrid } from './MatchListViewGrid';
import { MatchListViewList } from './MatchListViewList';

export type MatchListViewMode = 'list' | 'card' | 'grid';

interface MatchListViewProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onHideMatch: (matchId: string) => void;
  onRefreshMatch: (matchId: string) => void;
  viewMode: MatchListViewMode;
  className?: string;
}

export const MatchListView: React.FC<MatchListViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  viewMode,
  className = '',
}) => {
  if (viewMode === 'list') {
    return (
      <MatchListViewList
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        onRefreshMatch={onRefreshMatch}
        className={className}
      />
    );
  }
  if (viewMode === 'card') {
    return (
      <MatchListViewCard
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        onRefreshMatch={onRefreshMatch}
        className={className}
      />
    );
  }
  if (viewMode === 'grid') {
    return (
      <MatchListViewGrid
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onHideMatch={onHideMatch}
        className={className}
      />
    );
  }
  return (
    <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
      <div className="text-center">
        <div className="text-lg font-medium mb-2">This view mode is not yet implemented.</div>
        <div className="text-sm">Try switching to list, card, or grid view.</div>
      </div>
    </div>
  );
}; 