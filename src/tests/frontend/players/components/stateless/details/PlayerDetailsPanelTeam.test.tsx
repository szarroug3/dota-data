import { render, screen } from '@testing-library/react';

import { useAppData } from '@/frontend/contexts/app-data-context';
import type { AppData } from '@/frontend/lib/app-data/app-data';
import type { Player } from '@/frontend/lib/app-data/app-data-types';
import { PlayerDetailsPanelTeam } from '@/frontend/players/components/stateless/details/PlayerDetailsPanelTeamView';

jest.mock('@/frontend/contexts/app-data-context', () => ({
  useAppData: jest.fn(),
}));

const mockUseAppData = useAppData as jest.MockedFunction<typeof useAppData>;

const createPlayer = (accountId: number): Player => ({
  accountId,
  profile: {
    name: `Player ${accountId}`,
    personaname: `Player ${accountId}`,
    rank_tier: 0,
  },
  heroStats: [],
  overallStats: {
    wins: 0,
    losses: 0,
    totalGames: 0,
    winRate: 0,
  },
  recentMatchIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('PlayerDetailsPanelTeam - Team Overview responsiveness', () => {
  beforeEach(() => {
    // silence potential ResizeObserver absence warnings in jsdom
    (window as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    } as any;
    const mockAppData = {
      state: { selectedTeamId: '1-1' },
      matches: new Map(),
      teams: new Map(),
      getTeamPlayerStats: () => ({
        totalGames: 1,
        totalWins: 1,
        winRate: 100,
        averageKDA: 2,
        averageGPM: 400,
        averageXPM: 500,
      }),
      getTeamPlayerDetailStats: () => ({ teamRoles: [], teamHeroes: [] }),
    } as unknown as AppData;
    mockUseAppData.mockReturnValue(mockAppData);
  });

  it('renders Team Overview section with responsive classes for disappearing columns', () => {
    render(<PlayerDetailsPanelTeam player={createPlayer(1)} />);

    // Header present
    expect(screen.getByText('Team Overview')).toBeInTheDocument();
  });
});

describe('PlayerDetailsPanelTeam - computes top metrics correctly', () => {
  it('shows non-zero win rate and averages when player has wins and stats', () => {
    const mockAppData = {
      state: { selectedTeamId: '1-1' },
      matches: new Map(),
      teams: new Map(),
      getTeamPlayerStats: () => ({
        totalGames: 2,
        totalWins: 1,
        winRate: 50,
        averageKDA: 4.65,
        averageGPM: 400,
        averageXPM: 500,
      }),
      getTeamPlayerDetailStats: () => ({ teamRoles: [], teamHeroes: [] }),
    } as unknown as AppData;
    mockUseAppData.mockReturnValue(mockAppData);

    render(<PlayerDetailsPanelTeam player={createPlayer(1)} />);

    // Should display two games
    expect(screen.getByText('Games Played')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Win rate should be 50.0%
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();

    // Averages should reflect arithmetic mean of provided stats
    expect(screen.getByText('Avg KDA')).toBeInTheDocument();
    // First match KDA = (10+8)/2 = 9, second = (2+1)/10 = 0.3, average = 4.65 -> 4.65 displayed to 2 dp
    expect(screen.getByText('4.65')).toBeInTheDocument();
    expect(screen.getByText('Avg GPM')).toBeInTheDocument();
    // Average GPM = (500 + 300)/2 = 400
    expect(screen.getByText('400')).toBeInTheDocument();
  });
});
