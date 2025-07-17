'use client';

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';

import { EmptyStateContent } from './player-stats-page/EmptyStateContent';
import { ErrorContent } from './player-stats-page/ErrorContent';
import { PlayerFilters } from './player-stats-page/PlayerFilters';
import { PlayerGrid } from './player-stats-page/PlayerGrid';
import { PlayerStatsHeader } from './player-stats-page/PlayerStatsHeader';
import { usePlayerStats } from './player-stats-page/usePlayerStats';

export const PlayerStatsPage: React.FC = () => {
  const {
    teams,
    activeTeamId,
    activeTeam,
    isLoadingPlayers,
    playersError,
    viewType,
    setViewType,
    sortBy,
    sortDirection,
    handleSortChange,
    handleSortDirectionChange,
    sortedPlayers
  } = usePlayerStats();

  const renderContent = () => {
    if (!teams || teams.length === 0) {
      return <EmptyStateContent type="no-teams" />;
    }
    if (!activeTeamId) {
      return <EmptyStateContent type="no-selection" />;
    }
    if (isLoadingPlayers) {
      return <LoadingSkeleton type="text" lines={8} />;
    }
    if (playersError) {
      return <ErrorContent error={playersError} />;
    }
    return (
      <>
        <PlayerStatsHeader activeTeam={activeTeam} activeTeamId={activeTeamId} />
        <PlayerFilters
          viewType={viewType}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onViewTypeChange={setViewType}
          onSortChange={handleSortChange}
          onSortDirectionChange={handleSortDirectionChange}
        />
        <PlayerGrid players={sortedPlayers} viewType={viewType} />
      </>
    );
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
        {renderContent()}
      </Suspense>
    </ErrorBoundary>
  );
}; 