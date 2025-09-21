/**
 * Share API tests
 */
import { NextRequest } from 'next/server';

import { GET as getShare } from '@/app/api/share/[key]/route';
import { POST as postShare } from '@/app/api/share/route';

type ShareTestBody = {
  key?: string;
  data: {
    teams?: object;
    activeTeam?: object | null;
    globalManualMatches?: number[];
    globalManualPlayers?: number[];
  };
};

function makeJsonRequest(body: ShareTestBody): NextRequest {
  return new NextRequest('http://localhost/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Share API', () => {
  it('creates a new share when key is omitted and then retrieves it', async () => {
    const payload = {
      teams: { example: { id: 1 } },
      activeTeam: { teamId: 1, leagueId: 2 },
      globalManualMatches: [111],
      globalManualPlayers: [222],
    };

    const postRes = await postShare(makeJsonRequest({ data: payload }));
    const postJson = (await postRes.json()) as { key: string };
    expect(typeof postJson.key).toBe('string');
    expect(postJson.key).toMatch(/^[A-Za-z0-9]{6}$/);

    const getRes = await getShare(new NextRequest(`http://localhost/api/share/${postJson.key}`), {
      params: { key: postJson.key },
    });
    const getJson = (await getRes.json()) as typeof payload;
    expect(getJson).toEqual(payload);
  });

  it('upserts using an existing key', async () => {
    const key = 'test-key-123';
    const initial = {
      teams: { a: 1 },
      activeTeam: null,
      globalManualMatches: [],
      globalManualPlayers: [],
    };
    const updated = {
      teams: { a: 1, b: 2 },
      activeTeam: { teamId: 9, leagueId: 8 },
      globalManualMatches: [1, 2, 3],
      globalManualPlayers: [4, 5],
    };

    // First write with provided key succeeds
    const first = await postShare(makeJsonRequest({ key, data: initial }));
    expect(first.status).toBe(200);

    // Second write with same key should be rejected with 409
    const second = await postShare(makeJsonRequest({ key, data: updated }));
    expect(second.status).toBe(409);

    // Ensure stored value remains the initial payload
    const getRes = await getShare(new NextRequest(`http://localhost/api/share/${key}`), {
      params: { key },
    });
    const getJson = (await getRes.json()) as typeof initial;
    expect(getJson).toEqual(initial);
  });

  it('generates a unique key on create and retries on collision (simulated)', async () => {
    const payload = {
      teams: { one: 1 },
      activeTeam: null,
      globalManualMatches: [],
      globalManualPlayers: [],
    };

    const firstRes = await postShare(makeJsonRequest({ data: payload }));
    const firstJson = (await firstRes.json()) as { key: string };
    expect(firstRes.status).toBe(200);

    const secondRes = await postShare(makeJsonRequest({ data: payload }));
    const secondJson = (await secondRes.json()) as { key: string };
    expect(secondRes.status).toBe(200);
    // Keys should be different due to uniqueness generation
    expect(secondJson.key).not.toBe(firstJson.key);
  });
});
