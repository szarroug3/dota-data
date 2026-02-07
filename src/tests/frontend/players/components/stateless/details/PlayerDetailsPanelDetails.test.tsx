import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import type { Player } from '@/frontend/lib/app-data-types';
import { PlayerDetailsPanelDetails } from '@/frontend/players/components/stateless/details/PlayerDetailsPanelDetails';

// Mock AppData context instead of constants context
const mockGetPlayerRecentHeroRows = jest.fn();
const mockRefreshPlayer = jest.fn();

const mockAppData = {
  teams: new Map(),
  matches: new Map(),
  players: new Map(),
  heroes: new Map([
    [
      1,
      {
        id: 1,
        name: 'npc_dota_hero_antimage',
        localizedName: 'Anti-Mage',
        primaryAttribute: 'agility',
        attackType: 'melee',
        roles: [],
        imageUrl: '',
      },
    ],
    [
      2,
      {
        id: 2,
        name: 'npc_dota_hero_axe',
        localizedName: 'Axe',
        primaryAttribute: 'strength',
        attackType: 'melee',
        roles: [],
        imageUrl: '',
      },
    ],
  ]),
  items: new Map(),
  leagues: new Map(),
  selectedTeamId: null,
  setSelectedTeamId: jest.fn(),
  addTeam: jest.fn(),
  updateTeam: jest.fn(),
  removeTeam: jest.fn(),
  addMatch: jest.fn(),
  updateMatch: jest.fn(),
  removeMatch: jest.fn(),
  addPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  removePlayer: jest.fn(),
  loadTeamData: jest.fn(),
  loadMatchData: jest.fn(),
  loadPlayerData: jest.fn(),
  loadHeroesData: jest.fn(),
  loadItemsData: jest.fn(),
  loadLeaguesData: jest.fn(),
  refreshPlayer: mockRefreshPlayer,
  getPlayerRecentHeroRows: mockGetPlayerRecentHeroRows,
};

jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => mockAppData,
}));

// Mock the HeroAvatar component
jest.mock('@/frontend/matches/components/stateless/common/HeroAvatar', () => ({
  HeroAvatar: ({ hero }: { hero: any }) => <div data-testid="hero-avatar">{hero.localizedName}</div>,
}));

const mockPlayer: Player = {
  accountId: 1,
  profile: {
    name: 'TestPlayer',
    personaname: 'TestPlayer',
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
  recentMatches: [
    {
      match_id: 1,
      player_slot: 0,
      radiant_win: true,
      hero_id: 1,
      start_time: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
    },
    {
      match_id: 2,
      player_slot: 0,
      radiant_win: false,
      hero_id: 1,
      start_time: Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60,
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const renderWithProviders = (component: React.ReactElement) => render(component);

describe('PlayerDetailsPanelDetails', () => {
  beforeEach(() => {
    // Mock scrollIntoView to prevent JSDOM errors
    Element.prototype.scrollIntoView = jest.fn();
    mockGetPlayerRecentHeroRows.mockReset();
    mockRefreshPlayer.mockReset();
  });

  it('renders hero statistics table with data', () => {
    mockGetPlayerRecentHeroRows.mockReturnValue({
      rows: [
        {
          hero: {
            id: 1,
            name: 'npc_dota_hero_antimage',
            localizedName: 'Anti-Mage',
            imageUrl: '',
          },
          games: 2,
          winRate: 50,
        },
      ],
      totalGames: 2,
    });

    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} />);

    expect(screen.getByText('Hero Statistics')).toBeInTheDocument();
    // Shows games count chip
    expect(screen.getByLabelText('Games in list')).toHaveTextContent('2 games');
    // Should render at least one row for hero 1 aggregated from recent matches
    const table = screen.getByRole('table');
    const body = table.querySelector('tbody');
    expect(body && body.children.length).toBeGreaterThan(0);
  });

  it('allows custom date range selection', async () => {
    mockGetPlayerRecentHeroRows.mockReturnValue({ rows: [], totalGames: 0 });

    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} />);

    // Open select and choose Custom
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Custom'));
    });

    // Should show Start/End inputs
    expect(screen.getByLabelText('Start')).toBeInTheDocument();
    expect(screen.getByLabelText('End')).toBeInTheDocument();
    expect(mockGetPlayerRecentHeroRows).toHaveBeenLastCalledWith(
      mockPlayer.accountId,
      'custom',
      { start: null, end: null },
      'games',
      'desc',
    );
  });

  it('handles empty match data gracefully', () => {
    const emptyPlayer: Player = {
      ...mockPlayer,
      recentMatches: [],
    };

    mockGetPlayerRecentHeroRows.mockReturnValue({ rows: [], totalGames: 0 });

    renderWithProviders(<PlayerDetailsPanelDetails player={emptyPlayer} />);

    // Check that we show 0 games in the selected period
    expect(screen.getByText(/0\s*games/i)).toBeInTheDocument();

    // Check that the hero statistics table is empty
    const tableBody = screen.getByRole('table').querySelector('tbody');
    expect(tableBody?.children.length).toBe(0);
  });

  it('uses AppData selector with default sort', () => {
    mockGetPlayerRecentHeroRows.mockReturnValue({ rows: [], totalGames: 0 });

    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} />);

    expect(mockGetPlayerRecentHeroRows).toHaveBeenCalledWith(
      mockPlayer.accountId,
      'all',
      { start: null, end: null },
      'games',
      'desc',
    );
  });
});
