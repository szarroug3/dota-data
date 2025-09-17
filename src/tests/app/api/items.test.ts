import { NextRequest } from 'next/server';

import { GET } from '@/app/api/items/route';
import { fetchOpenDotaItems } from '@/lib/api/opendota/items';
import type { OpenDotaItem } from '@/types/external-apis';

jest.mock('@/lib/api/opendota/items');

const mockFetchOpenDotaItems = fetchOpenDotaItems as jest.MockedFunction<typeof fetchOpenDotaItems>;

const mockItemsData: Record<string, OpenDotaItem> = {
  blink: {
    id: 1,
    img: '/apps/dota2/images/dota_react/items/blink.png',
    dname: 'Blink Dagger',
    qual: 'component',
    cost: 2250,
    behavior: 'Point Target',
    notes: 'Notes',
    attrib: [],
    mc: false,
    hc: false,
    cd: 15,
    lore: 'Lore',
    components: null,
    created: false,
    charges: false,
    abilities: [],
    hint: [],
    dispellable: 'no',
    dmg_type: 'physical',
    bkbpierce: 'no',
    tier: 1,
  },
};

describe('Items API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchOpenDotaItems.mockResolvedValue(mockItemsData);
  });

  it('returns items data successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/items');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockItemsData);
  });

  it('handles force parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/items?force=true');
    await GET(request);
    expect(mockFetchOpenDotaItems).toHaveBeenCalledWith(true);
  });

  it('maps parse errors to 422', async () => {
    mockFetchOpenDotaItems.mockRejectedValue(new Error('Failed to parse'));
    const request = new NextRequest('http://localhost:3000/api/items');
    const response = await GET(request);
    expect(response.status).toBe(422);
  });

  it('returns 422 when schema validation fails on shape mismatch', async () => {
    // Provide a malformed payload that will fail Zod validation in route.ts
    const badData: Record<string, { id?: string; dname?: number }> = {
      blink: {
        id: '1',
        dname: 123,
      },
    };
    mockFetchOpenDotaItems.mockResolvedValue(badData as Record<string, Partial<OpenDotaItem>> as Record<string, OpenDotaItem>);
    const request = new NextRequest('http://localhost:3000/api/items');
    const response = await GET(request);
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toBe('Invalid items data');
  });
});


