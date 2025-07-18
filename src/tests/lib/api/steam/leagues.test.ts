/**
 * @jest-environment node
 */

import { fetchSteamLeague } from '@/lib/api/steam/leagues';
import { request, requestWithRetry } from '@/lib/utils/request';

// Mock the request utilities
jest.mock('@/lib/utils/request');

const mockRequest = request as jest.MockedFunction<typeof request>;
const mockRequestWithRetry = requestWithRetry as jest.MockedFunction<typeof requestWithRetry>;

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

      const result = await fetchSteamLeague('16435');

      expect(result).toEqual(mockLeagueData);
      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/leagues/dotabuff-league-16435.html'),
        false,
        60 * 60 * 24 * 7, // 7 days
        'dotabuff:league:16435'
      );
    });

    it('should throw error when request fails', async () => {
      mockRequest.mockResolvedValue(null);

      await expect(fetchSteamLeague('16435')).rejects.toThrow(
        'Failed to fetch league data for league 16435'
      );
    });

    it('should use force parameter when provided', async () => {
      const mockLeagueData = { id: '16435', name: 'Test League' };
      mockRequest.mockResolvedValue(mockLeagueData);

      await fetchSteamLeague('16435', true);

      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/leagues/dotabuff-league-16435.html'),
        true, // force parameter
        60 * 60 * 24 * 7,
        'dotabuff:league:16435'
      );
    });
  });

  describe('fetchLeagueFromDotabuff', () => {
    it('should fetch HTML from Dotabuff API', async () => {
      const mockResponse = {
        text: jest.fn().mockResolvedValue(`
          <html>
            <head><title>Test League - Dotabuff</title></head>
            <body>
              <div class="header-content-title">
                <h1>Test League</h1>
              </div>
            </body>
          </html>
        `),
        headers: new Headers(),
        ok: true,
        redirected: false,
        status: 200,
        statusText: 'OK',
        type: 'default' as ResponseType,
        url: 'https://www.dotabuff.com/esports/leagues/16435',
        body: null,
        bodyUsed: false,
        clone: jest.fn(),
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        json: jest.fn(),
        bytes: jest.fn(),
      } as Response;

      mockRequestWithRetry.mockResolvedValue(mockResponse);

      // We need to test the internal function, so we'll call fetchDotabuffLeague
      // and verify that requestWithRetry was called correctly
      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        const html = await fetcher();
        return parser(html);
      });

      await fetchSteamLeague('16435');

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        'GET',
        'https://www.dotabuff.com/esports/leagues/16435'
      );
    });
  });

  describe('parseDotabuffLeagueHtml', () => {
    it('should parse league name from h1 element', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Test League Name<small>Additional info</small></h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchSteamLeague('16435');

      expect(result).toEqual({
        id: '16435',
        name: 'Test League Name'
      });
    });

    it('should parse league name from title when h1 is not available', async () => {
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

      const result = await fetchSteamLeague('16435');

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

      await expect(fetchSteamLeague('16435')).rejects.toThrow(
        'Could not parse league name from Dotabuff HTML'
      );
    });

    it('should handle HTML with no small element in h1', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Simple League Name</h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchSteamLeague('16435');

      expect(result).toEqual({
        id: '16435',
        name: 'Simple League Name'
      });
    });

    it('should handle HTML with multiple h1 elements', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>First League Name</h1>
              <h1>Second League Name</h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchSteamLeague('16435');

      expect(result).toEqual({
        id: '16435',
        name: 'First League Name'
      });
    });

    it('should handle HTML with whitespace in league name', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>  League Name With Spaces  </h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchSteamLeague('16435');

      expect(result).toEqual({
        id: '16435',
        name: 'League Name With Spaces'
      });
    });
  });
}); 