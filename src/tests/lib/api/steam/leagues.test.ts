/**
 * @jest-environment node
 */

import { fetchSteamLeague } from '@/lib/api/steam/leagues';
import { request } from '@/lib/utils/request';

jest.mock('@/lib/utils/request');

const mockRequest = request as jest.MockedFunction<typeof request>;

describe('fetchSteamLeague', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches from Steam API and returns shaped response', async () => {
    mockRequest.mockResolvedValue({
      id: '17805',
      name: 'League 17805',
      steam: { result: { status: 1, matches: [{ match_id: 1 }] } },
    });

    const result = await fetchSteamLeague('17805');
    expect(result).toEqual({
      id: '17805',
      name: 'League 17805',
      steam: { result: { status: 1, matches: [{ match_id: 1 }] } },
    });
  });
});
