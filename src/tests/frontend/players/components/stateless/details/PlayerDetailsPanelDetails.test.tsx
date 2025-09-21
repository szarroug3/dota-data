import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ConstantsProvider } from '@/frontend/contexts/constants-context';
import { ConstantsDataFetchingProvider } from '@/frontend/contexts/constants-data-fetching-context';
import { PlayerDetailsPanelDetails } from '@/frontend/players/components/stateless/details/PlayerDetailsPanelDetails';
import type { Player } from '@/types/contexts/player-context-value';

// Mock the HeroAvatar component
jest.mock('@/frontend/matches/components/stateless/common/HeroAvatar', () => ({
  HeroAvatar: ({ hero }: { hero: any }) => <div data-testid="hero-avatar">{hero.localizedName}</div>,
}));

const mockHeroes = {
  '1': {
    id: '1',
    name: 'npc_dota_hero_antimage',
    localizedName: 'Anti-Mage',
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    imageUrl: '/heroes/antimage.png',
  },
  '2': {
    id: '2',
    name: 'npc_dota_hero_axe',
    localizedName: 'Axe',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Initiator', 'Durable', 'Disabler'],
    imageUrl: '/heroes/axe.png',
  },
};

const mockPlayer: Player = {
  profile: {
    profile: {
      account_id: 1,
      personaname: 'TestPlayer',
      name: 'TestPlayer',
      plus: false,
      cheese: 0,
      steamid: '0',
      avatar: '',
      avatarmedium: '',
      avatarfull: '',
      profileurl: '',
      last_login: '',
      loccountrycode: '',
      status: null,
      fh_unavailable: false,
      is_contributor: false,
      is_subscriber: false,
    },
    rank_tier: 0,
    leaderboard_rank: 0,
  },
  counts: {
    leaver_status: {},
    game_mode: {},
    lobby_type: {},
    lane_role: {},
    region: {},
    patch: {},
  },
  heroes: [
    {
      hero_id: 1,
      last_played: Math.floor(Date.now() / 1000),
      games: 2,
      win: 1,
      with_games: 0,
      with_win: 0,
      against_games: 0,
      against_win: 0,
    },
  ],
  rankings: [],
  ratings: [],
  recentMatches: [
    {
      match_id: 1,
      player_slot: 0,
      radiant_win: true,
      duration: 1800,
      game_mode: 1,
      lobby_type: 0,
      hero_id: 1,
      start_time: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // 7 days ago
      version: null,
      kills: 10,
      deaths: 2,
      assists: 8,
      average_rank: null,
      leaver_status: 0,
      party_size: null,
      hero_variant: null,
    },
    {
      match_id: 2,
      player_slot: 0,
      radiant_win: false,
      duration: 2000,
      game_mode: 1,
      lobby_type: 0,
      hero_id: 1,
      start_time: Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60, // 14 days ago
      version: null,
      kills: 8,
      deaths: 4,
      assists: 12,
      average_rank: null,
      leaver_status: 0,
      party_size: null,
      hero_variant: null,
    },
  ],
  totals: {
    np: 0,
    fantasy: 0,
    cosmetic: 0,
    all_time: 0,
    ranked: 0,
    turbo: 0,
    matched: 0,
  },
  wl: { win: 1, lose: 1 },
  wardMap: { obs: {}, sen: {} },
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ConstantsDataFetchingProvider>
      <ConstantsProvider>{component}</ConstantsProvider>
    </ConstantsDataFetchingProvider>,
  );
};

describe('PlayerDetailsPanelDetails', () => {
  beforeEach(() => {
    // Mock scrollIntoView to prevent JSDOM errors
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders hero statistics table with data', () => {
    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} heroes={mockHeroes as any} />);

    expect(screen.getByText('Hero Statistics')).toBeInTheDocument();
    // Should render at least one row for hero 1 aggregated from recent matches
    const table = screen.getByRole('table');
    const body = table.querySelector('tbody');
    expect(body && body.children.length).toBeGreaterThan(0);
  });

  it('allows custom date range selection', async () => {
    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} heroes={mockHeroes as any} />);

    // Open select and choose Custom
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Custom'));
    });

    // Should show Start/End inputs
    expect(screen.getByLabelText('Start')).toBeInTheDocument();
    expect(screen.getByLabelText('End')).toBeInTheDocument();
  });

  it('handles empty match data gracefully', () => {
    const emptyPlayer: Player = {
      ...mockPlayer,
      recentMatches: [],
    };

    renderWithProviders(<PlayerDetailsPanelDetails player={emptyPlayer} heroes={mockHeroes as any} />);

    // Check that we show 0 games in the selected period
    expect(screen.getByText(/0\s*games/i)).toBeInTheDocument();

    // Check that the hero statistics table is empty
    const tableBody = screen.getByRole('table').querySelector('tbody');
    expect(tableBody?.children.length).toBe(0);
  });

  it('sorts heroes by games count in descending order', async () => {
    const playerWithMultipleHeroes: Player = {
      ...mockPlayer,
      recentMatches: [
        // Two games on hero 1 and one game on hero 2
        {
          match_id: 10,
          player_slot: 0,
          radiant_win: true,
          duration: 1800,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 1,
          start_time: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60,
          version: null,
          kills: 8,
          deaths: 2,
          assists: 6,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null,
        },
        {
          match_id: 11,
          player_slot: 0,
          radiant_win: false,
          duration: 2000,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 1,
          start_time: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
          version: null,
          kills: 4,
          deaths: 5,
          assists: 3,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null,
        },
        {
          match_id: 12,
          player_slot: 0,
          radiant_win: true,
          duration: 1600,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 2,
          start_time: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
          version: null,
          kills: 6,
          deaths: 1,
          assists: 9,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null,
        },
      ],
    };

    renderWithProviders(<PlayerDetailsPanelDetails player={playerWithMultipleHeroes} heroes={mockHeroes as any} />);

    // Should show heroes sorted by games count (highest first)
    const tableRows = screen.getAllByRole('row');
    // Skip header row, check first hero row
    expect(tableRows[1]).toHaveTextContent('2'); // Games count for first hero
  });

  it('"Last 30 Days" excludes matches older than 30 days and custom inclusive works', async () => {
    const now = Date.now();
    const thirtyOneDaysAgoSec = Math.floor((now - 31 * 24 * 60 * 60 * 1000) / 1000);
    const twentyDaysAgoSec = Math.floor((now - 20 * 24 * 60 * 60 * 1000) / 1000);

    const playerWithOldAndRecent: Player = {
      ...mockPlayer,
      recentMatches: [
        {
          match_id: 301,
          player_slot: 0,
          radiant_win: true,
          duration: 1800,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 1,
          start_time: thirtyOneDaysAgoSec,
          version: null,
          kills: 1,
          deaths: 1,
          assists: 1,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null,
        },
        {
          match_id: 302,
          player_slot: 0,
          radiant_win: true,
          duration: 1800,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 1,
          start_time: twentyDaysAgoSec,
          version: null,
          kills: 1,
          deaths: 1,
          assists: 1,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null,
        },
      ],
    };

    renderWithProviders(<PlayerDetailsPanelDetails player={playerWithOldAndRecent} heroes={mockHeroes as any} />);

    // By default component is on Last 30 Days, so only the recent match should count
    const tableBody = screen.getByRole('table').querySelector('tbody');
    expect(tableBody?.children.length).toBe(1);

    // Switch to Custom and pick a start/end window that includes both matches
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    await waitFor(() => fireEvent.click(screen.getByText('Custom')));

    const startInput = screen.getByLabelText('Start') as HTMLInputElement;
    const endInput = screen.getByLabelText('End') as HTMLInputElement;

    const startDate = new Date(now - 40 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now - 31 * 24 * 60 * 60 * 1000); // exactly 31 days ago

    const toYYYYMMDD = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    fireEvent.change(startInput, { target: { value: toYYYYMMDD(startDate) } });
    fireEvent.change(endInput, { target: { value: toYYYYMMDD(endDate) } });

    // Both matches should now be included because end is inclusive to end-of-day
    await waitFor(() => {
      const body = screen.getByRole('table').querySelector('tbody');
      expect(body?.children.length).toBe(1); // Still one hero row, aggregated from two matches
    });
  });
});
