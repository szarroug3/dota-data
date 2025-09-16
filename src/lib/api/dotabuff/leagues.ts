import path from 'path';

import * as cheerio from 'cheerio';

import { scrapeHtmlFromUrl } from '@/lib/utils/playwright';
import { request } from '@/lib/utils/request';
import { DotabuffLeague } from '@/types/external-apis';

/**
 * Fetches a Dota 2 league profile from Dotabuff, with cache, rate limiting, and mock mode support.
 * Dotabuff endpoint: https://www.dotabuff.com/esports/leagues/{leagueId}
 *
 * @param leagueId The league ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns DotabuffLeague object
 * @throws Error if data cannot be loaded from any source
 */
export async function fetchDotabuffLeague(leagueId: string, force = false): Promise<DotabuffLeague> {
  const cacheKey = `dotabuff:league:${leagueId}`;
  const cacheTTL = 60 * 60 * 24 * 7; // 7 days
  const mockFilename = path.join(process.cwd(), 'mock-data', 'leagues', `dotabuff-league-${leagueId}.html`);

  const result = await request<DotabuffLeague>(
    'dotabuff',
    () => fetchLeagueFromDotabuff(leagueId),
    (html: string) => parseDotabuffLeagueHtml(html, leagueId),
    mockFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error(`Failed to fetch league data for league ${leagueId}`);
  }

  return result;
}

async function fetchLeagueFromDotabuff(leagueId: string): Promise<string> {
  const url = `https://www.dotabuff.com/esports/leagues/${leagueId}`;
  return await scrapeHtmlFromUrl(url, '.header-content-title');
}

function parseDotabuffLeagueHtml(html: string, leagueId: string): DotabuffLeague {
  const $ = cheerio.load(html);

  // Get the h1 element and extract text excluding the small element
  const h1Element = $('.header-content-title h1').first();
  h1Element.find('small').remove(); // Remove the small element
  const name = h1Element.text().trim() || $('title').text().split('-')[0].trim();

  if (!name) {
    throw new Error('Could not parse league name from Dotabuff HTML');
  }

  return { id: leagueId, name };
}
