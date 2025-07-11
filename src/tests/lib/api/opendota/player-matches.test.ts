import fs from 'fs/promises';

import {
    fetchOpenDotaPlayerMatches,
    fetchOpenDotaPlayerRecentMatches
} from '@/lib/api/opendota/player-matches';
import { OpenDotaPlayerMatch, OpenDotaPlayerRecentMatches } from '@/types/external-apis';

jest.mock('fs/promises');

const mockPlayerMatch: OpenDotaPlayerMatch = {
  match_id: 1234567890,
  player_slot: 0,
  radiant_win: true,
  hero_id: 1,
  start_time: 1640995200,
  duration: 2400,
  game_mode: 22,
  lobby_type: 0,
  version: 131,
  kills: 10,
  deaths: 3,
  assists: 5,
  average_rank: 75,
  xp_per_min: 500,
  gold_per_min: 450,
  hero_damage: 15000,
  tower_damage: 3000,
  hero_healing: 2000,
  last_hits: 200,
  lane: 1,
  lane_role: 1,
  is_roaming: false,
  cluster: 111,
  leaver_status: 0,
  party_size: 1,
  hero_variant: 1,
};

const mockPlayerRecentMatch: OpenDotaPlayerRecentMatches = {
  match_id: 1234567890,
  player_slot: 0,
  radiant_win: true,
  duration: 2400,
  game_mode: 22,
  lobby_type: 0,
  hero_id: 1,
  start_time: 1640995200,
  version: 131,
  kills: 10,
  deaths: 3,
  assists: 5,
  skill: 3,
  average_rank: 75,
  xp_per_min: 500,
  gold_per_min: 450,
  hero_damage: 15000,
  tower_damage: 3000,
  hero_healing: 2000,
  last_hits: 200,
  lane: 1,
  lane_role: 1,
  is_roaming: false,
  cluster: 111,
  leaver_status: 0,
  party_size: 1,
};

describe('fetchOpenDotaPlayerMatches', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads player matches from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify([mockPlayerMatch]));
    const result = await fetchOpenDotaPlayerMatches('123456789');
    expect(result).toEqual([mockPlayerMatch]);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaPlayerMatches('123456789')).rejects.toThrow('Failed to load OpenDota player matches 123456789 from mock data');
  });
});

describe('fetchOpenDotaPlayerRecentMatches', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads player recent matches from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify([mockPlayerRecentMatch]));
    const result = await fetchOpenDotaPlayerRecentMatches('123456789');
    expect(result).toEqual([mockPlayerRecentMatch]);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaPlayerRecentMatches('123456789')).rejects.toThrow('Failed to load OpenDota player recent matches 123456789 from mock data');
  });
}); 