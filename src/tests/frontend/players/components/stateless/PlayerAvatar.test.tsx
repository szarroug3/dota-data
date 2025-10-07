import { fireEvent, render, screen } from '@testing-library/react';

import type { Player } from '@/frontend/lib/app-data-types';
import { PlayerAvatar } from '@/frontend/players/components/stateless/PlayerAvatar';

const basePlayer = (overrides: Partial<Player> = {}): Player => ({
  accountId: 40927904,
  profile: {
    name: 'Test Player',
    personaname: 'Test Player',
    rank_tier: 10,
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
  ...overrides,
});

describe('PlayerAvatar', () => {
  it('renders initials when no image is available', () => {
    render(<PlayerAvatar player={basePlayer()} avatarSize={{ width: 'w-10', height: 'h-10' }} showLink={false} />);
    expect(screen.getByText('TP')).toBeInTheDocument();
  });

  it('uses preferredSite to build external link label/title', () => {
    render(
      <PlayerAvatar
        player={basePlayer()}
        avatarSize={{ width: 'w-10', height: 'h-10' }}
        showLink={true}
        preferredSite="opendota"
      />,
    );
    const button = screen.getByRole('button', { name: /View Test Player on opendota/i });
    expect(button).toBeInTheDocument();
  });

  it('opens link on click when showLink=true', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <PlayerAvatar
        player={basePlayer()}
        avatarSize={{ width: 'w-10', height: 'h-10' }}
        showLink={true}
        preferredSite="dotabuff"
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
