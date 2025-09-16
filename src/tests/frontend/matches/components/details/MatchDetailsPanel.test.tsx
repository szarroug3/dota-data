import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MatchDetailsPanel } from '@/frontend/matches/components/details/MatchDetailsPanel';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

// Mock the child components
jest.mock('@/frontend/matches/components/details/MatchDetailsPanelDraft', () => ({
  MatchDetailsPanelDraft: () => <div>Draft Panel</div>,
}));

jest.mock('@/frontend/matches/components/details/MatchDetailsPanelPlayers', () => ({
  MatchDetailsPanelPlayers: () => <div data-testid="players-panel">Players Panel</div>,
}));

jest.mock('@/frontend/matches/components/details/MatchDetailsPanelEvents', () => ({
  MatchDetailsPanelEvents: () => <div>Events Panel</div>,
}));

const mockMatch: Match = {
  id: 1,
  date: '2024-01-15T10:30:00Z',
  duration: 3600,
  radiant: { name: 'Radiant Team' },
  dire: { name: 'Dire Team' },
  draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
  players: { radiant: [], dire: [] },
  statistics: {
    radiantScore: 25,
    direScore: 20,
    goldAdvantage: { times: [], radiantGold: [], direGold: [] },
    experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
  },
  events: [],
  result: 'radiant',
};

const mockTeamMatch: TeamMatchParticipation = {
  matchId: 1,
  result: 'won',
  duration: 3600,
  opponentName: 'Team Liquid',
  leagueId: 'league-1',
  startTime: 1705314600,
  side: 'radiant',
  pickOrder: 'first',
};

describe('MatchDetailsPanel', () => {
  const defaultProps = {
    match: mockMatch,
    teamMatch: mockTeamMatch,
    viewMode: 'draft' as const,
    onViewModeChange: jest.fn(),
  };

  it('renders with match details header', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    expect(screen.getByText('Match Details')).toBeInTheDocument();
  });

  it('renders view mode tabs when handler is provided', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('calls onViewModeChange when tabs are clicked', async () => {
    const user = userEvent.setup();
    const onViewModeChange = jest.fn();
    render(<MatchDetailsPanel {...defaultProps} onViewModeChange={onViewModeChange} />);

    await user.click(screen.getByText('Players'));
    expect(onViewModeChange).toHaveBeenCalledWith('players');

    await user.click(screen.getByText('Events'));
    expect(onViewModeChange).toHaveBeenCalledWith('events');
  });

  it('renders correct content based on view mode', () => {
    render(<MatchDetailsPanel {...defaultProps} viewMode="players" />);
    expect(screen.getByTestId('players-panel')).toBeInTheDocument();
  });
});
