'use client';

import React, { Suspense, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { useMatchData } from '@/hooks/use-match-data';
import { usePlayerData } from '@/hooks/use-player-data';
import { useTeamData } from '@/hooks/use-team-data';
import type { Team } from '@/types/contexts/team-context-value';

import { ControlsSection } from './team-analysis/ControlsSection';
import { HeroPerformanceSection } from './team-analysis/HeroPerformanceSection';
import { OverallPerformanceSection } from './team-analysis/OverallPerformanceSection';
import { RecommendationsSection } from './team-analysis/RecommendationsSection';
import { StrengthsWeaknessesSection } from './team-analysis/StrengthsWeaknessesSection';
import { TimePerformanceSection } from './team-analysis/TimePerformanceSection';
import { useTeamAnalysis } from './team-analysis/useTeamAnalysis';

const EmptyStateContent: React.FC<{ type: 'no-teams' | 'no-selection' }> = ({ type }) => {
  if (type === 'no-teams') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-4">
          No Teams Added
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          Add a team first to view team analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-4">
        Select a Team
      </h2>
      <p className="text-muted-foreground dark:text-muted-foreground mb-6">
        Choose a team from the sidebar to view detailed analysis.
      </p>
    </div>
  );
};

const ErrorContent: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-destructive dark:text-destructive mb-2">
      Error Loading Team Data
    </h2>
    <p className="text-destructive dark:text-red-300">
      {error}
    </p>
  </div>
);

interface TeamAnalysisContentProps {
  activeTeam: Team | null;
  activeTeamId: string;
}

function TeamAnalysisContent({ activeTeamId }: TeamAnalysisContentProps) {
  const [analysisType, setAnalysisType] = useState<string>('overall');
  const [timeRange, setTimeRange] = useState<string>('30d');

  const { matches, players } = useMatchData();
  const { teamAnalysis } = useTeamAnalysis(matches, players, activeTeamId);

  return (
    <>
      <ControlsSection
        analysisType={analysisType}
        timeRange={timeRange}
        onAnalysisTypeChange={setAnalysisType}
        onTimeRangeChange={setTimeRange}
      />
      
      <OverallPerformanceSection performanceData={teamAnalysis} />
      <StrengthsWeaknessesSection 
        strengths={teamAnalysis?.strengths || []} 
        weaknesses={teamAnalysis?.weaknesses || []} 
      />
      <TimePerformanceSection data={teamAnalysis} />
      <HeroPerformanceSection heroData={teamAnalysis} />
      <RecommendationsSection recommendations={teamAnalysis?.recommendations || []} />
    </>
  );
}

export const TeamAnalysisPage: React.FC = () => {
  const { teams, activeTeamId, isLoadingTeams } = useTeamData();
  const { error, loading: isMatchLoading } = useMatchData();
  const { isLoading: isPlayerLoading } = usePlayerData();

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null;

  const renderContent = () => {
    if (isLoadingTeams || isMatchLoading || isPlayerLoading) {
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

    return <TeamAnalysisContent activeTeam={activeTeam} activeTeamId={activeTeamId || ''} />;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Team Analysis" 
        subtitle="Analyze your team&apos;s performance and get insights"
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background text-foreground p-6 transition-colors duration-300">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}> 
            <div className="container mx-auto">
              <h1 className="text-2xl font-semibold text-foreground mb-6">
                Team Analysis
              </h1>
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Team Analysis Overview
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Comprehensive analysis of your team&apos;s performance, strengths, and areas for improvement.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Performance Metrics
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Detailed breakdown of key performance indicators and trends.
                  </p>
                </div>
              </div>
              {renderContent()}
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}; 