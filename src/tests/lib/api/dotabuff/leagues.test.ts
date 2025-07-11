import fs from 'fs/promises';

import { fetchDotabuffLeague } from '@/lib/api/dotabuff/leagues';
import { DotabuffLeague } from '@/types/external-apis';

jest.mock('fs/promises');

const expectedLeague: DotabuffLeague = {
  league_id: 456,
  name: 'League 456',
  description: '',
  tournament_url: '',
  matches: [],
};

// NOTE: This test expects an empty matches array due to the placeholder implementation of parseDotabuffLeagueHtml.
// Update this test when a real HTML parser is implemented.

describe('fetchDotabuffLeague', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    (fs.readFile as jest.Mock).mockReset();
    jest.clearAllMocks();
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns league data in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({})); // content ignored by placeholder parser
    const league = await fetchDotabuffLeague('456');
    expect(league).toEqual(expectedLeague);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws error if mock file is missing', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
    await expect(fetchDotabuffLeague('456')).rejects.toThrow('Mock data file not found for league 456');
  });
}); 