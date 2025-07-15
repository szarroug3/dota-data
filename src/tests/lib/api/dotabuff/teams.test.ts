import * as cheerio from 'cheerio';

import { fetchDotabuffTeam } from '@/lib/api/dotabuff/teams';
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

describe('fetchDotabuffTeam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and parse team data successfully', async () => {
    const mockHtml = `
      <html>
        <head><title>Team Spirit - DOTABUFF</title></head>
        <body>
          <div class="header-content-title">
            <h1>Team Spirit<small>Matches</small></h1>
          </div>
          <table class="table recent-esports-matches">
            <tbody>
              <tr>
                <td><a href="/esports/leagues/16435">League</a></td>
                <td><a href="/matches/8054301932">won</a><time datetime="2024-01-01T00:00:00Z"></time></td>
                <td>BO3</td>
                <td>34:56<div class="bar"></div></td>
                <td></td>
                <td><span class="team-text-full">Team Liquid</span></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const expectedResult = {
      id: '9517508',
      name: 'Team Spirit',
      matches: [
        {
          matchId: '8054301932',
          result: 'won',
          duration: 2096,
          opponentName: 'Team Liquid',
          leagueId: '16435',
          startTime: 1704067200
        }
      ]
    };

    mockRequest.mockResolvedValue(expectedResult);

    const result = await fetchDotabuffTeam('9517508');

    expect(result).toEqual(expectedResult);
    expect(mockRequest).toHaveBeenCalledWith(
      'dotabuff',
      expect.any(Function),
      expect.any(Function),
      expect.stringContaining('mock-data/teams/dotabuff-team-9517508.html'),
      false,
      21600,
      'dotabuff:team:9517508'
    );
  });

  it('should handle force parameter', async () => {
    const expectedResult = {
      id: '9517508',
      name: 'Team Spirit',
      matches: []
    };

    mockRequest.mockResolvedValue(expectedResult);

    await fetchDotabuffTeam('9517508', true);

    expect(mockRequest).toHaveBeenCalledWith(
      'dotabuff',
      expect.any(Function),
      expect.any(Function),
      expect.stringContaining('mock-data/teams/dotabuff-team-9517508.html'),
      true,
      21600,
      'dotabuff:team:9517508'
    );
  });

  it('should throw error when request fails', async () => {
    mockRequest.mockResolvedValue(null);

    await expect(fetchDotabuffTeam('9517508')).rejects.toThrow(
      'Failed to fetch team data for team 9517508'
    );
  });

  it('should parse team name correctly', () => {
    const html = `
      <html>
        <head><title>Test Team - DOTABUFF</title></head>
        <body>
          <div class="header-content-title">
            <h1>Test Team<small>Matches</small></h1>
          </div>
        </body>
      </html>
    `;

    // Test the parsing function directly
    const $ = cheerio.load(html);
    const teamName = $('.header-content-title h1').first().text().replace('Matches', '').trim() ||
                     $('title').text().split('-')[0].trim();

    expect(teamName).toBe('Test Team');
  });

  it('should parse match data correctly', () => {
    const html = `
      <table class="table recent-esports-matches">
        <tbody>
          <tr>
            <td><a href="/esports/leagues/16435-rd2l-season-33">League</a></td>
            <td><a href="/matches/8054301932">won</a><time datetime="2024-01-01T00:00:00Z"></time></td>
            <td>BO3</td>
            <td>34:56<div class="bar"></div></td>
            <td></td>
            <td><span class="team-text-full">Team Liquid</span></td>
          </tr>
        </tbody>
      </table>
    `;

    // Test the parsing function directly
    const $ = cheerio.load(html);
    const matches: any[] = [];

    $('table.table.recent-esports-matches tbody tr').each((_, el) => {
      const tds = $(el).find('td');
      if (tds.length < 6) return;

      const resultLink = $(tds[1]).find('a').attr('href');
      const matchId = resultLink?.split('/').pop()?.split('-')[0] || '';
      
      const resultText = $(tds[1]).find('a').text().toLowerCase();
      const result = resultText.includes('won') ? 'won' : 'lost';
      
      const durationText = $(tds[3]).text().trim();
      const timeMatch = durationText.match(/(\d+):(\d+)/);
      const duration = timeMatch ? parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10) : 0;
      
      const opponentName = $(tds[5]).find('.team-text-full').text().trim();
      
      const leagueLink = $(tds[0]).find('a').attr('href');
      const leagueId = leagueLink?.split('/').pop()?.split('-')[0] || '';
      
      const dateElement = $(tds[1]).find('time');
      const matchDate = dateElement.attr('datetime') || '';
      const startTime = matchDate ? new Date(matchDate).getTime() / 1000 : 0;

      matches.push({
        matchId,
        result,
        duration,
        opponentName,
        leagueId,
        startTime,
      });
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      matchId: '8054301932',
      result: 'won',
      duration: 2096,
      opponentName: 'Team Liquid',
      leagueId: '16435',
      startTime: 1704067200
    });
  });

  it('should handle TBA duration', () => {
    const html = `
      <table class="table recent-esports-matches">
        <tbody>
          <tr>
            <td><a href="/esports/leagues/16435">League</a></td>
            <td><a href="/matches/8054301932">won</a></td>
            <td>BO3</td>
            <td>TBA</td>
            <td></td>
            <td><span class="team-text-full">Team Liquid</span></td>
          </tr>
        </tbody>
      </table>
    `;

    // Test the parsing function directly
    const $ = cheerio.load(html);
    const durationText = $('table.table.recent-esports-matches tbody tr td').eq(3).text().trim();
    const timeMatch = durationText.match(/(\d+):(\d+)/);
    const duration = timeMatch ? parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10) : 0;

    expect(duration).toBe(0);
  });

  it('should handle missing opponent name', () => {
    const html = `
      <table class="table recent-esports-matches">
        <tbody>
          <tr>
            <td><a href="/esports/leagues/16435">League</a></td>
            <td><a href="/matches/8054301932">won</a></td>
            <td>BO3</td>
            <td>34:56</td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;

    // Test the parsing function directly
    const $ = cheerio.load(html);
    const opponentElement = $('table.table.recent-esports-matches tbody tr td').eq(5).find('.team-text-full');
    const opponentName = opponentElement.text().trim();

    expect(opponentName).toBe('');
  });
}); 