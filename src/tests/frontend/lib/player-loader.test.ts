import { fetchAndProcessPlayer } from '@/frontend/lib/player-loader';

const originalFetch = global.fetch;

const mockPlayerData = {
  profile: {
    profile: {
      account_id: 111,
      name: 'Test Player',
      personaname: 'Test Player',
      avatar: '',
      avatarfull: '',
      profileurl: '',
    },
    rank_tier: 0,
    leaderboard_rank: null,
  },
  heroes: [],
  wl: {
    win: 0,
    lose: 0,
  },
  recentMatches: [],
};

describe('fetchAndProcessPlayer', () => {
  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('requests player data without force by default', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockPlayerData,
        profile: { ...mockPlayerData.profile, profile: { ...mockPlayerData.profile.profile, account_id: 111 } },
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    await fetchAndProcessPlayer(111);

    expect(fetchMock).toHaveBeenCalledWith('/api/players/111');
  });

  it('requests player data with force when specified', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockPlayerData,
        profile: { ...mockPlayerData.profile, profile: { ...mockPlayerData.profile.profile, account_id: 222 } },
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    await fetchAndProcessPlayer(222, { force: true });

    expect(fetchMock).toHaveBeenCalledWith('/api/players/222?force=true');
  });
});
