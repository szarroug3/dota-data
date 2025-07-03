import { shouldMockService, tryMock } from '@/lib/api';
import { fetchPage, isAlreadyQueuedResult } from '@/lib/api/shared';
import { cacheService } from '@/lib/cache-service';
import { generateFakeDotabuffLeagueHtml } from '@/lib/fake-data-generator';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getLeagueCacheFilename, getLeagueCacheKey } from '@/lib/utils/cache-keys';
import * as cheerio from 'cheerio';

export async function getLeagueName(leagueId: string, forceRefresh = false): Promise<{ leagueName: string } | { status: string; signature: string }> {
  const endpoint = `/esports/leagues/${leagueId}`;
  const cacheKey = getLeagueCacheKey(leagueId);
  const filename = getLeagueCacheFilename(leagueId);
  const LEAGUE_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

  logWithTimestampToFile('log', `[getLeagueName] Called for leagueId=${leagueId}, forceRefresh=${forceRefresh}`);

  // 1. Check cache for HTML
  if (!forceRefresh) {
    const cached = await cacheService.get<string>(cacheKey, filename, LEAGUE_TTL);
    if (cached) {
      logWithTimestampToFile('log', `[getLeagueName] Cache hit for key: ${cacheKey}`);
      return parseLeagueNameHtml(cached, leagueId);
    }
    logWithTimestampToFile('log', `[getLeagueName] Cache miss for key: ${cacheKey}`);
  }

  // 2. Queue the fetch for the league page
  logWithTimestampToFile('log', `[getLeagueName] Queueing request for key: ${cacheKey}`);
  const queueResult: string | { leagueName: string } | { status: string; signature: string } = await cacheService.queueRequest(
    'dotabuff',
    cacheKey,
    async () => {
      logWithTimestampToFile('log', `[getLeagueName] Processing job for key: ${cacheKey}`);
      // 1. Try mock data if available
      const mockRes = await tryMock('dotabuff', filename);
      if (mockRes) {
        const html = await mockRes.text();
        // Only cache the raw HTML
        await cacheService.set('dotabuff', cacheKey, html, LEAGUE_TTL, filename);
        logWithTimestampToFile('log', `[getLeagueName] Mock data processed and cached for key: ${cacheKey}`);
        return parseLeagueNameHtml(html, leagueId);
      }
      // 2. Check if we should use mock service
      if (shouldMockService('dotabuff')) {
        const html = generateFakeDotabuffLeagueHtml(leagueId, filename);
        await cacheService.set('dotabuff', cacheKey, html, LEAGUE_TTL, filename);
        logWithTimestampToFile('log', `[getLeagueName] Fake data processed and cached for key: ${cacheKey}`);
        return parseLeagueNameHtml(html, leagueId);
      }
      // 3. Fetch real data
      const html = await fetchPage('dotabuff', cacheKey, endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });
      await cacheService.set('dotabuff', cacheKey, html, LEAGUE_TTL, filename);
      logWithTimestampToFile('log', `[getLeagueName] Real data fetched and cached for key: ${cacheKey}`);
      // Always parse the HTML after retrieval
      return parseLeagueNameHtml(html, leagueId);
    },
    LEAGUE_TTL,
    filename,
    true
  );

  logWithTimestampToFile('log', `[getLeagueName] queueResult for key: ${cacheKey}:`, queueResult);
  if (isAlreadyQueuedResult(queueResult)) {
    logWithTimestampToFile('log', `[getLeagueName] Already queued for key: ${cacheKey}`);
    return { status: 'queued', signature: queueResult.signature };
  }

  logWithTimestampToFile('log', `[getLeagueName] Returning result for key: ${cacheKey}`);
  return queueResult;
}

function parseLeagueNameHtml(html: string, leagueId: string) {
  const $ = cheerio.load(html);
  const img = $('img.img-league.img-avatar').first();
  let leagueName = '';
  if (img.length) {
    leagueName = img.attr('alt') || '';
  }
  if (!leagueName) {
    leagueName = leagueId;
  }
  return { leagueName };
} 