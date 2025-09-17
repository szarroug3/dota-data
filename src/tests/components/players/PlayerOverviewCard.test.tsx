import { render, screen } from '@testing-library/react';

import { PlayerOverviewCard } from '@/frontend/players/components/stateless/PlayerOverviewCard';

// Mock nested avatar components to focus on PlayerOverviewCard rendering
jest.mock('@/frontend/players/components/stateless/PlayerAvatar', () => ({
  PlayerAvatar: ({ player }: { player: any }) => (
    <div data-testid="player-avatar">{player?.profile?.profile?.personaname}</div>
  ),
}));

jest.mock('@/frontend/matches/components/stateless/common/HeroAvatar', () => ({
  HeroAvatar: ({ hero }: { hero: any }) => <div data-testid="hero-avatar">{hero?.localizedName}</div>,
}));

describe('PlayerOverviewCard', () => {
  const playerStats = {
    player: {
      profile: {
        profile: {
          account_id: 40927904,
          personaname: 'Dendi',
        },
      },
    },
    playerName: 'Dendi',
    totalMatches: 1234,
    winRate: 57.6,
    averageKDA: 3.45,
    averageGPM: 495,
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
        },
      ],
    },
    mostPlayedHero: { heroName: 'Pudge' },
    recentPerformance: {
      lastFiveMatches: [
        { win: true, kda: 4.2 },
        { win: false, kda: 2.1 },
        { win: true, kda: 3.7 },
        { win: true, kda: 5.0 },
        { win: false, kda: 1.8 },
      ],
    },
  } as any;

  it('renders core player overview information', () => {
    render(<PlayerOverviewCard player={playerStats} />);

    expect(screen.getByRole('heading', { name: 'Dendi' })).toBeInTheDocument();
    expect(screen.getByText(/1234 matches/i)).toBeInTheDocument();
    expect(screen.getByText(/57.6% win rate/i)).toBeInTheDocument();
    expect(screen.getByText('Divine')).toBeInTheDocument();
    expect(screen.getByText('3.45')).toBeInTheDocument(); // averageKDA
    expect(screen.getByText('495')).toBeInTheDocument(); // averageGPM
  });

  it('shows avatars and recent performance badges', () => {
    render(<PlayerOverviewCard player={playerStats} />);

    expect(screen.getByTestId('player-avatar')).toHaveTextContent('Dendi');
    expect(screen.getByTestId('hero-avatar')).toHaveTextContent('Anti-Mage');

    // Expect five recent match badges present
    const badges = screen.getAllByText(/^[WL]$/);
    expect(badges).toHaveLength(5);
  });
});


