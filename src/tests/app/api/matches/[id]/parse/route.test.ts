import { NextRequest } from 'next/server';

import { POST } from '@/app/api/matches/[id]/parse/route';
import { parseOpenDotaMatchWithJobPolling } from '@/lib/api/opendota/matches';
import type { OpenDotaMatch } from '@/types/external-apis';

jest.mock('@/lib/api/opendota/matches');

const mockParseOpenDotaMatchWithJobPolling = parseOpenDotaMatchWithJobPolling as jest.MockedFunction<
  typeof parseOpenDotaMatchWithJobPolling
>;

describe('/api/matches/[id]/parse route', () => {
  const matchId = '1234567890';
  const url = `http://localhost:3000/api/matches/${matchId}/parse`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed match data on success', async () => {
    const mockParsedMatch: OpenDotaMatch = {
      match_id: Number(matchId),
      radiant_win: true,
      duration: 2400,
      start_time: 1640995200,
      players: [],
      // Add all required OpenDotaMatch fields with mock values as needed
      // If your type requires more fields, add them here
    };
    mockParseOpenDotaMatchWithJobPolling.mockResolvedValueOnce(mockParsedMatch);

    const req = new NextRequest(`${url}`);
    const res = await POST(req, { params: { id: matchId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockParsedMatch);
    expect(mockParseOpenDotaMatchWithJobPolling).toHaveBeenCalledWith(matchId);
  });

  it('returns 408 if parsing times out', async () => {
    mockParseOpenDotaMatchWithJobPolling.mockRejectedValueOnce(new Error('Match parsing timed out'));
    const req = new NextRequest(url);
    const res = await POST(req, { params: { id: matchId } });
    const data = await res.json();
    expect(res.status).toBe(408);
    expect(data.error).toMatch(/timed out/i);
  });

  it('returns 404 if match not found', async () => {
    mockParseOpenDotaMatchWithJobPolling.mockRejectedValueOnce(new Error('Match not found'));
    const req = new NextRequest(url);
    const res = await POST(req, { params: { id: matchId } });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it('returns 429 if rate limited', async () => {
    mockParseOpenDotaMatchWithJobPolling.mockRejectedValueOnce(new Error('Rate limited'));
    const req = new NextRequest(url);
    const res = await POST(req, { params: { id: matchId } });
    const data = await res.json();
    expect(res.status).toBe(429);
    expect(data.error).toMatch(/rate limited/i);
  });

  it('returns 422 if match data is invalid', async () => {
    mockParseOpenDotaMatchWithJobPolling.mockRejectedValueOnce(new Error('Failed to parse'));
    const req = new NextRequest(url);
    const res = await POST(req, { params: { id: matchId } });
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.error).toMatch(/invalid match data/i);
  });

  it('returns 500 for unknown errors', async () => {
    mockParseOpenDotaMatchWithJobPolling.mockRejectedValueOnce(new Error('Some unknown error'));
    const req = new NextRequest(url);
    const res = await POST(req, { params: { id: matchId } });
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toMatch(/failed to parse match/i);
  });
});
