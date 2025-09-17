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

describe('PlayerDetailsPanelTeam - computes top metrics correctly', () => {
  it('shows non-zero win rate and averages when player has wins and stats', () => {
    const heroes: Record<string, Hero> = {};
    // Build two matches the player participated in, one win and one loss, with stats
    const matchesArray: Match[] = [
      {
        id: 1,
        date: '',
        duration: 0,
        radiant: {},
        dire: {},
        draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
        players: {
          radiant: [
            {
              accountId: 1,
              playerName: 'p',
              hero: { id: '1', name: 'h', localizedName: 'h', primaryAttribute: 'strength', attackType: 'melee', roles: [], imageUrl: '' },
              stats: { kills: 10, deaths: 2, assists: 8, lastHits: 0, denies: 0, gpm: 500, xpm: 600, netWorth: 0, level: 0 },
              items: [],
              heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
            },
          ],
          dire: [],
        },
        statistics: {
          radiantScore: 0,
          direScore: 0,
          goldAdvantage: { times: [], radiantGold: [], direGold: [] },
          experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
        },
        events: [],
        result: 'radiant',
      },
      {
        id: 2,
        date: '',
        duration: 0,
        radiant: {},
        dire: {},
        draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
        players: {
          radiant: [],
          dire: [
            {
              accountId: 1,
              playerName: 'p',
              hero: { id: '1', name: 'h', localizedName: 'h', primaryAttribute: 'strength', attackType: 'melee', roles: [], imageUrl: '' },
              stats: { kills: 2, deaths: 10, assists: 1, lastHits: 0, denies: 0, gpm: 300, xpm: 400, netWorth: 0, level: 0 },
              items: [],
              heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
            },
          ],
        },
        statistics: {
          radiantScore: 0,
          direScore: 0,
          goldAdvantage: { times: [], radiantGold: [], direGold: [] },
          experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
        },
        events: [],
        result: 'radiant',
      },
    ];

    const selectedTeam = {
      team: { id: 123, name: 'Team' },
      league: { id: 1, name: 'L' },
      timeAdded: '',
      matches: {
        1: { matchId: 1, result: 'won', duration: 0, opponentName: '', leagueId: '1', startTime: 0, side: 'radiant', pickOrder: 'first' },
        2: { matchId: 2, result: 'lost', duration: 0, opponentName: '', leagueId: '1', startTime: 0, side: 'dire', pickOrder: 'second' },
      },
      manualMatches: {},
      manualPlayers: [],
      players: [],
      performance: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        overallWinRate: 0,
        heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
        draftStats: {
          firstPickCount: 0,
          secondPickCount: 0,
          firstPickWinRate: 0,
          secondPickWinRate: 0,
          uniqueHeroesPicked: 0,
          uniqueHeroesBanned: 0,
          mostPickedHero: '',
          mostBannedHero: '',
        },
        currentWinStreak: 0,
        currentLoseStreak: 0,
        averageMatchDuration: 0,
        averageKills: 0,
        averageDeaths: 0,
        averageGold: 0,
        averageExperience: 0,
      },
    } as any;

    const player: Player = {
      profile: { profile: { account_id: 1, personaname: 'TestPlayer' } as any, rank_tier: 0, leaderboard_rank: 0 },
      counts: {} as any,
      heroes: [],
      rankings: [],
      ratings: [],
      recentMatches: [],
      totals: {} as any,
      wl: { win: 0, lose: 0 },
      wardMap: { obs: {}, sen: {} },
    };

    render(
      <PlayerDetailsPanelTeam
        player={player}
        heroes={heroes}
        matchesArray={matchesArray}
        selectedTeam={selectedTeam as any}
      />,
    );

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
