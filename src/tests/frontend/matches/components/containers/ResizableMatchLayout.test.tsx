import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ResizableMatchLayout } from '@/frontend/matches/components/containers/ResizableMatchLayout';
import { MatchDetailsPanelMode } from '@/frontend/matches/components/details/MatchDetailsPanel';
import type { MatchFilters as MatchFiltersType } from '@/frontend/matches/components/filters/MatchFilters';
import { MatchListViewMode } from '@/frontend/matches/components/list/MatchListView';
import type { Match } from '@/types/contexts/match-context-value';

// Mock the Resizable components since they use browser APIs
jest.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="resizable-panel-group" className={className}>
      {children}
    </div>
  ),
  ResizablePanel: ({
    children,
    defaultSize,
    minSize,
    maxSize,
  }: {
    children: React.ReactNode;
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
  }) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize?.toString()}
      data-min-size={minSize?.toString()}
      data-max-size={maxSize?.toString()}
    >
      {children}
    </div>
  ),
  ResizableHandle: ({ withHandle }: { withHandle?: boolean }) => (
    <div data-testid="resizable-handle" data-with-handle={withHandle}>
      {withHandle && <div data-testid="handle-grip">⋮</div>}
    </div>
  ),
}));

// Mock child components
jest.mock('@/frontend/matches/components/filters/MatchFilters', () => ({
  MatchFilters: ({
    filters,
    onFiltersChange,
    matches,
  }: {
    filters: MatchFiltersType;
    onFiltersChange: (filters: MatchFiltersType) => void;
    matches: Match[];
  }) => (
    <div data-testid="match-filters">
      <div>Filters: {JSON.stringify(filters)}</div>
      <div>Matches: {matches.length}</div>
      <button onClick={() => onFiltersChange({ ...filters, result: 'wins' })}>Change Filter</button>
    </div>
  ),
}));

jest.mock('@/frontend/matches/components/list/MatchesList', () => ({
  __esModule: true,
  default: ({
    matches,
    onHideMatch,
    viewMode,
    setViewMode,
    selectedMatchId,
    onSelectMatch,
    hiddenMatchesCount,
    onShowHiddenMatches,
    hiddenMatchIds,
  }: {
    matches: Match[];
    onHideMatch: (id: string) => void;
    viewMode: MatchListViewMode;
    setViewMode: (mode: MatchListViewMode) => void;
    selectedMatchId?: string | null;
    onSelectMatch?: (matchId: string) => void;
    hiddenMatchesCount?: number;
    onShowHiddenMatches?: () => void;
    teamMatches?: Record<number, any>;
    hiddenMatchIds?: Set<number>;
  }) => (
    <div data-testid="matches-list">
      <div>View Mode: {viewMode}</div>
      <div>Matches: {matches.length}</div>
      <div>Selected: {selectedMatchId || 'none'}</div>
      <div>Hidden: {hiddenMatchesCount || 0}</div>
      <div>Hidden IDs: {hiddenMatchIds?.size || 0}</div>
      {matches.map((match) => (
        <button key={match.id} onClick={() => onSelectMatch?.(match.id.toString())} data-testid={`match-${match.id}`}>
          {match.radiant.name}
        </button>
      ))}
      <button onClick={() => onHideMatch('match1')}>Hide Match</button>
      <button onClick={() => setViewMode('card')}>Set Card View</button>
      {onShowHiddenMatches && <button onClick={onShowHiddenMatches}>Show Hidden</button>}
    </div>
  ),
}));

jest.mock('@/frontend/matches/components/details/MatchDetailsPanel', () => ({
  MatchDetailsPanel: ({
    match,
    viewMode,
    onViewModeChange,
  }: {
    match: Match | null;
    viewMode: MatchDetailsPanelMode;
    onViewModeChange?: (mode: MatchDetailsPanelMode) => void;
  }) => (
    <div data-testid="match-details-panel">
      <div>View Mode: {viewMode}</div>
      {match ? (
        <div>
          <div>Match: {match.radiant.name}</div>
          <button onClick={() => onViewModeChange?.('draft')}>Set Draft</button>
          <button onClick={() => onViewModeChange?.('players')}>Set Players</button>
          <button onClick={() => onViewModeChange?.('events')}>Set Events</button>
        </div>
      ) : (
        <div>No match selected</div>
      )}
    </div>
  ),
}));

const mockMatch: Match = {
  id: 1,
  date: '2024-01-01',
  duration: 1800,
  radiant: {
    id: 1,
    name: 'Team Alpha',
  },
  dire: {
    id: 2,
    name: 'Team Beta',
  },
  draft: {
    radiantPicks: [],
    direPicks: [],
    radiantBans: [],
    direBans: [],
  },
  players: {
    radiant: [],
    dire: [],
  },
  statistics: {
    radiantScore: 25,
    direScore: 20,
    goldAdvantage: {
      times: [],
      radiantGold: [],
      direGold: [],
    },
    experienceAdvantage: {
      times: [],
      radiantExperience: [],
      direExperience: [],
    },
  },
  events: [],
  result: 'radiant',
  pickOrder: {
    radiant: 'first',
    dire: 'second',
  },
};

const defaultProps = {
  filters: {
    dateRange: 'all' as const,
    customDateRange: { start: null, end: null },
    result: 'all' as const,
    opponent: [],
    teamSide: 'all' as const,
    pickOrder: 'all' as const,
    heroesPlayed: [],
    highPerformersOnly: false,
  },
  onFiltersChange: jest.fn(),
  activeTeamMatches: [mockMatch],
  teamMatches: {},
  visibleMatches: [mockMatch],
  filteredMatches: [mockMatch],
  unhiddenMatches: [mockMatch],
  onHideMatch: jest.fn(),
  onRefreshMatch: jest.fn(),
  viewMode: 'list' as MatchListViewMode,
  setViewMode: jest.fn(),
  selectedMatchId: null,
  onSelectMatch: jest.fn(),
  hiddenMatchesCount: 0,
  onShowHiddenMatches: jest.fn(),
  hiddenMatchIds: new Set<number>(),
  selectedMatch: null,
  matchDetailsViewMode: 'summary' as MatchDetailsPanelMode,
  setMatchDetailsViewMode: jest.fn(),
};

describe('ResizableMatchLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ResizableMatchLayout {...defaultProps} />);

    expect(screen.getByTestId('resizable-panel-group')).toBeInTheDocument();
    expect(screen.getByTestId('match-filters')).toBeInTheDocument();
    expect(screen.getByTestId('matches-list')).toBeInTheDocument();
    expect(screen.getByTestId('resizable-handle')).toBeInTheDocument();
  });

  it('renders with handle when match is selected', () => {
    render(<ResizableMatchLayout {...defaultProps} selectedMatch={mockMatch} />);

    const handle = screen.getByTestId('resizable-handle');
    expect(handle).toHaveAttribute('data-with-handle', 'true');
    expect(screen.getByTestId('handle-grip')).toBeInTheDocument();
  });

  it('renders two panels with correct structure', () => {
    render(<ResizableMatchLayout {...defaultProps} />);

    const panels = screen.getAllByTestId('resizable-panel');
    expect(panels).toHaveLength(2);

    // Check that both panels exist and have the correct structure
    expect(panels[0]).toBeInTheDocument();
    expect(panels[1]).toBeInTheDocument();

    // Check panel constraints - both panels should be fully flexible
    expect(panels[0]).toHaveAttribute('data-min-size', '0');
    expect(panels[0]).toHaveAttribute('data-max-size', '100');
    expect(panels[1]).toHaveAttribute('data-min-size', '0');
    expect(panels[1]).toHaveAttribute('data-max-size', '100');
  });

  it('renders match filters at the top', () => {
    render(<ResizableMatchLayout {...defaultProps} />);

    const filters = screen.getByTestId('match-filters');
    expect(filters).toBeInTheDocument();
    expect(filters.textContent).toContain('Filters:');
    expect(filters.textContent).toContain('Matches: 1');
  });

  it('renders matches list in left panel', () => {
    render(<ResizableMatchLayout {...defaultProps} />);

    const matchesList = screen.getByTestId('matches-list');
    expect(matchesList).toBeInTheDocument();
    expect(matchesList.textContent).toContain('View Mode: list');
    expect(matchesList.textContent).toContain('Matches: 1');
  });

  it('renders match details panel in right panel when match is selected', () => {
    render(<ResizableMatchLayout {...defaultProps} selectedMatch={mockMatch} />);

    const detailsPanel = screen.getByTestId('match-details-panel');
    expect(detailsPanel).toBeInTheDocument();
    expect(detailsPanel.textContent).toContain('Match: Team Alpha');
  });

  it('renders details panel with placeholder when no match is selected', () => {
    render(<ResizableMatchLayout {...defaultProps} />);

    // Details panel should be rendered but with placeholder content
    expect(screen.getByText('No Match Selected')).toBeInTheDocument();
    expect(screen.getByText('Select a match from the list to view details')).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    const onFiltersChange = jest.fn();
    const onHideMatch = jest.fn();
    const setViewMode = jest.fn();
    const onSelectMatch = jest.fn();
    const setMatchDetailsViewMode = jest.fn();

    render(
      <ResizableMatchLayout
        {...defaultProps}
        onFiltersChange={onFiltersChange}
        onHideMatch={onHideMatch}
        setViewMode={setViewMode}
        onSelectMatch={onSelectMatch}
        setMatchDetailsViewMode={setMatchDetailsViewMode}
      />,
    );

    // Test filter change
    fireEvent.click(screen.getByText('Change Filter'));
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ result: 'wins' }));

    // Test match selection
    fireEvent.click(screen.getByTestId('match-1'));
    expect(onSelectMatch).toHaveBeenCalledWith('1');

    // Test view mode change
    fireEvent.click(screen.getByText('Set Card View'));
    expect(setViewMode).toHaveBeenCalledWith('card');

    // Test hide match
    fireEvent.click(screen.getByText('Hide Match'));
    expect(onHideMatch).toHaveBeenCalledWith('match1');
  });

  it('handles hidden matches count and show hidden button', () => {
    render(<ResizableMatchLayout {...defaultProps} hiddenMatchesCount={3} onShowHiddenMatches={jest.fn()} />);

    expect(screen.getByText('Hidden: 3')).toBeInTheDocument();
    expect(screen.getByText('Show Hidden')).toBeInTheDocument();
  });

  it('handles match details view mode changes', () => {
    const setMatchDetailsViewMode = jest.fn();

    render(
      <ResizableMatchLayout
        {...defaultProps}
        selectedMatch={mockMatch}
        setMatchDetailsViewMode={setMatchDetailsViewMode}
      />,
    );

    fireEvent.click(screen.getByText('Set Players'));
    expect(setMatchDetailsViewMode).toHaveBeenCalledWith('players');
  });

  it('renders with correct layout structure', () => {
    render(<ResizableMatchLayout {...defaultProps} />);

    // Check that the layout has the correct structure
    const container = screen.getByTestId('resizable-panel-group').parentElement;
    expect(container).toHaveClass('h-fit');

    // Check that filters are at the top
    const filtersContainer = screen.getByTestId('match-filters').parentElement;
    expect(filtersContainer).toHaveClass('flex-shrink-0');
  });
});
