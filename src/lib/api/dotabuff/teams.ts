import * as path from 'path';

import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

import { scrapeHtmlFromUrl } from '@/lib/utils/playwright';
import { request } from '@/lib/utils/request';
import { DotabuffMatchSummary, DotabuffTeam } from '@/types/external-apis';

/**
 * Fetches a Dota 2 team profile from Dotabuff using the generic request function.
 * Dotabuff endpoint: https://www.dotabuff.com/esports/teams/{teamId}
 *
 * @param teamId The team ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns DotabuffTeam object
 */
export async function fetchDotabuffTeam(teamId: string, force = false): Promise<DotabuffTeam> {
  const cacheKey = `dotabuff:team:${teamId}`;
  const cacheTTL = 60 * 60 * 6; // 6 hours
  const mockFilename = path.join(process.cwd(), 'mock-data', 'teams', `dotabuff-team-${teamId}.html`);

  const result = await request<DotabuffTeam>(
    'dotabuff',
    () => fetchTeamFromDotabuff(teamId),
    (html: string) => parseDotabuffTeamHtml(html, teamId),
    mockFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error(`Failed to fetch team data for team ${teamId}`);
  }

  return result;
}

/**
 * Fetch team HTML from Dotabuff using Playwright
 */
async function fetchTeamFromDotabuff(teamId: string): Promise<string> {
  const url = `https://www.dotabuff.com/esports/teams/${teamId}/matches`;

  try {
    return await scrapeHtmlFromUrl(url, 'table.table');
  } catch (err) {
    throw new Error(`Failed to fetch Dotabuff team ${teamId}: ${err}`);
  }
}

/**
 * Extract match ID from result link
 */
function extractMatchId(resultCell: cheerio.Cheerio<Element>): string | null {
  const resultLink = resultCell.find('a').attr('href');
  if (!resultLink) return null;
  return resultLink.split('/').pop()?.split('-')[0] || null;
}

/**
 * Extract match result (won/lost) from result text
 */
function extractMatchResult(resultCell: cheerio.Cheerio<Element>): 'won' | 'lost' {
  const resultText = resultCell.find('a').text().toLowerCase();
  return resultText.includes('won') ? 'won' : 'lost';
}

/**
 * Extract opponent name from opponent cell
 */
function extractOpponentName(opponentCell: cheerio.Cheerio<Element>): string | null {
  const opponentElement = opponentCell.find('.team-text-full');
  return opponentElement.text().trim();
}

/**
 * Extract league ID from league cell
 */
function extractLeagueId(leagueCell: cheerio.Cheerio<Element>): string {
  const leagueLink = leagueCell.find('a').attr('href');
  return leagueLink?.split('/').pop()?.split('-')[0] || '';
}

/**
 * Extract match start time from result cell
 */
function extractStartTime(resultCell: cheerio.Cheerio<Element>): number {
  const dateElement = resultCell.find('time');
  const matchDate = dateElement.attr('datetime') || '';
  return matchDate ? new Date(matchDate).getTime() / 1000 : 0;
}

/**
 * Parse duration string into seconds
 */
function parseDuration(durationStr: cheerio.Cheerio<Element>): number {
  // Get the text content and remove any HTML elements
  const durationText = durationStr.text().trim();

  // Extract just the time part (e.g., "34:56" from "34:56<div class="bar...">")
  const timeMatch = durationText.match(/(\d+):(\d+)/);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1], 10);
    const seconds = parseInt(timeMatch[2], 10);
    return minutes * 60 + seconds;
  }

  // Handle "TBA" or other non-time formats
  if (durationText === 'TBA' || durationText.includes('–')) {
    return 0;
  }

  return 0;
}

/**
 * Parse a single match row from the Dotabuff team table
 */
function parseMatchRow($: cheerio.CheerioAPI, row: cheerio.Cheerio<Element>): DotabuffMatchSummary | null {
  const tds = row.find('td');
  if (tds.length < 6) return null;

  const matchId = extractMatchId($(tds[1])) || '';
  const result = extractMatchResult($(tds[1]));
  const duration = parseDuration($(tds[3]));
  const opponentName = extractOpponentName($(tds[5])) || '';
  const leagueId = extractLeagueId($(tds[0])) || '';
  const startTime = extractStartTime($(tds[1])) || 0;

  return {
    matchId: parseInt(matchId, 10),
    result,
    duration,
    opponentName,
    leagueId,
    startTime,
  };
}

/**
 * Parse Dotabuff team HTML into structured data
 */
function parseDotabuffTeamHtml(html: string, teamId: string): DotabuffTeam {
  const $ = cheerio.load(html);

  // Extract team name from the header
  const teamName =
    $('.header-content-title h1').first().text().replace('Matches', '').trim() ||
    $('title').text().split('-')[0].trim();

  if (!teamName) {
    throw new Error('Could not parse team name from Dotabuff HTML');
  }

  const matches: Record<number, DotabuffMatchSummary> = {};

  $('table.table.recent-esports-matches tbody tr').each((_, el) => {
    const match = parseMatchRow($, $(el));
    if (match) {
      matches[match.matchId] = match;
    }
  });

  return { id: teamId, name: teamName, matches };
}
