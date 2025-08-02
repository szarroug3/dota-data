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
  filteredMatches: Match[]; // Matches after filtering but before hiding
  unhiddenMatches: Match[]; // All matches minus manually hidden ones (for hero performance)
  onHideMatch: (matchId: number) => void;
  onRefreshMatch: (matchId: number) => void;
  viewMode: MatchListViewMode;
  setViewMode: (mode: MatchListViewMode) => void;
  selectedMatchId?: number | null;
  onSelectMatch?: (matchId: number) => void;
  hiddenMatchesCount?: number;
  onShowHiddenMatches?: () => void;
  hiddenMatchIds?: Set<number>;
  
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
  filteredMatches,
  unhiddenMatches,
  onHideMatch,
  onRefreshMatch,
  viewMode,
  setViewMode,
  selectedMatchId,
  onSelectMatch,
  hiddenMatchesCount = 0,
  onShowHiddenMatches,
  hiddenMatchIds = new Set(),
  selectedMatch,
  matchDetailsViewMode,
  setMatchDetailsViewMode,
}) => {
  console.log('🏗️ ResizableMatchLayout:', {
    selectedMatchId,
    selectedMatch: selectedMatch?.id,
    activeTeamMatchesCount: activeTeamMatches.length,
    teamMatchesCount: Object.keys(teamMatches).length,
    hiddenMatchIdsCount: hiddenMatchIds.size,
    activeTeamMatchesIds: activeTeamMatches.map(m => m.id),
    teamMatchesKeys: Object.keys(teamMatches),
    hiddenMatchIds: Array.from(hiddenMatchIds)
  });

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
                hiddenMatchIds={hiddenMatchIds}
                allMatches={unhiddenMatches}
              />
            </div>
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle withHandle className="after:w-4" />
          
          {/* Match Details Panel */}
          <ResizablePanel defaultSize={50} minSize={0} maxSize={100}>
            <div className="h-fit pt-2 pl-3">
              {selectedMatch ? (
                (() => {
                  const teamMatchData = teamMatches[selectedMatch.id];
                  console.log('🎯 ResizableMatchLayout - teamMatch data:', {
                    selectedMatchId: selectedMatch.id,
                    teamMatchData: JSON.stringify(teamMatchData),
                    teamMatchSide: teamMatchData?.side,
                    teamMatchesKeys: Object.keys(teamMatches),
                    hasTeamMatchData: !!teamMatchData,
                    teamMatchesCount: Object.keys(teamMatches).length,
                    allTeamMatchIds: Object.keys(teamMatches).map(id => parseInt(id))
                  });
                  
                  if (!teamMatchData) {
                    console.log('❌ No teamMatchData found for match:', selectedMatch.id);
                    console.log('Available teamMatches keys:', Object.keys(teamMatches));
                  }
                  
                  return (
                    <MatchDetailsPanel
                      match={selectedMatch}
                      teamMatch={teamMatchData}
                      viewMode={matchDetailsViewMode}
                      onViewModeChange={setMatchDetailsViewMode}
                      allMatches={unhiddenMatches}
                      teamMatches={teamMatches}
                      hiddenMatchIds={hiddenMatchIds}
                    />
                  );
                })()
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