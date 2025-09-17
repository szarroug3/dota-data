import { fireEvent, render, screen } from '@testing-library/react';

import { PlayerAvatar } from '@/frontend/players/components/stateless/PlayerAvatar';
import type { Player } from '@/types/contexts/player-context-value';

const basePlayer = (overrides: Partial<Player> = {}): Player => ({
  profile: {
    profile: {
      account_id: 40927904,
      personaname: 'Test Player',
      name: null,
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
  counts: { leaver_status: {}, game_mode: {}, lobby_type: {}, lane_role: {}, region: {}, patch: {} },
  heroes: [],
  rankings: [],
  ratings: [],
  recentMatches: [],
  totals: { np: 0, fantasy: 0, cosmetic: 0, all_time: 0, ranked: 0, turbo: 0, matched: 0 },
  wl: { win: 0, lose: 0 },
  wardMap: { obs: {}, sen: {} },
  ...overrides,
});

describe('PlayerAvatar', () => {
  it('renders initials when no image is available', () => {
    render(
      <PlayerAvatar player={basePlayer()} avatarSize={{ width: 'w-10', height: 'h-10' }} showLink={false} />,
    );
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


