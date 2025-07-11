import React from 'react';

import { useTeamData } from '@/hooks/use-team-data';
import type { TeamData } from '@/types/contexts/team-context-value';

import { PerformanceHighlights } from './PerformanceHighlights';
import { QuickActions } from './QuickActions';
import { RecentMatches } from './RecentMatches';
import { TeamOverview } from './TeamOverview';
import { WelcomeSection } from './WelcomeSection';

// Define the expected match type for mapping
interface DashboardMatch {
  id: string;
  win: boolean;
  opponentTeamName: string;
  date: string;
}

function mapMatches(matches: { id: string; result: string; opponent: string; date: string }[] = []): DashboardMatch[] {
  return matches.map((m) => ({
    id: m.id,
    win: m.result === 'win',
    opponentTeamName: m.opponent,
    date: m.date,
  }));
}

function renderWelcome() {
  return <WelcomeSection />;
}

function renderSelectTeam() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Select a Team
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Choose a team from the sidebar to view their dashboard and performance data.
        </p>
      </div>
      <WelcomeSection />
    </div>
  );
}

function renderLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderError(teamDataError: string | null) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Error Loading Team Data
        </h2>
        <p className="text-red-600 dark:text-red-300">
          {teamDataError || 'Failed to load team data. Please try again.'}
        </p>
      </div>
    </div>
  );
}

function renderNoData() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">No team data available. Add your first match to get started!</p>
      </div>
    </div>
  );
}

function renderDashboardContent(teamData: TeamData) {
  const mappedMatches = mapMatches(teamData?.matches);
  const teamOverviewData = {
    totalMatches: teamData?.summary?.totalMatches,
    winRate: teamData?.summary?.overallWinRate,
    recentTrend: undefined, // TODO: derive from teamData if available
    recentMatches: mappedMatches,
  };
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6" data-testid="dashboard-main-content">
          <TeamOverview teamData={teamOverviewData} />
          <RecentMatches 
            recentMatches={mappedMatches}
            onAddMatch={() => { /* TODO: Implement add match action */ }}
            onViewAll={() => { /* TODO: Implement view all matches action */ }}
          />
          <PerformanceHighlights />
        </div>
        {/* Sidebar - 1/3 width */}
        <div className="lg:col-span-1" data-testid="dashboard-sidebar">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export const DashboardContent: React.FC = () => {
  const { teams, activeTeamId, teamData, isLoadingTeamData, teamDataError } = useTeamData();

  if (!teams || teams.length === 0) return renderWelcome();
  if (!activeTeamId) return renderSelectTeam();
  if (isLoadingTeamData) return renderLoading();
  if (teamDataError) return renderError(teamDataError);
  if (!teamData) return renderNoData();

  return renderDashboardContent(teamData);
}; 