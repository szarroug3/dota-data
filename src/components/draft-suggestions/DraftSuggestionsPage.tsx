'use client';

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { useHeroData } from '@/hooks/use-hero-data';
import { useTeamData } from '@/hooks/use-team-data';
import { useDraftSuggestions } from '@/hooks/useDraftSuggestions';
import type { Team } from '@/types/contexts/team-types';

import { DraftControlsSection } from './DraftControlsSection';
import { DraftStateSection } from './DraftStateSection';
import { HeroSuggestionsSection } from './HeroSuggestionsSection';
import { MetaStatsSection } from './MetaStatsSection';

const EmptyStateContent: React.FC<{ type: 'no-teams' | 'no-selection' }> = ({ type }) => {
  if (type === 'no-teams') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          No Teams Added
        </h2>
        <p className="text-muted-foreground mb-6">
          Add a team first to get draft suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Select a Team
      </h2>
      <p className="text-muted-foreground mb-6">
        Choose a team from the sidebar to get personalized draft suggestions.
      </p>
    </div>
  );
};

const ErrorContent: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-destructive dark:text-destructive mb-2">
      Error Loading Hero Data
    </h2>
    <p className="text-destructive dark:text-red-300">
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
          suggestions={filteredSuggestions}
        />
      </div>
    </>
  );
}

export const DraftSuggestionsPage: React.FC = () => {
  const { teams, activeTeamId, isLoadingTeams } = useTeamData();
  const { heroesError, isLoadingHeroes } = useHeroData();

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null;

  const renderContent = () => {
    if (isLoadingTeams || isLoadingHeroes) {
      return <LoadingSkeleton />;
    }

    if (heroesError) {
      return <ErrorContent error={heroesError} />;
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
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}> 
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Draft Strategy Overview
            </h2>
            <p className="text-muted-foreground mb-6">
              Get personalized hero suggestions and draft strategies based on your team&apos;s performance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Hero Recommendations
            </h2>
            <p className="text-muted-foreground mb-6">
              AI-powered suggestions for optimal hero picks and bans.
            </p>
          </div>
        </div>
        {renderContent()}
      </Suspense>
    </ErrorBoundary>
  );
}; 