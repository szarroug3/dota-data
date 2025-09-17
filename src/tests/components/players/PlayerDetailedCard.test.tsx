import { render, screen } from '@testing-library/react';

import { PlayerDetailedCard } from '@/frontend/players/components/stateless/PlayerDetailedCard';

jest.mock('@/frontend/players/components/stateless/PlayerAvatar', () => ({
  PlayerAvatar: ({ player }: { player: any }) => (
    <div data-testid="player-avatar">{player?.profile?.profile?.personaname}</div>
  ),
}));

jest.mock('@/frontend/matches/components/stateless/common/HeroAvatar', () => ({
  HeroAvatar: ({ hero }: { hero: any }) => <div data-testid="hero-avatar">{hero?.localizedName}</div>,
}));

describe('PlayerDetailedCard', () => {
  const playerStats = {
    playerId: 1,
    player: {
      profile: { profile: { account_id: 1, personaname: 'Dendi' } },
    },
    playerName: 'Dendi',
    totalMatches: 200,
    winRate: 60.5,
    averageKills: 8.2,
    averageDeaths: 3.4,
    averageAssists: 12.1,
    averageKDA: 5.18,
    averageGPM: 510,
    averageXPM: 600,
    detailedStats: {
      rank: { displayText: 'Divine', isImmortal: false, stars: 5 },
      topHeroesAllTime: [
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
          games: 50,
          winRate: 58.3,
        },
      ],
      topHeroesRecent: [],
      teamRoles: [{ role: 'Mid', games: 80, winRate: 62.5 }],
      teamHeroes: [
        {
          hero: {
            id: '2',
            name: 'npc_dota_hero_2',
            localizedName: 'Axe',
            primaryAttribute: 'strength',
            attackType: 'melee',
            roles: ['Durable'],
            imageUrl: '',
          },
          games: 20,
          winRate: 55.0,
          roles: ['Offlane'],
        },
      ],
    },
    recentPerformance: {
      trend: 'improving',
      lastFiveMatches: [
        { win: true, kda: 4 },
        { win: false, kda: 2 },
        { win: true, kda: 3 },
        { win: true, kda: 6 },
        { win: false, kda: 1 },
      ],
    },
  } as any;

  it('renders player heading and key averages', () => {
    render(<PlayerDetailedCard player={playerStats} />);
    expect(screen.getByRole('heading', { name: 'Dendi' })).toBeInTheDocument();
    expect(screen.getByText('Avg Kills')).toBeInTheDocument();
    expect(screen.getByText('Avg Deaths')).toBeInTheDocument();
    expect(screen.getByText('Avg Assists')).toBeInTheDocument();
    expect(screen.getByText('Avg KDA')).toBeInTheDocument();
    expect(screen.getByText('Avg GPM')).toBeInTheDocument();
    expect(screen.getByText('Avg XPM')).toBeInTheDocument();
  });

  it('renders team roles, team heroes, and recent performance', () => {
    render(<PlayerDetailedCard player={playerStats} />);
    expect(screen.getByText('Team Roles')).toBeInTheDocument();
    expect(screen.getByText('Team Heroes')).toBeInTheDocument();
    expect(screen.getByText('Recent Performance')).toBeInTheDocument();
  });
});
