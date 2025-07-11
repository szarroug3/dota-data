import fs from 'fs/promises';

import { fetchOpenDotaHeroes } from '@/lib/api/opendota/heroes';
import { OpenDotaHero } from '@/types/external-apis';

jest.mock('fs/promises');

const mockHeroes: OpenDotaHero[] = [
  {
    id: 1,
    name: 'npc_dota_hero_antimage',
    localized_name: 'Anti-Mage',
    primary_attr: 'agi',
    attack_type: 'Melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    img: '/apps/dota2/images/heroes/antimage_full.png?',
    icon: '/apps/dota2/images/heroes/antimage_icon.png',
    base_health: 200,
    base_mana: 75,
    base_armor: 0,
    base_attack_min: 29,
    base_attack_max: 33,
    move_speed: 310,
    base_attack_time: 1.4,
    attack_point: 0.3,
    attack_range: 150,
    projectile_speed: 0,
    turn_rate: 0.6,
    cm_enabled: true,
    legs: 2,
    day_vision: 1800,
    night_vision: 800,
    hero_id: 1,
    turbo_picks: 0,
    turbo_wins: 0,
    pro_ban: 0,
    pro_win: 0,
    pro_pick: 0,
    "1_pick": 0,
    "1_win": 0,
    "2_pick": 0,
    "2_win": 0,
    "3_pick": 0,
    "3_win": 0,
    "4_pick": 0,
    "4_win": 0,
    "5_pick": 0,
    "5_win": 0,
    "6_pick": 0,
    "6_win": 0,
    "7_pick": 0,
    "7_win": 0,
    "8_pick": 0,
    "8_win": 0,
    null_pick: 0,
    null_win: 0,
  },
];

describe('fetchOpenDotaHeroes', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('loads heroes from mock file in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockHeroes));
    const result = await fetchOpenDotaHeroes();
    expect(result).toEqual(mockHeroes);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it('throws if mock file is missing in mock mode', async () => {
    process.env.USE_MOCK_API = 'true';
    (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    await expect(fetchOpenDotaHeroes()).rejects.toThrow('Failed to load OpenDota heroes from mock data');
  });

  // The following tests require more advanced mocking of cache/rate-limiter/fetch.
  // For a real backend test suite, use dependency injection or jest.mock for those modules.
}); 