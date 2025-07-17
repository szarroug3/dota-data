'use client';

import React, { Suspense, useCallback, useMemo, useState } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Match } from '@/types/contexts/match-context-value';

// ============================================================================
// TYPES
// ============================================================================

interface MatchFilter {
  dateRange: number; // days
  result: 'all' | 'win' | 'loss';
  heroes: string[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const filterMatches = (matches: Match[], filters: MatchFilter): Match[] => {
  return matches.filter(match => {
    // Date range filter
    if (filters.dateRange > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.dateRange);
      const matchDate = new Date(match.date);
      if (matchDate < cutoffDate) return false;
    }

    // Result filter
    if (filters.result !== 'all') {
      if (filters.result === 'win' && match.result !== 'win') return false;
      if (filters.result === 'loss' && match.result !== 'loss') return false;
    }

    // Heroes filter
    if (filters.heroes.length > 0) {
      const hasHero = filters.heroes.some(hero => match.heroes.includes(hero));
      if (!hasHero) return false;
    }

    return true;
  });
};

const sortMatches = (
  matches: Match[], 
  sortBy: 'date' | 'duration' | 'opponent',
  sortDirection: 'asc' | 'desc'
): Match[] => {
  return [...matches].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'opponent':
        comparison = a.opponent.localeCompare(b.opponent);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// COMPONENTS
// ============================================================================

const EmptyStateContent: React.FC<{ type: 'no-teams' | 'no-selection' }> = ({ type }) => {
  const content = {
    'no-teams': {
      title: 'No Teams Added',
      description: 'Add your first team to start viewing match history.',
      action: 'Add Team'
    },
    'no-selection': {
      title: 'Select a Team',
      description: 'Choose a team from the sidebar to view their match history.',
      action: null
    }
  };

  const { title, description, action } = content[type];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-4">
          {title}
        </h3>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          {description}
        </p>
        {action && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            {action}
          </button>
        )}
      </div>
    </div>
  );
};

const ErrorContent: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="text-center">
      <h3 className="text-xl font-semibold text-destructive dark:text-red-400 mb-4">
        Error Loading Match History
      </h3>
      <p className="text-muted-foreground dark:text-muted-foreground">
        {error}
      </p>
    </div>
  </div>
);

const FiltersSection: React.FC<{
  filters: MatchFilter;
  sortBy: 'date' | 'duration' | 'opponent';
  sortDirection: 'asc' | 'desc';
  onFilterChange: (newFilters: Partial<MatchFilter>) => void;
  onSortChange: (newSortBy: 'date' | 'duration' | 'opponent') => void;
  onSortDirectionChange: () => void;
}> = ({ filters, sortBy, sortDirection, onFilterChange, onSortChange, onSortDirectionChange }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-md p-6 mb-6">
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
            Date Range
          </label>
          <select
            id="dateRange"
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: Number(e.target.value) })}
            className="w-full p-2 border border-border dark:border-border rounded-md bg-card dark:bg-card text-foreground dark:text-foreground"
          >
            <option value={0}>All Time</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>

        <div>
          <label htmlFor="resultFilter" className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
            Result
          </label>
          <select
            id="resultFilter"
            value={filters.result}
            onChange={(e) => onFilterChange({ result: e.target.value as 'all' | 'win' | 'loss' })}
            className="w-full p-2 border border-border dark:border-border rounded-md bg-card dark:bg-card text-foreground dark:text-foreground"
          >
            <option value="all">All Results</option>
            <option value="win">Wins Only</option>
            <option value="loss">Losses Only</option>
          </select>
        </div>

        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'date' | 'duration' | 'opponent')}
              className="flex-1 p-2 border border-border dark:border-border rounded-md bg-card dark:bg-card text-foreground dark:text-foreground"
            >
              <option value="date">Date</option>
              <option value="duration">Duration</option>
              <option value="opponent">Opponent</option>
            </select>
            <button
              onClick={onSortDirectionChange}
              className="px-3 py-2 border border-border dark:border-border rounded-md bg-card dark:bg-card text-foreground dark:text-foreground hover:bg-accent dark:hover:bg-accent"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MatchesList: React.FC<{
  matches: Match[];
}> = ({ matches }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-md">
    <div className="p-6 border-b border-border dark:border-border">
      <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
        Match History
      </h3>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
        {matches.length} matches found
      </p>
    </div>

    {matches.length === 0 ? (
      <div className="p-6 text-center">
        <p className="text-muted-foreground dark:text-muted-foreground">
          No matches found with the current filters.
        </p>
      </div>
    ) : (
      <div className="divide-y divide-border dark:divide-border">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    )}
  </div>
);

// Component for the main content
const MatchHistoryContent: React.FC<{
  filters: MatchFilter;
  sortBy: 'date' | 'duration' | 'opponent';
  sortDirection: 'asc' | 'desc';
  sortedMatches: Match[];
  onFilterChange: (newFilters: Partial<MatchFilter>) => void;
  onSortChange: (newSortBy: 'date' | 'duration' | 'opponent') => void;
  onSortDirectionChange: () => void;
}> = ({
  filters,
  sortBy,
  sortDirection,
  sortedMatches,
  onFilterChange,
  onSortChange,
  onSortDirectionChange
}) => (
  <div className="space-y-6">
    <FiltersSection
      filters={filters}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onFilterChange={onFilterChange}
      onSortChange={onSortChange}
      onSortDirectionChange={onSortDirectionChange}
    />
    <MatchesList
      matches={sortedMatches}
    />
  </div>
);

export const MatchHistoryPage: React.FC = () => {
  // Use data coordinator for orchestrated data fetching
  const { 
    operationState,
    errorState,
    clearAllErrors: clearCoordinatorError 
  } = useDataCoordinator();
  
  const isCoordinatorLoading = operationState.isInProgress;
  const coordinatorError = errorState.errorMessage;
  
  // Use team context for team data
  const { teamDataList, activeTeam } = useTeamContext();
  
  // Use match context for match data and operations
  const { 
    matches, 
    isLoadingMatches: isLoading, 
    matchesError
  } = useMatchContext();
  
  // Filter matches by active team
  const activeTeamMatches = useMemo(() => {
    if (!activeTeam) {
      return [];
    }
    const filtered = matches.filter(match => 
      match.teamId === activeTeam.teamId && match.leagueId === activeTeam.leagueId
    );
    return filtered;
  }, [matches, activeTeam]);
  
  const [filters, setFilters] = useState<MatchFilter>({
    dateRange: 0,
    result: 'all',
    heroes: []
  });

  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'opponent'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredMatches = useMemo(() => {
    return filterMatches(activeTeamMatches, filters);
  }, [activeTeamMatches, filters]);

  const sortedMatches = useMemo(() => {
    return sortMatches(filteredMatches, sortBy, sortDirection);
  }, [filteredMatches, sortBy, sortDirection]);

  const handleFilterChange = useCallback((newFilters: Partial<MatchFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  const handleSortDirectionChange = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Clear coordinator errors when component mounts
  React.useEffect(() => {
    if (coordinatorError) {
      clearCoordinatorError();
    }
  }, [coordinatorError, clearCoordinatorError]);

  const renderContent = () => {
    if (!teamDataList || teamDataList.length === 0) {
      return <EmptyStateContent type="no-teams" />;
    }

    if (!activeTeam) {
      return <EmptyStateContent type="no-selection" />;
    }

    // Show coordinator loading state
    if (isCoordinatorLoading) {
      return <LoadingSkeleton type="text" lines={8} />;
    }

    // Show coordinator error state
    if (coordinatorError) {
      return <ErrorContent error={coordinatorError} />;
    }

    // Show match loading state
    if (isLoading) {
      return <LoadingSkeleton type="text" lines={8} />;
    }

    // Show match error state
    if (matchesError) {
      return <ErrorContent error={matchesError} />;
    }

    return (
      <MatchHistoryContent
        filters={filters}
        sortBy={sortBy}
        sortDirection={sortDirection}
        sortedMatches={sortedMatches}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onSortDirectionChange={handleSortDirectionChange}
      />
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 bg-background text-foreground transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={<LoadingSkeleton type="text" lines={6} />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

interface MatchRowProps {
  match: Match;
}

const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  return (
    <div className="p-4 hover:bg-accent dark:hover:bg-accent transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
              match.result === 'win'
                ? 'bg-green-500'
                : 'bg-red-500'
            }`}
          >
            {match.result === 'win' ? 'W' : 'L'}
          </div>
          
          <div>
            <h4 className="font-medium text-foreground dark:text-foreground">
              vs {match.opponent}
            </h4>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {new Date(match.date).toLocaleDateString()} • {Math.floor(match.duration / 60)}m {match.duration % 60}s
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm">
          <div className="text-center">
            <div className="font-semibold text-foreground dark:text-foreground">
              {match.heroes.length}
            </div>
            <div className="text-muted-foreground dark:text-muted-foreground">Heroes</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold text-foreground dark:text-foreground">
              {match.players.length}
            </div>
            <div className="text-muted-foreground dark:text-muted-foreground">Players</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 