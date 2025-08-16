import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { PlayerDetailsPanelDetails } from '@/components/player-stats/details/PlayerDetailsPanelDetails';
import { ConstantsProvider } from '@/contexts/constants-context';
import { ConstantsDataFetchingProvider } from '@/contexts/constants-data-fetching-context';
import type { Player } from '@/types/contexts/player-context-value';

// Mock the HeroAvatar component
jest.mock('@/components/match-history/common/HeroAvatar', () => ({
  HeroAvatar: ({ hero }: { hero: any }) => (
    <div data-testid="hero-avatar">{hero.localizedName}</div>
  ),
}));

const mockHeroes = {
  '1': {
    id: '1',
    name: 'npc_dota_hero_antimage',
    localizedName: 'Anti-Mage',
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    imageUrl: '/heroes/antimage.png'
  },
  '2': {
    id: '2',
    name: 'npc_dota_hero_axe',
    localizedName: 'Axe',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Initiator', 'Durable', 'Disabler'],
    imageUrl: '/heroes/axe.png'
  }
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
      hero_variant: null
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
      hero_variant: null
    }
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
      <ConstantsProvider>
        {component}
      </ConstantsProvider>
    </ConstantsDataFetchingProvider>
  );
};

describe('PlayerDetailsPanelDetails', () => {
  beforeEach(() => {
    // Mock scrollIntoView to prevent JSDOM errors
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders player statistics with default 2 weeks filter', () => {
    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} />);
    
    expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    expect(screen.getByText(/2\s*games/i)).toBeInTheDocument();
  });

  it('shows All Time option and can select it', async () => {
    const playerWithOldMatch: Player = {
      ...mockPlayer,
      recentMatches: [
        {
          match_id: 1,
          player_slot: 0,
          radiant_win: true,
          duration: 1800,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 1,
          start_time: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
          version: null,
          kills: 10,
          deaths: 2,
          assists: 8,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null
        },
        {
          match_id: 2,
          player_slot: 0,
          radiant_win: false,
          duration: 2000,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 2,
          start_time: Math.floor(Date.now() / 1000) - 100 * 24 * 60 * 60, // 100 days ago
          version: null,
          kills: 1,
          deaths: 1,
          assists: 1,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null
        }
      ]
    };

    renderWithProviders(<PlayerDetailsPanelDetails player={playerWithOldMatch} />);

    // Default is All Time; should show 2 games
    expect(screen.getByText(/2\s*games/i)).toBeInTheDocument();

    const select = screen.getByRole('combobox');

    // Switch to 3 Months (should show 1 game)
    fireEvent.click(select);
    await waitFor(() => {
      fireEvent.click(screen.getByText('3 Months'));
    });
    expect(screen.getByText(/1\s*games/i)).toBeInTheDocument();

    // Switch back to All Time
    fireEvent.click(select);
    await waitFor(() => {
      fireEvent.click(screen.getByText('All Time'));
    });

    expect(screen.getByText(/2\s*games/i)).toBeInTheDocument();
  });

  it('updates hero statistics when switching to 3 months', async () => {
    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} />);
    
    // Click on the select to open options
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    // Wait for the select options to appear and click 3 months
    await waitFor(() => {
      const threeMonthsOption = screen.getByText('3 Months');
      fireEvent.click(threeMonthsOption);
    });
    
    // Should still show 2 games since both matches are within 3 months
    expect(screen.getByText(/2\s*games/i)).toBeInTheDocument();
  });

  it('allows custom date range selection', async () => {
    renderWithProviders(<PlayerDetailsPanelDetails player={mockPlayer} />);
    
    // Click on the select to open options
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    // Wait for the select options to appear and click custom range
    await waitFor(() => {
      const customOption = screen.getByText('Custom Range');
      fireEvent.click(customOption);
    });
    
    // Should show date inputs
    const startDateButton = screen.getByText('Start Date');
    const endDateButton = screen.getByText('End Date');
    
    expect(startDateButton).toBeInTheDocument();
    expect(endDateButton).toBeInTheDocument();
  });

  it('handles empty match data gracefully', () => {
    const emptyPlayer: Player = {
      ...mockPlayer,
      recentMatches: []
    };
    
    renderWithProviders(<PlayerDetailsPanelDetails player={emptyPlayer} />);
    
    // Check that we show 0 games in the selected period
    expect(screen.getByText(/0\s*games/i)).toBeInTheDocument();
    
    // Check that the hero statistics table is empty
    const tableBody = screen.getByRole('table').querySelector('tbody');
    expect(tableBody?.children.length).toBe(0);
  });

  it('sorts heroes by games count in descending order', async () => {
    const playerWithMultipleHeroes: Player = {
      ...mockPlayer,
      heroes: [
        {
          hero_id: 1,
          last_played: Math.floor(Date.now() / 1000),
          games: 1,
          win: 0,
          with_games: 0,
          with_win: 0,
          against_games: 0,
          against_win: 0
        },
        {
          hero_id: 2,
          last_played: Math.floor(Date.now() / 1000),
          games: 2,
          win: 1,
          with_games: 0,
          with_win: 0,
          against_games: 0,
          against_win: 0
        }
      ]
    };
    
    renderWithProviders(<PlayerDetailsPanelDetails player={playerWithMultipleHeroes} />);
    
    // Click on the select to open options
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    await waitFor(() => {
      const threeMonthsOption = screen.getByText('3 Months');
      fireEvent.click(threeMonthsOption);
    });
    
    // Should show heroes sorted by games count (highest first)
    const tableRows = screen.getAllByRole('row');
    // Skip header row, check first hero row
    expect(tableRows[1]).toHaveTextContent('2'); // Games count for first hero
  });

  it('filters heroes based on selected date range', async () => {
    const playerWithOldMatches: Player = {
      ...mockPlayer,
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
          hero_variant: null
        },
        {
          match_id: 2,
          player_slot: 0,
          radiant_win: false,
          duration: 2000,
          game_mode: 1,
          lobby_type: 0,
          hero_id: 2,
          start_time: Math.floor(Date.now() / 1000) - 100 * 24 * 60 * 60, // 100 days ago (outside 3 months)
          version: null,
          kills: 8,
          deaths: 4,
          assists: 12,
          average_rank: null,
          leaver_status: 0,
          party_size: null,
          hero_variant: null
        }
      ]
    };
    
    renderWithProviders(<PlayerDetailsPanelDetails player={playerWithOldMatches} />);
    
    // Initially should show 2 games (All Time)
    expect(screen.getByText(/2\s*games/i)).toBeInTheDocument();
    
    // Switch to 3 months (still 1 game, 100-day-old match excluded)
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    await waitFor(() => {
      const threeMonthsOption = screen.getByText('3 Months');
      fireEvent.click(threeMonthsOption);
    });
    expect(screen.getByText(/1\s*games/i)).toBeInTheDocument();

    // Switch to All Time (should include both)
    fireEvent.click(select);
    await waitFor(() => {
      const allTime = screen.getByText('All Time');
      fireEvent.click(allTime);
    });
    expect(screen.getByText(/2\s*games/i)).toBeInTheDocument();
  });
});
