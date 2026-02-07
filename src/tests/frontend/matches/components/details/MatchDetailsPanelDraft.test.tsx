import { render, screen } from '@testing-library/react';

import type { Match, Team, TeamMatchParticipation } from '@/frontend/lib/app-data/app-data-types';
import { MatchDetailsPanelDraft } from '@/frontend/matches/components/details/MatchDetailsPanelDraft';

const mockTeam: Team = {
  id: '1-1',
  teamId: 1,
  leagueId: 1,
  name: 'Team One',
  leagueName: 'League One',
  timeAdded: Date.now(),
  matches: new Map(),
  players: new Map(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isLoading: false,
  highPerformingHeroes: new Set(),
};

const mockAppData = {
  state: { selectedTeamId: '1-1' },
  getTeam: jest.fn(() => mockTeam),
  getDraftPhases: jest.fn(() => []),
  isHighPerformingHero: jest.fn(() => false),
};

jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => mockAppData,
}));

function createMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    date: '2024-01-15T10:30:00Z',
    duration: 3600,
    radiant: { name: 'Radiant Team' },
    dire: { name: 'Dire Team' },
    draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
    players: { radiant: [], dire: [] },
    statistics: {
      radiantScore: 25,
      direScore: 20,
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
    },
    events: [],
    result: 'radiant',
    ...overrides,
  };
}

describe('MatchDetailsPanelDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const teamMatch: TeamMatchParticipation = {
    side: 'radiant',
    result: 'won',
    opponentName: 'Team Two',
    isManual: false,
    isHidden: false,
  };

  it('shows loading message while match data is loading', () => {
    const match = createMatch({ isLoading: true });
    render(<MatchDetailsPanelDraft match={match} teamMatch={undefined} hiddenMatchIds={new Set()} />);

    expect(screen.getByText('Loading draft data...')).toBeInTheDocument();
  });

  it('shows fallback picks when processed draft is missing', () => {
    const match = createMatch({
      processedDraft: [],
      draft: {
        radiantPicks: [
          { hero: { id: 1, name: 'npc_dota_hero_antimage', localizedName: 'Anti-Mage', imageUrl: '' }, order: 1 },
        ],
        direPicks: [{ hero: { id: 2, name: 'npc_dota_hero_axe', localizedName: 'Axe', imageUrl: '' }, order: 1 }],
        radiantBans: [],
        direBans: [],
      },
    });

    render(<MatchDetailsPanelDraft match={match} teamMatch={teamMatch} hiddenMatchIds={new Set()} />);

    expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
    expect(screen.getByText('Axe')).toBeInTheDocument();
    expect(screen.queryByText('#1')).not.toBeInTheDocument();
  });

  it('uses players as fallback picks when draft picks are empty', () => {
    const match = createMatch({
      processedDraft: [],
      draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
      players: {
        radiant: [
          {
            accountId: 1,
            playerName: 'Radiant Player',
            hero: { id: 3, name: 'npc_dota_hero_bane', localizedName: 'Bane', imageUrl: '' },
            stats: {
              kills: 0,
              deaths: 0,
              assists: 0,
              lastHits: 0,
              denies: 0,
              gpm: 0,
              xpm: 0,
              netWorth: 0,
              level: 1,
            },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
        dire: [
          {
            accountId: 2,
            playerName: 'Dire Player',
            hero: { id: 4, name: 'npc_dota_hero_bloodseeker', localizedName: 'Bloodseeker', imageUrl: '' },
            stats: {
              kills: 0,
              deaths: 0,
              assists: 0,
              lastHits: 0,
              denies: 0,
              gpm: 0,
              xpm: 0,
              netWorth: 0,
              level: 1,
            },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
      },
    });

    render(<MatchDetailsPanelDraft match={match} teamMatch={teamMatch} hiddenMatchIds={new Set()} />);

    expect(screen.getByText('Bane')).toBeInTheDocument();
    expect(screen.getByText('Bloodseeker')).toBeInTheDocument();
    expect(screen.queryByText('#1')).not.toBeInTheDocument();
  });

  it('shows empty state when no picks are available', () => {
    const match = createMatch({ processedDraft: [] });
    render(<MatchDetailsPanelDraft match={match} teamMatch={teamMatch} hiddenMatchIds={new Set()} />);

    expect(screen.getByText('No draft data available')).toBeInTheDocument();
  });
});
