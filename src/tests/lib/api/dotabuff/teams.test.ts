/**
 * @jest-environment node
 */

import { fetchDotabuffTeam } from '@/lib/api/dotabuff/teams';
import { scrapeHtmlFromUrl } from '@/lib/utils/playwright';
import { request } from '@/lib/utils/request';

// Mock the request utilities
jest.mock('@/lib/utils/request');
jest.mock('@/lib/utils/playwright');

const mockRequest = request as jest.MockedFunction<typeof request>;
const mockScrapeHtmlFromUrl = scrapeHtmlFromUrl as jest.MockedFunction<typeof scrapeHtmlFromUrl>;

describe('fetchDotabuffTeam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDotabuffTeam', () => {
    it('should fetch and parse team data successfully', async () => {
      const mockTeamData = {
        id: '9517508',
        name: 'Maple Syrup',
        matches: {}
      };

      mockRequest.mockResolvedValue(mockTeamData);

      const result = await fetchDotabuffTeam('9517508');

      expect(result).toEqual(mockTeamData);
      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringMatching(/.*dotabuff-team-9517508\.html$/),
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
      const mockTeamData = { id: '9517508', name: 'Test Team', matches: {} };
      mockRequest.mockResolvedValue(mockTeamData);

      await fetchDotabuffTeam('9517508', true);

      expect(mockRequest).toHaveBeenCalledWith(
        'dotabuff',
        expect.any(Function),
        expect.any(Function),
        expect.stringMatching(/.*dotabuff-team-9517508\.html$/),
        true, // force parameter
        60 * 60 * 6,
        'dotabuff:team:9517508'
      );
    });
  });

  describe('fetchTeamFromDotabuff', () => {
    it('should fetch HTML from Dotabuff using Playwright', async () => {
      const mockHtml = `
        <html>
          <head><title>Test Team - Dotabuff</title></head>
          <body>
            <div class="header-content-title">
              <h1>Test Team Matches</h1>
            </div>
          </body>
        </html>
      `;

      mockScrapeHtmlFromUrl.mockResolvedValue(mockHtml);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        const html = await fetcher();
        return parser(html);
      });

      await fetchDotabuffTeam('9517508');

      expect(mockScrapeHtmlFromUrl).toHaveBeenCalledWith(
        'https://www.dotabuff.com/esports/teams/9517508/matches',
        'table.table'
      );
    });

    it('should throw error when Playwright scraping fails', async () => {
      mockScrapeHtmlFromUrl.mockRejectedValue(new Error('Playwright error'));

      mockRequest.mockImplementation(async (service, fetcher) => {
        await fetcher();
        return null;
      });

      await expect(fetchDotabuffTeam('9517508')).rejects.toThrow(
        'Failed to fetch Dotabuff team 9517508: Error: Playwright error'
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
        matches: {}
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
        matches: {}
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
            <table class="table table-striped recent-esports-matches">
              <tbody>
                <tr>
                  <td><a class="esports-league esports-link league-link" href="/esports/leagues/16435-rd2l-season-33"><span class="league-image"><img alt="RD2L Season 33" class="img-league img-avatar" src="https://riki.dotabuff.com/leagues/16435/banner.png" /></span></a></td>
                  <td><div><a class="lost" href="/matches/7936128769">Lost Match</a></div></td>
                  <td><div><a href="/esports/series/2584667">Series 2584667</a></div></td>
                  <td>34:56</td>
                  <td>Heroes</td>
                  <td class="cell-icons"><a class="esports-team esports-link team-link" href="/esports/teams/9517701-filthy-casuals"><span class="team-text team-text-full">Filthy Casuals</span></a></td>
                </tr>
                <tr>
                  <td><a class="esports-league esports-link league-link" href="/esports/leagues/16435-rd2l-season-33"><span class="league-image"><img alt="RD2L Season 33" class="img-league img-avatar" src="https://riki.dotabuff.com/leagues/16435/banner.png" /></span></a></td>
                  <td><div><a class="won" href="/matches/7936128770">Won Match</a></div></td>
                  <td><div><a href="/esports/series/2584668">Series 2584668</a></div></td>
                  <td>45:12</td>
                  <td>Heroes</td>
                  <td class="cell-icons"><a class="esports-team esports-link team-link" href="/esports/teams/9517702-another-team"><span class="team-text team-text-full">Another Team</span></a></td>
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
        matches: {
          7936128769: {
            matchId: 7936128769,
            result: 'lost',
            duration: 2096,
            opponentName: 'Filthy Casuals',
            leagueId: '16435',
            startTime: 0
          },
          7936128770: {
            matchId: 7936128770,
            result: 'won',
            duration: 2712,
            opponentName: 'Another Team',
            leagueId: '16435',
            startTime: 0
          }
        }
      });
    });
  });
}); 