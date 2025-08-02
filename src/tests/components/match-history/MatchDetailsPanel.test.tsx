import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MatchDetailsPanel } from '@/components/match-history/details/MatchDetailsPanel';
import type { MatchDetails } from '@/types/contexts/match-context-value';

// Mock the child components
jest.mock('@/components/match-history/details/MatchDetailsPanelDraft', () => ({
  MatchDetailsPanelDraft: ({ _match }: { _match: MatchDetails | null }) => (
    <div data-testid="draft-panel">Draft Panel</div>
  ),
}));

jest.mock('@/components/match-history/details/MatchDetailsPanelPlayers', () => ({
  MatchDetailsPanelPlayers: ({ _match }: { _match: MatchDetails | null }) => (
    <div data-testid="players-panel">Players Panel</div>
  ),
}));

jest.mock('@/components/match-history/details/MatchDetailsPanelEvents', () => ({
  MatchDetailsPanelEvents: ({ _match }: { _match: MatchDetails | null }) => (
    <div data-testid="events-panel">Events Panel</div>
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
    viewMode: 'draft-events' as const,
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
    expect(screen.getByText('Select a match to see details.')).toBeInTheDocument();
  });

  it('renders without view mode change handler', () => {
    render(<MatchDetailsPanel {...defaultProps} onViewModeChange={undefined} />);
    
    expect(screen.getByText('Match Details')).toBeInTheDocument();
    expect(screen.queryByText('Draft & Events')).not.toBeInTheDocument();
  });

  it('renders view mode buttons when handler is provided', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    
    expect(screen.getByText('Draft & Events')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Timings')).toBeInTheDocument();
  });

  it('calls onViewModeChange when buttons are clicked', async () => {
    const user = userEvent.setup();
    const onViewModeChange = jest.fn();
    
    render(<MatchDetailsPanel {...defaultProps} onViewModeChange={onViewModeChange} />);
    
    await user.click(screen.getByText('Players'));
    expect(onViewModeChange).toHaveBeenCalledWith('players');
    
    await user.click(screen.getByText('Timings'));
    expect(onViewModeChange).toHaveBeenCalledWith('timings');
  });

  it('renders correct content based on view mode', () => {
    render(<MatchDetailsPanel {...defaultProps} viewMode="players" />);
    
    expect(screen.getByTestId('players-panel')).toBeInTheDocument();
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
    const draftEventsSpan = screen.getByText('Draft & Events');
    const playersSpan = screen.getByText('Players');
    const timingsSpan = screen.getByText('Timings');
    
    expect(draftEventsSpan).toHaveClass('hidden', 'sm:inline');
    expect(playersSpan).toHaveClass('hidden', 'sm:inline');
    expect(timingsSpan).toHaveClass('hidden', 'sm:inline');
  });
}); 