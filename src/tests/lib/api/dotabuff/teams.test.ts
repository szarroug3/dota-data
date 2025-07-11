import fs from 'fs/promises';

import { fetchDotabuffTeam } from '@/lib/api/dotabuff/teams';
import { DotabuffTeam } from '@/types/external-apis';

jest.mock('fs/promises');

const mockTeam: DotabuffTeam = {
  teamName: 'Team Example',
  matches: {
    '456': {
      match_id: 789,
      start_time: 1717200000,
      duration: 3600,
      radiant_name: 'Radiant Team',
      dire_name: 'Dire Team',
      radiant_win: true,
      radiant_score: 42,
      dire_score: 38,
      leagueid: 456,
    },
  },
  // Add other required fields as needed
};

describe('fetchDotabuffTeam', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads team from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockTeam));
    const result = await fetchDotabuffTeam('123');
    expect(result).toEqual(mockTeam);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchDotabuffTeam('123')).rejects.toThrow('Failed to load Dotabuff team 123 from mock data');
  });

  // The following tests require more advanced mocking of cache/rate-limiter/fetch.
  // For a real backend test suite, use dependency injection or jest.mock for those modules.
}); 