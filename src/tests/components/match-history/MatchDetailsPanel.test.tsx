import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MatchDetailsPanel } from '@/components/match-history/details/MatchDetailsPanel';
import type { MatchDetails } from '@/types/contexts/match-context-value';

// Mock the child components
jest.mock('@/components/match-history/details/MatchDetailsPanelAnalytics', () => ({
  MatchDetailsPanelAnalytics: ({ _match }: { _match: MatchDetails | null }) => (
    <div data-testid="analytics-panel">Analytics Panel</div>
  ),
}));

jest.mock('@/components/match-history/details/MatchDetailsPanelDetailed', () => ({
  MatchDetailsPanelDetailed: ({ _match }: { _match: MatchDetails | null }) => (
    <div data-testid="detailed-panel">Detailed Panel</div>
  ),
}));

jest.mock('@/components/match-history/details/MatchDetailsPanelMinimal', () => ({
  MatchDetailsPanelMinimal: ({ _match }: { _match: MatchDetails | null }) => (
    <div data-testid="minimal-panel">Minimal Panel</div>
  ),
}));

jest.mock('@/components/match-history/details/MatchDetailsPanelSummary', () => ({
  MatchDetailsPanelSummary: ({ _match }: { _match: MatchDetails | null }) => (
    <div data-testid="summary-panel">Summary Panel</div>
  ),
}));

const mockMatch: MatchDetails = {
  id: '1',
  teamId: 'team-1',
  leagueId: 'league-1',
  opponent: 'Team Liquid',
  date: '2024-01-15T10:30:00Z',
  duration: 3600,
  result: 'win',
  teamSide: 'radiant',
  pickOrder: 'first',
  gameMode: 'captains_mode',
  heroes: ['crystal_maiden', 'juggernaut', 'lina'],
  players: [],
  // MatchDetails specific properties
  radiantTeam: 'Team Liquid',
  direTeam: 'Opponent Team',
  radiantScore: 25,
  direScore: 20,
  lobbyType: 'ranked',
  radiantPlayers: [],
  direPlayers: [],
  radiantPicks: [],
  radiantBans: [],
  direPicks: [],
  direBans: [],
  events: [],
  analysis: {
    keyMoments: [],
    teamFights: [],
    objectives: [],
    performance: {
      radiantAdvantage: [],
      direAdvantage: [],
      goldGraph: [],
      xpGraph: [],
    },
  },
};

describe('MatchDetailsPanel', () => {
  const defaultProps = {
    match: mockMatch,
    viewMode: 'summary' as const,
    onViewModeChange: jest.fn(),
  };

  it('renders with match details', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    
    expect(screen.getByText('Match Details')).toBeInTheDocument();
    expect(screen.getByText('vs Team Liquid')).toBeInTheDocument();
  });

  it('renders without match selected', () => {
    render(<MatchDetailsPanel {...defaultProps} match={null} />);
    
    expect(screen.getByText('Match Details')).toBeInTheDocument();
    expect(screen.getByText('No match selected')).toBeInTheDocument();
  });

  it('renders without view mode change handler', () => {
    render(<MatchDetailsPanel {...defaultProps} onViewModeChange={undefined} />);
    
    expect(screen.getByText('Match Details')).toBeInTheDocument();
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

  it('renders view mode buttons when handler is provided', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Minimal')).toBeInTheDocument();
    expect(screen.getByText('Detailed')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('calls onViewModeChange when buttons are clicked', async () => {
    const user = userEvent.setup();
    const onViewModeChange = jest.fn();
    
    render(<MatchDetailsPanel {...defaultProps} onViewModeChange={onViewModeChange} />);
    
    await user.click(screen.getByText('Detailed'));
    expect(onViewModeChange).toHaveBeenCalledWith('detailed');
    
    await user.click(screen.getByText('Analytics'));
    expect(onViewModeChange).toHaveBeenCalledWith('analytics');
  });

  it('renders correct content based on view mode', () => {
    render(<MatchDetailsPanel {...defaultProps} viewMode="detailed" />);
    
    expect(screen.getByTestId('detailed-panel')).toBeInTheDocument();
  });

  it('renders fallback content for unknown view mode', () => {
    render(<MatchDetailsPanel {...defaultProps} viewMode={'unknown' as any} />);
    
    expect(screen.getByText('This details view mode is not yet implemented.')).toBeInTheDocument();
  });

  it('has proper styling classes for title and subtitle', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    
    const title = screen.getByText('Match Details');
    const subtitle = screen.getByText('vs Team Liquid');
    
    expect(title).toHaveClass('text-lg', 'font-semibold');
    expect(subtitle).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('has container query classes for responsive behavior', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    
    // Find the card element that contains the @container class
    const card = document.querySelector('[class*="@container"]');
    expect(card).toBeInTheDocument();
  });

  it('has responsive button text that hides on small screens', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    
    // Check that the span elements have the correct classes
    const summarySpan = screen.getByText('Summary');
    const minimalSpan = screen.getByText('Minimal');
    const detailedSpan = screen.getByText('Detailed');
    const analyticsSpan = screen.getByText('Analytics');
    
    expect(summarySpan).toHaveClass('hidden', 'sm:inline');
    expect(minimalSpan).toHaveClass('hidden', 'sm:inline');
    expect(detailedSpan).toHaveClass('hidden', 'sm:inline');
    expect(analyticsSpan).toHaveClass('hidden', 'sm:inline');
  });
}); 