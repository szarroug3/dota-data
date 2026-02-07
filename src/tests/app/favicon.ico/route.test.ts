import { GET } from '@/app/favicon.ico/route';

describe('GET /favicon.ico', () => {
  it('returns an SVG favicon response', async () => {
    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(response.headers.get('Cache-Control')).toContain('max-age');
    expect(response.body).not.toBeNull();
  });
});
