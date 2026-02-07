import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Match, TeamMatchMetadata } from '@/frontend/lib/app-data-types';
import { MatchDetailsPanel } from '@/frontend/matches/components/details/MatchDetailsPanel';

// Mock the child components
jest.mock('@/frontend/matches/components/details/MatchDetailsPanelDraft', () => ({
  MatchDetailsPanelDraft: () => <div>Draft Panel</div>,
}));

jest.mock('@/frontend/matches/components/details/MatchDetailsPanelPlayers', () => ({
  MatchDetailsPanelPlayers: () => <div>Players Panel</div>,
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

const mockTeamMatch: TeamMatchMetadata = {
  result: 'won',
  opponentName: 'Team Liquid',
  side: 'radiant',
  isManual: false,
  isHidden: false,
};

describe('MatchDetailsPanel', () => {
  const defaultProps = {
    match: mockMatch,
    teamMatch: mockTeamMatch,
    viewMode: 'draft' as const,
    onViewModeChange: jest.fn(),
    allMatches: [mockMatch],
    teamMatches: new Map([[mockMatch.id, mockTeamMatch]]),
    hiddenMatchIds: new Set<number>(),
    selectedTeamId: '1-1',
  };

  it('renders with match details header', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Match Details', hidden: true })).toBeInTheDocument();
  });

  it('renders view mode tabs when handler is provided', () => {
    render(<MatchDetailsPanel {...defaultProps} />);
    expect(screen.getAllByRole('tab', { hidden: true })).toHaveLength(3);
  });

  it('calls onViewModeChange when tabs are clicked', async () => {
    const user = userEvent.setup();
    const onViewModeChange = jest.fn();
    render(<MatchDetailsPanel {...defaultProps} onViewModeChange={onViewModeChange} />);

    await user.click(screen.getByRole('tab', { name: 'Players', hidden: true }));
    expect(onViewModeChange).toHaveBeenCalledWith('players');

    await user.click(screen.getByRole('tab', { name: 'Events', hidden: true }));
    expect(onViewModeChange).toHaveBeenCalledWith('events');
  });

  it('renders correct content based on view mode', () => {
    render(<MatchDetailsPanel {...defaultProps} viewMode="players" />);
    expect(screen.getByTestId('players-panel')).toBeInTheDocument();
    expect(screen.getByText('Players Panel')).toBeInTheDocument();
  });

  it('shows loading state when match is refreshing', () => {
    render(<MatchDetailsPanel {...defaultProps} match={{ ...mockMatch, isLoading: true }} viewMode="draft" />);

    expect(screen.getByText('Refreshing match...')).toBeInTheDocument();
  });
});
