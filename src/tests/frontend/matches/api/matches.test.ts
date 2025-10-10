import { parseMatch } from '@/frontend/matches/api/matches';

// Mock the api-client to capture calls (use Jest like the rest of the repo)
jest.mock('@/frontend/lib/api-client', () => {
  const actual = jest.requireActual('@/frontend/lib/api-client');
  return {
    ...actual,
    requestAndValidate: jest.fn().mockResolvedValue({ match_id: 123 }),
  };
});

// Mock schemas lookup used by the API layer
jest.mock('@/types/api-zod', () => {
  const actual = jest.requireActual('@/types/api-zod');
  return {
    ...actual,
    schemas: {
      getApiMatches: { parse: (d: Record<string, string | number | boolean | null | object>) => d },
    },
  };
});

describe('frontend/matches/api/matches.parseMatch', () => {
  it('POSTs to /api/matches/:id/parse and validates response', async () => {
    const { requestAndValidate } = jest.requireMock('@/frontend/lib/api-client') as {
      requestAndValidate: jest.Mock;
    };

    const result = await parseMatch(8054301932);

    expect(requestAndValidate).toHaveBeenCalledTimes(1);
    const [path, _validator, options] = requestAndValidate.mock.calls[0];
    expect(path).toBe('/api/matches/8054301932/parse');
    expect(options).toMatchObject({ method: 'POST' });
    expect(result).toEqual({ match_id: 123 });
  });
});
