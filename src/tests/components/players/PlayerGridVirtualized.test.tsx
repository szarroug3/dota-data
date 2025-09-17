import { render, screen } from '@testing-library/react';

import { PlayerGridVirtualized } from '@/frontend/players/components/stateless/PlayerGridVirtualized';

jest.mock('react-window', () => ({
  FixedSizeList: ({ itemCount, children }: any) => (
    <div data-testid="virtual-list">
      {Array.from({ length: itemCount }).map((_, i) => children({ index: i, style: {} }))}
    </div>
  ),
}));

jest.mock('@/frontend/players/components/stateless/PlayerOverviewCard', () => ({
  PlayerOverviewCard: ({ player }: { player: any }) => <div data-testid="player-overview">{player?.playerName}</div>,
}));

jest.mock('@/frontend/players/components/stateless/PlayerDetailedCard', () => ({
  PlayerDetailedCard: ({ player }: { player: any }) => <div data-testid="player-detailed">{player?.playerName}</div>,
}));

describe('PlayerGridVirtualized', () => {
  const players = [
    { playerId: 1, playerName: 'A' },
    { playerId: 2, playerName: 'B' },
  ] as any[];

  it('renders empty state when no players', () => {
    render(<PlayerGridVirtualized players={[]} viewType="overview" />);
    expect(screen.getByText(/No player data available/i)).toBeInTheDocument();
  });

  it('renders overview cards in virtualized list', () => {
    render(<PlayerGridVirtualized players={players} viewType="overview" height={100} itemHeight={50} />);
    const items = screen.getAllByTestId('player-overview');
    expect(items).toHaveLength(2);
  });

  it('renders detailed cards in virtualized list', () => {
    render(<PlayerGridVirtualized players={players} viewType="detailed" height={100} itemHeight={50} />);
    const items = screen.getAllByTestId('player-detailed');
    expect(items).toHaveLength(2);
  });
});
