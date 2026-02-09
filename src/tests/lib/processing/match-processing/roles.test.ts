import { detectTeamRoles } from '@/lib/processing/match-processing/roles';
import type { OpenDotaMatchPlayer } from '@/types/external-apis';

const createPlayer = (overrides: Partial<OpenDotaMatchPlayer>): OpenDotaMatchPlayer => {
  const basePlayer = {
    account_id: 0,
    observer_uses: 0,
    sentry_uses: 0,
    lane_role: 0,
    is_roaming: false,
  } as OpenDotaMatchPlayer;

  return { ...basePlayer, ...overrides };
};

describe('detectTeamRoles', () => {
  it('labels offlane and soft support in offlane pair', () => {
    const players = [
      createPlayer({ account_id: 1, lane_role: 3, observer_uses: 0, sentry_uses: 0 }),
      createPlayer({ account_id: 2, lane_role: 3, observer_uses: 1, sentry_uses: 2 }),
    ];

    const roles = detectTeamRoles(players);

    expect(roles['1']).toBe('Offlane');
    expect(roles['2']).toBe('Soft Support');
  });

  it('maps roaming players to roaming when unassigned', () => {
    const players = [createPlayer({ account_id: 3, lane_role: 0, is_roaming: true })];

    const roles = detectTeamRoles(players);

    expect(roles['3']).toBe('Roaming');
  });
});
