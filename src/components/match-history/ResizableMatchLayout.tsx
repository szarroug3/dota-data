'use client';

import React from 'react';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { Match } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

import type { MatchDetailsPanelMode } from './details/MatchDetailsPanel';
import { MatchDetailsPanel } from './details/MatchDetailsPanel';
import type { MatchFilters as MatchFiltersType } from './filters/MatchFilters';
import { MatchFilters } from './filters/MatchFilters';
import MatchesList from './list/MatchesList';
import type { MatchListViewMode } from './list/MatchListView';

interface ResizableMatchLayoutProps {
  // Filters
  filters: MatchFiltersType;
  onFiltersChange: (filters: MatchFiltersType) => void;
  activeTeamMatches: Match[];
  teamMatches: Record<number, TeamMatchParticipation>;
  
  // Match list
  visibleMatches: Match[];
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  
  // Match details
  selectedMatch: Match | null;
  matchDetailsViewMode: MatchDetailsPanelMode;
  setMatchDetailsViewMode: (mode: MatchDetailsPanelMode) => void;
}

export const ResizableMatchLayout: React.FC<ResizableMatchLayoutProps> = ({
  filters,
  onFiltersChange,
  activeTeamMatches,
  teamMatches,
  visibleMatches,
  onHideMatch,
  onRefreshMatch,
  viewMode,
  setViewMode,
  selectedMatchId,
  onSelectMatch,
  hiddenMatchesCount = 0,
  onShowHiddenMatches,
  selectedMatch,
  matchDetailsViewMode,
  setMatchDetailsViewMode,
}) => {
  return (
    <div className="h-fit flex flex-col">
      {/* Filters - Always at the top */}
      <div className="flex-shrink-0 pb-2">
        <MatchFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          matches={activeTeamMatches}
          teamMatches={teamMatches}
        />
      </div>
      
      {/* Resizable Panels */}
      <div className="h-fit">
        <ResizablePanelGroup direction="horizontal">
          {/* Match List Panel */}
          <ResizablePanel defaultSize={50} minSize={0} maxSize={100}>
            <div className="h-fit pt-2 pr-3 @container" style={{ containerType: 'inline-size' }}>
              <MatchesList
                matches={visibleMatches}
                onHideMatch={onHideMatch}
                onRefreshMatch={onRefreshMatch}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedMatchId={selectedMatchId}
                onSelectMatch={onSelectMatch}
                hiddenMatchesCount={hiddenMatchesCount}
                onShowHiddenMatches={onShowHiddenMatches}
                teamMatches={teamMatches}
              />
            </div>
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle withHandle className="after:w-4" />
          
          {/* Match Details Panel */}
          <ResizablePanel defaultSize={50} minSize={0} maxSize={100}>
            <div className="h-fit pt-2 pl-3">
              {selectedMatch ? (
                <MatchDetailsPanel
                  match={selectedMatch}
                  teamMatch={teamMatches[selectedMatch.id]}
                  viewMode={matchDetailsViewMode}
                  onViewModeChange={setMatchDetailsViewMode}
                />
              ) : (
                <div className="bg-card rounded-lg shadow-md flex items-center justify-center p-8 text-muted-foreground min-h-[calc(100vh-19rem)] max-h-[calc(100vh-19rem)]">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">No Match Selected</div>
                    <div className="text-sm">Select a match from the list to view details</div>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}; 