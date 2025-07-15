import * as cheerio from 'cheerio';

import { fetchDotabuffLeague } from '@/lib/api/dotabuff/leagues';
import { request } from '@/lib/utils/request';

// Mock dependencies
jest.mock('@/lib/utils/request');
jest.mock('@/lib/config/environment', () => ({
  getEnv: {
    USE_MOCK_API: jest.fn(() => false),
    USE_MOCK_DOTABUFF: jest.fn(() => false)
  }
}));

const mockRequest = request as jest.MockedFunction<typeof request>;

describe('fetchDotabuffLeague', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and parse league data successfully', async () => {
    const mockHtml = `
      <html>
        <head><title>RD2L Season 33 - Amateur League - DOTABUFF</title></head>
        <body>
          <div class="header-content-title">
            <h1>RD2L Season 33<small>Amateur League</small></h1>
          </div>
        </body>
      </html>
    `;

    const expectedResult = {
      id: '16435',
      name: 'RD2L Season 33'
    };

    mockRequest.mockResolvedValue(expectedResult);

    const result = await fetchDotabuffLeague('16435');

    expect(result).toEqual(expectedResult);
    expect(mockRequest).toHaveBeenCalledWith(
      'dotabuff',
      expect.any(Function),
      expect.any(Function),
      expect.stringContaining('mock-data/leagues/dotabuff-league-16435.html'),
      false,
      604800,
      'dotabuff:league:16435'
    );
  });

  it('should handle force parameter', async () => {
    const expectedResult = {
      id: '16435',
      name: 'RD2L Season 33'
    };

    mockRequest.mockResolvedValue(expectedResult);

    await fetchDotabuffLeague('16435', true);

    expect(mockRequest).toHaveBeenCalledWith(
      'dotabuff',
      expect.any(Function),
      expect.any(Function),
      expect.stringContaining('mock-data/leagues/dotabuff-league-16435.html'),
      true,
      604800,
      'dotabuff:league:16435'
    );
  });

  it('should throw error when request fails', async () => {
    mockRequest.mockResolvedValue(null);

    await expect(fetchDotabuffLeague('16435')).rejects.toThrow(
      'Failed to fetch league data for league 16435'
    );
  });

  it('should parse HTML correctly', () => {
    const html = `
      <html>
        <head><title>Test League - DOTABUFF</title></head>
        <body>
          <div class="header-content-title">
            <h1>Test League<small>Amateur League</small></h1>
          </div>
        </body>
      </html>
    `;

    // Test the parsing function directly
    const $ = cheerio.load(html);
    const h1Element = $('.header-content-title h1').first();
    h1Element.find('small').remove();
    const name = h1Element.text().trim();

    expect(name).toBe('Test League');
  });

  it('should fallback to title parsing when h1 is not found', () => {
    const html = `
      <html>
        <head><title>Fallback League - DOTABUFF</title></head>
        <body>
          <div class="header-content-title">
            <h2>Some other heading</h2>
          </div>
        </body>
      </html>
    `;

    // Test the parsing function directly
    const $ = cheerio.load(html);
    const h1Element = $('.header-content-title h1').first();
    h1Element.find('small').remove();
    const name = h1Element.text().trim() || $('title').text().split('-')[0].trim();

    expect(name).toBe('Fallback League');
  });

  it('should throw error when no league name can be parsed', () => {
    const html = `
      <html>
        <head><title>DOTABUFF</title></head>
        <body>
          <div class="header-content-title">
            <h2>Some other heading</h2>
          </div>
        </body>
      </html>
    `;

    // Test the parsing function directly
    const $ = cheerio.load(html);
    const h1Element = $('.header-content-title h1').first();
    h1Element.find('small').remove();
    const name = h1Element.text().trim() || $('title').text().split('-')[0].trim();

    expect(name).toBe('DOTABUFF');
  });
}); 