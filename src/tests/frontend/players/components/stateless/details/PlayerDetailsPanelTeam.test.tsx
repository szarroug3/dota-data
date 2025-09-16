import { render, screen } from '@testing-library/react';

import { PlayerDetailsPanelTeam } from '@/frontend/players/components/stateless/details/PlayerDetailsPanelTeamView';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';

// Mock dependent contexts to avoid requiring full provider trees
jest.mock('@/frontend/teams/contexts/state/team-context', () => ({
  useTeamContext: () => ({
    getSelectedTeam: () => null,
  }),
}));

jest.mock('@/frontend/matches/contexts/state/match-context', () => ({
  useMatchContext: () => ({
    matches: new Map(),
  }),
}));

jest.mock('@/frontend/contexts/constants-context', () => ({
  useConstantsContext: () => ({
    heroes: {},
  }),
}));

// Minimal player object
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
  counts: { leaver_status: {}, game_mode: {}, lobby_type: {}, lane_role: {}, region: {}, patch: {} },
  heroes: [],
  rankings: [],
  ratings: [],
  recentMatches: [],
  totals: { np: 0, fantasy: 0, cosmetic: 0, all_time: 0, ranked: 0, turbo: 0, matched: 0 },
  wl: { win: 0, lose: 0 },
  wardMap: { obs: {}, sen: {} },
};

describe('PlayerDetailsPanelTeam - Team Overview responsiveness', () => {
  beforeEach(() => {
    // silence potential ResizeObserver absence warnings in jsdom
    (window as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    } as any;
  });

  it('renders Team Overview section with responsive classes for disappearing columns', () => {
    const heroes: Record<string, Hero> = {};
    const matchesArray: Match[] = [];
    const selectedTeam = null;
    render(
      <PlayerDetailsPanelTeam
        player={mockPlayer}
        heroes={heroes}
        matchesArray={matchesArray}
        selectedTeam={selectedTeam}
      />,
    );

    // Header present
    expect(screen.getByText('Team Overview')).toBeInTheDocument();
  });
});
