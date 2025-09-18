import path from 'path';

import { request, requestWithRetry } from '@/lib/utils/request';
import { OpenDotaMatch } from '@/types/external-apis';

/**
 * Fetches a Dota 2 match from OpenDota using the generic request function.
 * OpenDota endpoint: https://api.opendota.com/api/matches/{matchId}
 *
 * @param matchId The match ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns OpenDotaMatch object
 */
export async function fetchOpenDotaMatch(matchId: string, force = false): Promise<OpenDotaMatch> {
  const cacheKey = `opendota:match:${matchId}`;
  const cacheTTL = 60 * 60 * 24 * 14; // 14 days
  const mockFilename = path.join(process.cwd(), 'mock-data', 'matches', `match-${matchId}.json`);

  const result = await request<OpenDotaMatch>(
    'opendota',
    () => fetchMatchFromOpenDota(matchId),
    (data: string) => parseOpenDotaMatchData(data),
    mockFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error(`Failed to fetch match data for match ${matchId}`);
  }

  return result;
}

/**
 * Initiates match parsing on OpenDota using requestWithRetry.
 * OpenDota endpoint: https://api.opendota.com/api/request/{match_id}
 *
 * @param matchId The match ID to parse
 * @returns Parse request response with jobId
 */
export async function initiateOpenDotaMatchParse(matchId: string): Promise<{ jobId: string }> {
  try {
    const response = await initiateParseRequest(matchId);
    type ParseResponse = { job: { jobId: number } };
    const parsed = JSON.parse(response) as ParseResponse;
    const jobIdNum = parsed?.job?.jobId;
    const jobId = typeof jobIdNum === 'number' ? String(jobIdNum) : null;
    if (!jobId) {
      throw new Error(`Invalid parse response for match ${matchId}`);
    }
    return { jobId };
  } catch (err) {
    throw new Error(`Failed to initiate parse request for match ${matchId}: ${err}`);
  }
}

/**
 * Checks the status of a parse request using requestWithRetry.
 * OpenDota endpoint: https://api.opendota.com/api/request/{jobId}
 *
 * @param jobId The job ID to check
 * @returns Parse request status
 */
export async function checkOpenDotaParseStatus(
  jobId: string,
): Promise<Record<string, string | number | boolean | null> | null> {
  try {
    const response = await checkParseStatus(jobId);
    if (!response || response.trim().length === 0) return null;
    const parsed = JSON.parse(response);
    return parsed === null ? null : (parsed as Record<string, string | number | boolean | null>);
  } catch (err) {
    throw new Error(`Failed to check parse status for job ${jobId}: ${err}`);
  }
}

/**
 * Complete match parsing workflow: initiate parse, poll for completion, and fetch parsed data.
 * Uses the correct OpenDota API endpoints and follows the request.ts architecture.
 *
 * @param matchId The match ID to parse
 * @param timeout Maximum time to wait for parsing completion (in milliseconds)
 * @returns Parsed match data
 */
export async function parseOpenDotaMatchWithJobPolling(matchId: string, timeout = 60000): Promise<OpenDotaMatch> {
  // Step 1: Initiate parse request and get jobId
  const parseResponse = await initiateOpenDotaMatchParse(matchId);
  const { jobId } = parseResponse;

  // Step 2: Poll for completion using jobId
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  while (Date.now() - startTime < timeout) {
    try {
      // Check parse status using jobId
      const statusResponse = await checkOpenDotaParseStatus(jobId);
      console.log(statusResponse);

      // If parsing is complete, fetch the parsed match data
      if (isParseComplete(statusResponse)) {
        return await fetchParsedOpenDotaMatch(matchId, true); // Force fresh data
      }

      // Schedule next poll using next_attempt_time if provided
      const nextAttemptIso = (statusResponse as { next_attempt_time?: string }).next_attempt_time;
      if (typeof nextAttemptIso === 'string') {
        const target = Date.parse(nextAttemptIso);
        if (!Number.isNaN(target)) {
          const now = Date.now();
          const delta = target - now;
          const minDelay = 250;
          const maxDelay = 10000;
          const delayMs = Math.min(Math.max(delta, minDelay), maxDelay);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }
    } catch (error) {
      // If the job is not found or not yet complete, continue polling
      if (error instanceof Error && error.message.includes('Parse job not found')) {
        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }
      // For other errors, re-throw
      throw error;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Match parsing timed out');
}

/**
 * Fetches parsed match data from OpenDota using the generic request function.
 * This is used after initiating a parse to check if parsing is complete.
 * OpenDota endpoint: https://api.opendota.com/api/matches/{matchId}
 *
 * @param matchId The match ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns OpenDotaMatch object
 */
export async function fetchParsedOpenDotaMatch(matchId: string, force = false): Promise<OpenDotaMatch> {
  const cacheKey = `opendota:match:${matchId}`;
  const cacheTTL = 60 * 60 * 24 * 14; // 14 days
  const mockFilename = path.join(process.cwd(), 'mock-data', 'matches', `parsed-match-${matchId}.json`);

  const result = await request<OpenDotaMatch>(
    'opendota',
    () => fetchMatchFromOpenDota(matchId),
    (data: string) => parseOpenDotaMatchData(data),
    mockFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error(`Failed to fetch parsed match data for match ${matchId}`);
  }

  return result;
}

/**
 * Initiates match parsing on OpenDota and polls for completion.
 * OpenDota endpoint: https://api.opendota.com/api/request/{matchId}
 *
 * @param matchId The match ID to parse
 * @param timeout Maximum time to wait for parsing completion (in milliseconds)
 * @returns Parsed match data
 */
export async function parseOpenDotaMatchWithPolling(matchId: string, timeout = 60000): Promise<OpenDotaMatch> {
  const baseUrl = process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api';
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  try {
    // Step 1: Initiate parse request
    const parseUrl = `${baseUrl}/request/${matchId}`;
    const parseResponse = await requestWithRetry('POST', parseUrl);

    if (!parseResponse.ok) {
      if (parseResponse.status === 404) {
        throw new Error('Match not found');
      }
      if (parseResponse.status === 429) {
        throw new Error('Rate limited');
      }
      throw new Error(`OpenDota parse API error: ${parseResponse.status} ${parseResponse.statusText}`);
    }

    // Step 2: Poll for completion
    while (Date.now() - startTime < timeout) {
      // Check if match is now available (parsed)
      const matchUrl = `${baseUrl}/matches/${matchId}`;
      const matchResponse = await requestWithRetry('GET', matchUrl);

      if (matchResponse.ok) {
        const matchData = await matchResponse.text();
        const parsedMatch = parseOpenDotaMatchData(matchData);

        // Check if the match has been parsed (has detailed data)
        if (isMatchParsed(parsedMatch)) {
          return parsedMatch;
        }
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Match parsing timed out');
  } catch (err) {
    throw new Error(`Failed to parse match from OpenDota: ${err}`);
  }
}

/**
 * Fetch match from OpenDota API
 */
async function fetchMatchFromOpenDota(matchId: string): Promise<string> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/matches/${matchId}`;

  try {
    const response = await requestWithRetry('GET', url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Match not found');
      }
      throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (err) {
    throw new Error(`Failed to fetch match from OpenDota: ${err}`);
  }
}

/**
 * Initiate parse request to OpenDota API
 */
async function initiateParseRequest(matchId: string): Promise<string> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/request/${matchId}`;

  try {
    const response = await requestWithRetry('POST', url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Match not found');
      }
      if (response.status === 429) {
        throw new Error('Rate limited');
      }
      throw new Error(`OpenDota parse API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (err) {
    throw new Error(`Failed to initiate parse request to OpenDota: ${err}`);
  }
}

/**
 * Check parse request status from OpenDota API
 */
async function checkParseStatus(jobId: string): Promise<string> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/request/${jobId}`;

  try {
    const response = await requestWithRetry('GET', url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Parse job not found');
      }
      if (response.status === 429) {
        throw new Error('Rate limited');
      }
      throw new Error(`OpenDota parse status API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (err) {
    throw new Error(`Failed to check parse status from OpenDota: ${err}`);
  }
}

/**
 * Parse OpenDota match data
 */
function parseOpenDotaMatchData(data: string): OpenDotaMatch {
  try {
    const match = JSON.parse(data) as OpenDotaMatch;
    return match;
  } catch (err) {
    throw new Error(`Failed to parse OpenDota match data: ${err}`);
  }
}

/**
 * Check if a match has been parsed (has detailed data)
 */
function isMatchParsed(match: OpenDotaMatch): boolean {
  // A match is considered parsed if it has detailed data like teamfights, draft_timings, etc.
  return (
    !!(match.teamfights && match.teamfights.length > 0) ||
    !!(match.draft_timings && match.draft_timings.length > 0) ||
    !!(match.picks_bans && match.picks_bans.length > 0)
  );
}

/**
 * Check if a parse request is complete based on the status response
 */
function isParseComplete(statusResponse: Record<string, string | number | boolean | null> | null): boolean {
  // If OpenDota returns no data/null, job is complete
  if (statusResponse === null) return true;
  // If the job still exists (has jobId/id), it's not complete
  if (
    statusResponse &&
    (Object.prototype.hasOwnProperty.call(statusResponse, 'jobId') ||
      Object.prototype.hasOwnProperty.call(statusResponse, 'id'))
  ) {
    return false;
  }
  // OpenDota returns an empty object {} when parsing is complete
  return typeof statusResponse === 'object' && statusResponse !== null && Object.keys(statusResponse).length === 0;
}
