/**
 * @jest-environment node
 */

import { fetchDotabuffTeam } from '@/lib/api/dotabuff/teams';
import { request, requestWithRetry } from '@/lib/utils/request';

// Mock the request utilities
jest.mock('@/lib/utils/request');

const mockRequest = request as jest.MockedFunction<typeof request>;
const mockRequestWithRetry = requestWithRetry as jest.MockedFunction<typeof requestWithRetry>;

describe('fetchDotabuffTeam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDotabuffTeam', () => {
    it('should fetch and parse team data successfully', async () => {
      const mockTeamData = {
        id: '9517508',
        name: 'Maple Syrup',
        matches: [
          {
            matchId: '7936128769',
            result: 'lost' as const,
            duration: 2100,
            opponentName: 'Filthy Casuals',
            leagueId: '16435',
            startTime: 1725926427
          }
        ]
      };

      mockRequest.mockResolvedValue(mockTeamData);

      const result = await fetchDotabuffTeam('9517508');

      expect(result).toEqual(mockTeamData);
      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/teams/dotabuff-team-9517508.html'),
        false,
        60 * 60 * 6, // 6 hours
        'dotabuff:team:9517508'
      );
    });

    it('should throw error when request fails', async () => {
      mockRequest.mockResolvedValue(null);

      await expect(fetchDotabuffTeam('9517508')).rejects.toThrow(
        'Failed to fetch team data for team 9517508'
      );
    });

    it('should use force parameter when provided', async () => {
      const mockTeamData = { id: '9517508', name: 'Test Team', matches: [] };
      mockRequest.mockResolvedValue(mockTeamData);

      await fetchDotabuffTeam('9517508', true);

      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/teams/dotabuff-team-9517508.html'),
        true, // force parameter
        60 * 60 * 6,
        'dotabuff:team:9517508'
      );
    });
  });

  describe('fetchTeamFromDotabuff', () => {
    it('should fetch HTML from Dotabuff API', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(`
          <html>
            <head><title>Test Team - Dotabuff</title></head>
            <body>
              <div class="header-content-title">
                <h1>Test Team Matches</h1>
              </div>
            </body>
          </html>
        `)
      };

      mockRequestWithRetry.mockResolvedValue(mockResponse);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        const html = await fetcher();
        return parser(html);
      });

      await fetchDotabuffTeam('9517508');

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        'GET',
        'https://www.dotabuff.com/esports/teams/9517508/matches'
      );
    });

    it('should throw error when API response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };

      mockRequestWithRetry.mockResolvedValue(mockResponse);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        await fetcher();
        return null;
      });

      await expect(fetchDotabuffTeam('9517508')).rejects.toThrow(
        'Dotabuff API error: 404 Not Found'
      );
    });

    it('should throw error when fetch fails', async () => {
      mockRequestWithRetry.mockRejectedValue(new Error('Network error'));

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        await fetcher();
        return null;
      });

      await expect(fetchDotabuffTeam('9517508')).rejects.toThrow(
        'Failed to fetch Dotabuff team 9517508: Error: Network error'
      );
    });
  });

  describe('parseDotabuffTeamHtml', () => {
    it('should parse team name from header', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Maple Syrup Matches</h1>
            </div>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffTeam('9517508');

      expect(result).toEqual({
        id: '9517508',
        name: 'Maple Syrup',
        matches: []
      });
    });

    it('should parse team name from title when header is not available', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Team - Dotabuff</title></head>
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

      const result = await fetchDotabuffTeam('9517508');

      expect(result).toEqual({
        id: '9517508',
        name: 'Test Team',
        matches: []
      });
    });

    it('should throw error when team name cannot be parsed', async () => {
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

      await expect(fetchDotabuffTeam('9517508')).rejects.toThrow(
        'Could not parse team name from Dotabuff HTML'
      );
    });

    it('should parse matches from table rows', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Test Team Matches</h1>
            </div>
            <table class="table recent-esports-matches">
              <tbody>
                <tr>
                  <td><a href="/esports/leagues/16435-rd2l-season-33/">League</a></td>
                  <td><a href="/matches/7936128769">Lost Match</a></td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td><span class="team-text-full">Filthy Casuals</span></td>
                </tr>
                <tr>
                  <td><a href="/esports/leagues/16435-rd2l-season-33/">League</a></td>
                  <td><a href="/matches/7936128770">Won Match</a></td>
                  <td>45:12</td>
                  <td>45:12</td>
                  <td>45:12</td>
                  <td><span class="team-text-full">Another Team</span></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffTeam('9517508');

      expect(result).toEqual({
        id: '9517508',
        name: 'Test Team',
        matches: [
          {
            matchId: '7936128769',
            result: 'lost',
            duration: 2096, // 34:56 = 34*60 + 56 = 2096 seconds
            opponentName: 'Filthy Casuals',
            leagueId: '',
            startTime: 0 // No datetime attribute in test HTML
          },
          {
            matchId: '7936128770',
            result: 'won',
            duration: 2712, // 45:12 = 45*60 + 12 = 2712 seconds
            opponentName: 'Another Team',
            leagueId: '',
            startTime: 0
          }
        ]
      });
    });

    it('should handle matches with TBA duration', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Test Team Matches</h1>
            </div>
            <table class="table recent-esports-matches">
              <tbody>
                <tr>
                  <td><a href="/esports/leagues/16435-rd2l-season-33/">League</a></td>
                  <td><a href="/matches/7936128769">Lost Match</a></td>
                  <td>TBA</td>
                  <td>TBA</td>
                  <td>TBA</td>
                  <td><span class="team-text-full">Filthy Casuals</span></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffTeam('9517508');

      expect(result.matches[0].duration).toBe(0);
    });

    it('should handle matches with missing opponent name', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Test Team Matches</h1>
            </div>
            <table class="table recent-esports-matches">
              <tbody>
                <tr>
                  <td><a href="/esports/leagues/16435-rd2l-season-33/">League</a></td>
                  <td><a href="/matches/7936128769">Lost Match</a></td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffTeam('9517508');

      expect(result.matches[0].opponentName).toBe('');
    });

    it('should handle matches with missing league ID', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Test Team Matches</h1>
            </div>
            <table class="table recent-esports-matches">
              <tbody>
                <tr>
                  <td></td>
                  <td><a href="/matches/7936128769">Lost Match</a></td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td><span class="team-text-full">Filthy Casuals</span></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffTeam('9517508');

      expect(result.matches[0].leagueId).toBe('');
    });

    it('should handle matches with datetime attribute', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Test Team Matches</h1>
            </div>
            <table class="table recent-esports-matches">
              <tbody>
                <tr>
                  <td><a href="/esports/leagues/16435-rd2l-season-33/">League</a></td>
                  <td><a href="/matches/7936128769">Lost Match</a><time datetime="2024-09-10T00:40:27+00:00"></time></td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td><span class="team-text-full">Filthy Casuals</span></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffTeam('9517508');

      expect(result.matches[0].startTime).toBe(1725928827); // Unix timestamp for 2024-09-10T00:40:27+00:00
    });

    it('should skip invalid table rows', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="header-content-title">
              <h1>Test Team Matches</h1>
            </div>
            <table class="table recent-esports-matches">
              <tbody>
                <tr>
                  <td>Invalid row with too few cells</td>
                </tr>
                <tr>
                  <td><a href="/esports/leagues/16435-rd2l-season-33/">League</a></td>
                  <td><a href="/matches/7936128769">Lost Match</a></td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td>34:56</td>
                  <td><span class="team-text-full">Filthy Casuals</span></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(mockHtml);
      });

      const result = await fetchDotabuffTeam('9517508');

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchId).toBe('7936128769');
    });
  });
}); 