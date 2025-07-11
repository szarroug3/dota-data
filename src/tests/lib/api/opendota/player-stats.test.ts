import fs from 'fs/promises';

import {
    fetchOpenDotaPlayerCounts,
    fetchOpenDotaPlayerHeroes,
    fetchOpenDotaPlayerTotals,
    fetchOpenDotaPlayerWL
} from '@/lib/api/opendota/player-stats';
import {
    OpenDotaPlayerCounts,
    OpenDotaPlayerHero,
    OpenDotaPlayerTotals,
    OpenDotaPlayerWL
} from '@/types/external-apis';

jest.mock('fs/promises');

const mockPlayerHero: OpenDotaPlayerHero = {
  hero_id: 1,
  last_played: 1640995200,
  games: 50,
  win: 30,
  with_games: 25,
  with_win: 15,
  against_games: 20,
  against_win: 10,
};

const mockPlayerCounts: OpenDotaPlayerCounts = {
  leaver_status: 0,
  game_mode: 22,
  lobby_type: 0,
  lane_role: 1,
  region: 1,
  patch: 131,
};

const mockPlayerTotals: OpenDotaPlayerTotals = {
  np: 100,
  fantasy: 50,
  cosmetic: 25,
  all_time: 1000,
  ranked: 800,
  turbo: 200,
  matched: 900,
};

const mockPlayerWL: OpenDotaPlayerWL = {
  win: 600,
  lose: 400,
};

describe('fetchOpenDotaPlayerHeroes', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads player heroes from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify([mockPlayerHero]));
    const result = await fetchOpenDotaPlayerHeroes('123456789');
    expect(result).toEqual([mockPlayerHero]);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaPlayerHeroes('123456789')).rejects.toThrow('Failed to load OpenDota player heroes 123456789 from mock data');
  });
});

describe('fetchOpenDotaPlayerCounts', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads player counts from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockPlayerCounts));
    const result = await fetchOpenDotaPlayerCounts('123456789');
    expect(result).toEqual(mockPlayerCounts);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaPlayerCounts('123456789')).rejects.toThrow('Failed to load OpenDota player counts 123456789 from mock data');
  });
});

describe('fetchOpenDotaPlayerTotals', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads player totals from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockPlayerTotals));
    const result = await fetchOpenDotaPlayerTotals('123456789');
    expect(result).toEqual(mockPlayerTotals);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaPlayerTotals('123456789')).rejects.toThrow('Failed to load OpenDota player totals 123456789 from mock data');
  });
});

describe('fetchOpenDotaPlayerWL', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads player W/L from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockPlayerWL));
    const result = await fetchOpenDotaPlayerWL('123456789');
    expect(result).toEqual(mockPlayerWL);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaPlayerWL('123456789')).rejects.toThrow('Failed to load OpenDota player W/L 123456789 from mock data');
  });
}); 