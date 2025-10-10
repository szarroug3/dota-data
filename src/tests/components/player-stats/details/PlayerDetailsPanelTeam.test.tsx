import { render, screen } from '@testing-library/react';
import React from 'react';

import type { TeamPlayerOverview } from '@/frontend/lib/app-data-statistics-ops';
import { PlayerDetailsPanelTeam } from '@/frontend/players/components/stateless/details/PlayerDetailsPanelTeamView';

function buildTeamPlayerOverview(overrides: Partial<TeamPlayerOverview> = {}): TeamPlayerOverview {
  return {
    teamStats: {
      totalGames: 12,
      totalWins: 7,
      winRate: 58.33,
      averageKDA: 4.2,
      averageGPM: 515,
      averageXPM: 612,
      ...((overrides.teamStats as TeamPlayerOverview['teamStats']) ?? {}),
    },
    detailedStats: {
      playerId: 1,
      playerName: 'Tester',
      rank: null,
      topHeroesAllTime: [],
      topHeroesRecent: [],
      teamRoles: [
        {
          role: 'Carry',
          games: 7,
          winRate: 60,
        },
      ],
      teamHeroes: [
        {
          hero: {
            id: '1',
            name: 'npc_dota_hero_1',
            localizedName: 'Anti-Mage',
            primaryAttribute: 'agility',
            attackType: 'melee',
            roles: ['Carry'],
            imageUrl: '',
          },
          games: 6,
          wins: 4,
          winRate: 66.7,
          roles: ['Carry', 'Escape'],
        },
      ],
      totalGames: 120,
      totalWins: 70,
      winRate: 58.33,
      averageKDA: 3.5,
      ...((overrides.detailedStats as TeamPlayerOverview['detailedStats']) ?? {}),
    },
    ...overrides,
  } as TeamPlayerOverview;
}

describe('PlayerDetailsPanelTeam', () => {
  it('shows placeholder when no team stats are available', () => {
    render(<PlayerDetailsPanelTeam playerTeamOverview={null} />);

    expect(screen.getByText('No team statistics available.')).toBeInTheDocument();
  });

  it('renders team overview metrics when stats are provided', () => {
    render(<PlayerDetailsPanelTeam playerTeamOverview={buildTeamPlayerOverview()} />);

    expect(screen.getByText('Team Overview')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/58\.3/)).toBeInTheDocument();
  });

  it('renders team heroes table', () => {
    render(<PlayerDetailsPanelTeam playerTeamOverview={buildTeamPlayerOverview()} />);

    expect(screen.getByText('Team Heroes')).toBeInTheDocument();
    expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
  });
});
