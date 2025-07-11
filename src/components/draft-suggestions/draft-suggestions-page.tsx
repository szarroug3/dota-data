'use client';

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { Sidebar } from '@/components/layout/Sidebar';
import { useHeroData } from '@/hooks/use-hero-data';
import { useTeamData } from '@/hooks/use-team-data';
import { useDraftSuggestions } from '@/hooks/useDraftSuggestions';
import type { Team } from '@/types/contexts/team-context-value';

import { DraftControlsSection } from './DraftControlsSection';
import { DraftStateSection } from './DraftStateSection';
import { HeroSuggestionsSection } from './HeroSuggestionsSection';
import { MetaStatsSection } from './MetaStatsSection';

const EmptyStateContent: React.FC<{ type: 'no-teams' | 'no-selection' }> = ({ type }) => {
  if (type === 'no-teams') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          No Teams Added
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add a team first to get draft suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Select a Team
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose a team from the sidebar to get personalized draft suggestions.
      </p>
    </div>
  );
};

const ErrorContent: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
      Error Loading Hero Data
    </h2>
    <p className="text-red-600 dark:text-red-300">
      {error}
    </p>
  </div>
);

interface DraftContentProps {
    activeTeam: Team | null;
}

function DraftContent({ activeTeam }: DraftContentProps) {
  const {
    currentDraft,
    teamSide,
    roleFilter,
    showMetaOnly,
    heroSuggestions,
    metaStats,
    filteredSuggestions,
    handleHeroAction,
    handleResetDraft,
    handleTeamSideChange,
    handleRoleFilterChange,
    handleShowMetaOnlyChange
  } = useDraftSuggestions();

  return (
    <>
      <MetaStatsSection metaStats={metaStats} />
      <div className="mt-8">
        <DraftStateSection
          currentDraft={currentDraft}
          teamSide={teamSide}
          heroSuggestions={heroSuggestions}
          onResetDraft={handleResetDraft}
          onTeamSideChange={handleTeamSideChange}
        />
        <DraftControlsSection
          activeTeam={activeTeam}
          roleFilter={roleFilter}
          showMetaOnly={showMetaOnly}
          onRoleFilterChange={handleRoleFilterChange}
          onShowMetaOnlyChange={handleShowMetaOnlyChange}
        />
        <HeroSuggestionsSection
          currentDraft={currentDraft}
          teamSide={teamSide}
          filteredSuggestions={filteredSuggestions}
          onHeroAction={handleHeroAction}
        />
      </div>
    </>
  );
}

export const DraftSuggestionsPage: React.FC = () => {
  const { teams, activeTeamId, isLoadingTeams } = useTeamData();
  const { error, isLoading: isHeroesLoading } = useHeroData();

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null;

  const renderContent = () => {
    if (isLoadingTeams || isHeroesLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return <ErrorContent error={error} />;
    }

    if (teams.length === 0) {
      return <EmptyStateContent type="no-teams" />;
    }

    if (!activeTeam) {
      return <EmptyStateContent type="no-selection" />;
    }

    return <DraftContent activeTeam={activeTeam} />;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Draft Suggestions" 
          subtitle="Get personalized hero suggestions for your team's draft"
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSkeleton />}>
              <div className="container mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Draft Suggestions
                </h1>
                {renderContent()}
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}; 