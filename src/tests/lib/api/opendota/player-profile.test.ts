import fs from 'fs/promises';

import { fetchOpenDotaPlayer } from '@/lib/api/opendota/player-profile';
import { OpenDotaPlayer } from '@/types/external-apis';

jest.mock('fs/promises');

const mockPlayer: OpenDotaPlayer = {
  profile: {
    account_id: 123456789,
    personaname: 'Test Player',
    name: 'TestPlayer',
    plus: false,
    cheese: 0,
    steamid: '76561198083722517',
    avatar: 'https://avatar.url',
    avatarmedium: 'https://avatarmedium.url',
    avatarfull: 'https://avatarfull.url',
    profileurl: 'https://profile.url',
    last_login: '2023-01-01T00:00:00.000Z',
    loccountrycode: 'US',
    status: null,
    fh_unavailable: false,
    is_contributor: false,
    is_subscriber: false,
  },
  rank_tier: 75,
  leaderboard_rank: 1000,
};

describe('fetchOpenDotaPlayer', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads player from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockPlayer));
    const result = await fetchOpenDotaPlayer('123456789');
    expect(result).toEqual(mockPlayer);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaPlayer('123456789')).rejects.toThrow('Failed to load OpenDota player 123456789 from mock data');
  });

  // The following tests require more advanced mocking of cache/rate-limiter/fetch.
  // For a real backend test suite, use dependency injection or jest.mock for those modules.
}); 