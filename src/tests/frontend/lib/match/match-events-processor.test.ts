import type { Hero } from '@/frontend/lib/app-data/app-data-types';
import { generateEvents } from '@/frontend/lib/match/match-events-processor';
import type { OpenDotaMatch } from '@/types/external-apis';

describe('match-events-processor', () => {
  it('uses victim hero localized name and image for first blood', () => {
    const heroes = new Map<number, Hero>([
      [
        1,
        {
          id: 1,
          name: 'npc_dota_hero_lina',
          localizedName: 'Lina',
          imageUrl: '/lina.png',
        },
      ],
      [
        2,
        {
          id: 2,
          name: 'npc_dota_hero_axe',
          localizedName: 'Axe',
          imageUrl: '/axe.png',
        },
      ],
    ]);

    const matchData = {
      match_id: 1,
      start_time: 0,
      duration: 0,
      radiant_win: true,
      radiant_score: 0,
      dire_score: 0,
      players: [
        {
          account_id: 123,
          player_slot: 0,
          hero_id: 1,
          kills_log: [{ time: 10, key: 'npc_dota_hero_axe' }],
        },
      ],
      objectives: [{ time: 10, type: 'CHAT_MESSAGE_FIRSTBLOOD', player_slot: 0 }],
    } as OpenDotaMatch;

    const events = generateEvents(matchData, heroes);
    expect(events).toHaveLength(1);

    const [event] = events;
    expect(event.details.killer).toBe('Lina');
    expect(event.details.victim).toBe('Axe');
    expect(event.details.victimHero?.imageUrl).toBe('/axe.png');
  });
});
