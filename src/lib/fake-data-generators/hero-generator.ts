import { writeMockData } from '@/lib/mock-data-writer';
import type { OpenDotaHero } from '@/types/opendota';
import fs from 'fs';
import path from 'path';
import { randomInt } from './utils/fake-data-helpers';

// Load real heroes data
function loadRealHeroes(): OpenDotaHero[] {
  try {
    const heroesPath = path.join(process.cwd(), 'real-data', 'heroes.json');
    const heroesData = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
    return Object.values(heroesData);
  } catch {
    console.warn('Could not load real heroes data, using fallback');
    return [];
  }
}

export function generateFakeHeroes(count: number = 50, filename: string): OpenDotaHero[] {
  const realHeroes = loadRealHeroes();
  
  if (realHeroes.length === 0) {
    console.warn('No real heroes data available, generating fallback data');
    return generateFallbackHeroes(count, filename);
  }
  
  // Use real heroes data, optionally randomizing some stats for variety
  const data = realHeroes.slice(0, Math.min(count, realHeroes.length)).map(hero => ({
    ...hero,
    // Optionally add some randomization to stats for variety
    turbo_picks: hero.turbo_picks + randomInt(-50, 50),
    turbo_wins: hero.turbo_wins + randomInt(-25, 25),
    pro_ban: hero.pro_ban + randomInt(-5, 5),
    pro_win: hero.pro_win + randomInt(-3, 3),
    pro_pick: hero.pro_pick + randomInt(-5, 5),
  }));
  
  writeMockData(filename, data, '/heroes');
  return data;
}

function generateFallbackHeroes(count: number, filename: string): OpenDotaHero[] {
  const fallbackHeroes = [
    { id: 1, name: 'Anti-Mage', localized_name: 'Anti-Mage', primary_attr: 'agi', attack_type: 'Melee', roles: ['Carry', 'Escape', 'Nuker'] },
    { id: 2, name: 'Axe', localized_name: 'Axe', primary_attr: 'str', attack_type: 'Melee', roles: ['Initiator', 'Durable', 'Disabler'] },
    { id: 3, name: 'Bane', localized_name: 'Bane', primary_attr: 'int', attack_type: 'Ranged', roles: ['Support', 'Disabler', 'Nuker'] },
    { id: 4, name: 'Bloodseeker', localized_name: 'Bloodseeker', primary_attr: 'agi', attack_type: 'Melee', roles: ['Carry', 'Nuker', 'Disabler'] },
    { id: 5, name: 'Crystal Maiden', localized_name: 'Crystal Maiden', primary_attr: 'int', attack_type: 'Ranged', roles: ['Support', 'Disabler', 'Nuker'] }
  ];
  
  const data = Array.from({ length: count }, (_, i) => {
    const hero = fallbackHeroes[i % fallbackHeroes.length];
    return {
      ...hero,
      img: `/heroes/${hero.name.toLowerCase().replace(/\s+/g, '_')}.png`,
      icon: `/heroes/${hero.name.toLowerCase().replace(/\s+/g, '_')}_icon.png`,
      base_health: randomInt(150, 300),
      base_mana: randomInt(0, 200),
      base_armor: randomInt(0, 10),
      base_attack_min: randomInt(20, 80),
      base_attack_max: randomInt(20, 80),
      move_speed: randomInt(280, 350),
      base_attack_time: randomInt(100, 200) / 100,
      attack_point: randomInt(100, 200) / 100,
      attack_range: hero.primary_attr === 'agi' ? randomInt(400, 650) : randomInt(100, 400),
      projectile_speed: hero.attack_type === 'Ranged' ? randomInt(800, 1200) : 0,
      turn_rate: randomInt(50, 100) / 100,
      cm_enabled: true,
      legs: randomInt(2, 4),
      day_vision: randomInt(800, 1800),
      night_vision: randomInt(800, 1800),
      hero_id: hero.id,
      turbo_picks: randomInt(0, 1000),
      turbo_wins: randomInt(0, 500),
      pro_ban: randomInt(0, 100),
      pro_win: randomInt(0, 50),
      pro_pick: randomInt(0, 100),
      "1_pick": randomInt(0, 1000),
      "1_win": randomInt(0, 500),
      "2_pick": randomInt(0, 1000),
      "2_win": randomInt(0, 500),
      "3_pick": randomInt(0, 1000),
      "3_win": randomInt(0, 500),
      "4_pick": randomInt(0, 1000),
      "4_win": randomInt(0, 500),
      "5_pick": randomInt(0, 1000),
      "5_win": randomInt(0, 500),
      "6_pick": randomInt(0, 1000),
      "6_win": randomInt(0, 500),
      "7_pick": randomInt(0, 1000),
      "7_win": randomInt(0, 500),
      "8_pick": randomInt(0, 1000),
      "8_win": randomInt(0, 500),
      null_pick: randomInt(0, 100),
      null_win: randomInt(0, 50)
    };
  });
  
  writeMockData(filename, data, '/heroes');
  return data;
} 