'use client';

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { Sidebar } from '@/components/layout/Sidebar';

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
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Player Statistics" 
            subtitle="Analyze individual player performance and statistics"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
                {renderContent()}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}; 