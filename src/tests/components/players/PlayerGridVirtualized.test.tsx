import { render, screen } from '@testing-library/react';
import type React from 'react';

import { PlayerGridVirtualized } from '@/frontend/players/components/stateless/PlayerGridVirtualized';
import type { PlayerStats } from '@/frontend/players/hooks/usePlayerStatsPage';

type RowProps = {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  players: PlayerStats[];
  viewType: 'overview' | 'detailed';
};

type ListProps = {
  rowCount: number;
  rowComponent: React.ComponentType<RowProps>;
  rowProps: { players: PlayerStats[]; viewType: 'overview' | 'detailed' };
};

jest.mock('react-window', () => ({
  List: ({ rowCount, rowComponent: RowComponent, rowProps }: ListProps) => (
    <div data-testid="virtual-list">
      {Array.from({ length: rowCount }).map((_, i) => (
        <RowComponent
          key={i}
          index={i}
          style={{}}
          ariaAttributes={{ 'aria-posinset': i + 1, 'aria-setsize': rowCount, role: 'listitem' }}
          {...rowProps}
        />
      ))}
    </div>
  ),
}));

jest.mock('@/frontend/players/components/stateless/PlayerOverviewCard', () => ({
  PlayerOverviewCard: ({ player }: { player: PlayerStats }) => (
    <div data-testid="player-overview">{player?.playerName}</div>
  ),
}));

jest.mock('@/frontend/players/components/stateless/PlayerDetailedCard', () => ({
  PlayerDetailedCard: ({ player }: { player: PlayerStats }) => (
    <div data-testid="player-detailed">{player?.playerName}</div>
  ),
}));

describe('PlayerGridVirtualized', () => {
  const createPlayerStats = (id: number, name: string): PlayerStats => ({
    player: {
      accountId: id,
      profile: { name, personaname: name, rank_tier: 0 },
      heroStats: [],
      overallStats: { wins: 0, losses: 0, totalGames: 0, winRate: 0 },
      recentMatchIds: [],
      createdAt: 0,
      updatedAt: 0,
    },
    playerId: String(id),
    playerName: name,
    totalMatches: 0,
    winRate: 0,
    averageKills: 0,
    averageDeaths: 0,
    averageAssists: 0,
    averageKDA: 0,
    averageGPM: 0,
    averageXPM: 0,
    mostPlayedHero: { heroId: '', heroName: '', matches: 0, winRate: 0 },
    bestPerformanceHero: { heroId: '', heroName: '', matches: 0, winRate: 0, averageKDA: 0 },
    recentPerformance: { trend: 'stable', lastFiveMatches: [] },
  });

  const players: PlayerStats[] = [createPlayerStats(1, 'A'), createPlayerStats(2, 'B')];

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
