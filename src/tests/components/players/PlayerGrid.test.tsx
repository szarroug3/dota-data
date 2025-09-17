import { render, screen } from '@testing-library/react';

import { PlayerGrid } from '@/frontend/players/components/stateless/PlayerGrid';

jest.mock('@/frontend/players/components/stateless/PlayerOverviewCard', () => ({
  PlayerOverviewCard: ({ player }: { player: any }) => <div data-testid="player-overview">{player?.playerName}</div>,
}));

jest.mock('@/frontend/players/components/stateless/PlayerDetailedCard', () => ({
  PlayerDetailedCard: ({ player }: { player: any }) => <div data-testid="player-detailed">{player?.playerName}</div>,
}));

describe('PlayerGrid', () => {
  const players = [
    { playerId: 1, playerName: 'A' },
    { playerId: 2, playerName: 'B' },
  ] as any[];

  it('renders empty state when no players', () => {
    render(<PlayerGrid players={[]} viewType="overview" />);
    expect(screen.getByText(/No player data available/i)).toBeInTheDocument();
  });

  it('renders overview cards when viewType is overview', () => {
    render(<PlayerGrid players={players} viewType="overview" />);
    const items = screen.getAllByTestId('player-overview');
    expect(items).toHaveLength(2);
  });

  it('renders detailed cards when viewType is detailed', () => {
    render(<PlayerGrid players={players} viewType="detailed" />);
    const items = screen.getAllByTestId('player-detailed');
    expect(items).toHaveLength(2);
  });
});
