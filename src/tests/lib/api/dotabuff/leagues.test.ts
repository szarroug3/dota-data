/**
 * @jest-environment node
 */

import { fetchDotabuffLeague } from '@/lib/api/dotabuff/leagues';
import { request } from '@/lib/utils/request';
import { scrapeHtmlFromUrl } from '@/lib/utils/playwright';

// Mock the request utilities
jest.mock('@/lib/utils/request');
jest.mock('@/lib/utils/playwright');

const mockRequest = request as jest.MockedFunction<typeof request>;
const mockScrapeHtmlFromUrl = scrapeHtmlFromUrl as jest.MockedFunction<typeof scrapeHtmlFromUrl>;

describe('fetchDotabuffLeague', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDotabuffLeague', () => {
    it('should fetch and parse league data successfully', async () => {
      const mockLeagueData = {
        id: '16435',
        name: 'RD2L Season 33'
      };

      mockRequest.mockResolvedValue(mockLeagueData);

      const result = await fetchDotabuffLeague('16435');

      expect(result).toEqual(mockLeagueData);
      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringMatching(/.*dotabuff-league-16435\.html$/),
        false,
        60 * 60 * 24 * 7, // 7 days
        'dotabuff:league:16435'
      );
    });

    it('should throw error when request fails', async () => {
      mockRequest.mockResolvedValue(null);

      await expect(fetchDotabuffLeague('16435')).rejects.toThrow(
        'Failed to fetch league data for league 16435'
      );
    });

    it('should use force parameter when provided', async () => {
      const mockLeagueData = { id: '16435', name: 'Test League' };
      mockRequest.mockResolvedValue(mockLeagueData);

      await fetchDotabuffLeague('16435', true);

      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringMatching(/.*dotabuff-league-16435\.html$/),
        true, // force parameter
        60 * 60 * 24 * 7,
        'dotabuff:league:16435'
      );
    });
  });

  describe('fetchLeagueFromDotabuff', () => {
    it('should fetch HTML from Dotabuff using Playwright', async () => {
      const mockHtml = `
        <html>
          <head><title>Test League - Dotabuff</title></head>
          <body>
            <div class="header-content-title">
              <h1>Test League</h1>
            </div>
          </body>
        </html>
      `;

      mockScrapeHtmlFromUrl.mockResolvedValue(mockHtml);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        const html = await fetcher();
        return parser(html);
      });

      await fetchDotabuffLeague('16435');

      expect(mockScrapeHtmlFromUrl).toHaveBeenCalledWith(
        'https://www.dotabuff.com/esports/leagues/16435',
        '.header-content-title'
      );
    });

    it('should throw error when Playwright scraping fails', async () => {
      mockScrapeHtmlFromUrl.mockRejectedValue(new Error('Playwright error'));

      mockRequest.mockImplementation(async (service, fetcher) => {
        await fetcher();
        return null;
      });

      await expect(fetchDotabuffLeague('16435')).rejects.toThrow(
        'Playwright error'
      );
    });
  });

  describe('parseDotabuffLeagueHtml', () => {
    it('should parse league name from header', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>RD2L Season 33</h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffLeague('16435');

      expect(result).toEqual({
        id: '16435',
        name: 'RD2L Season 33'
      });
    });

    it('should parse league name from title when header is not available', async () => {
      const mockHtml = `
        <html>
          <head><title>Test League - Dotabuff</title></head>
          <body>
            <div class="header-content-title">
              <h1></h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffLeague('16435');

      expect(result).toEqual({
        id: '16435',
        name: 'Test League'
      });
    });

    it('should throw error when league name cannot be parsed', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1></h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      await expect(fetchDotabuffLeague('16435')).rejects.toThrow(
        'Could not parse league name from Dotabuff HTML'
      );
    });

    it('should remove small elements from header', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>RD2L Season 33<small>Some additional info</small></h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffLeague('16435');

      expect(result).toEqual({
        id: '16435',
        name: 'RD2L Season 33'
      });
    });
  });
}); 