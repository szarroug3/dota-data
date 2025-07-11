'use client';

import React, { Suspense, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { Sidebar } from '@/components/layout/Sidebar';
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          No Teams Added
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add a team first to view team analysis.
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
        Choose a team from the sidebar to view detailed analysis.
      </p>
    </div>
  );
};

const ErrorContent: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
      Error Loading Team Data
    </h2>
    <p className="text-red-600 dark:text-red-300">
      {error}
    </p>
  </div>
);

interface TeamAnalysisContentProps {
  activeTeam: Team | null;
  activeTeamId: string;
}

function TeamAnalysisContent({ activeTeam, activeTeamId }: TeamAnalysisContentProps) {
  const [analysisType, setAnalysisType] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [timeRange, setTimeRange] = useState(90);

  const { matches, players } = useMatchData();
  const { teamAnalysis } = useTeamAnalysis(matches, players, activeTeamId);

  return (
    <>
      <ControlsSection
        analysisType={analysisType}
        timeRange={timeRange}
        activeTeam={activeTeam}
        activeTeamId={activeTeamId}
        onAnalysisTypeChange={setAnalysisType}
        onTimeRangeChange={setTimeRange}
      />
      
      <OverallPerformanceSection teamAnalysis={teamAnalysis} />
      <StrengthsWeaknessesSection teamAnalysis={teamAnalysis} />
      <TimePerformanceSection teamAnalysis={teamAnalysis} />
      <HeroPerformanceSection teamAnalysis={teamAnalysis} />
      <RecommendationsSection teamAnalysis={teamAnalysis} />
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Team Analysis" 
          subtitle="Analyze your team's performance and get insights"
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSkeleton />}>
              <div className="container mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Team Analysis
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