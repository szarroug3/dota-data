import {
  checkOpenDotaParseStatus,
  fetchOpenDotaMatch,
  fetchParsedOpenDotaMatch,
  initiateOpenDotaMatchParse,
  parseOpenDotaMatchWithJobPolling,
  parseOpenDotaMatchWithPolling
} from '@/lib/api/opendota/matches';
import { request, requestWithRetry } from '@/lib/utils/request';

// Mock the request utilities
jest.mock('@/lib/utils/request', () => ({
  request: jest.fn(),
  requestWithRetry: jest.fn()
}));


describe('OpenDota Matches API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchOpenDotaMatch', () => {
    it('should fetch match data successfully', async () => {
      const mockMatch = {
        match_id: 1234567890,
        radiant_win: true,
        duration: 2400,
        start_time: 1640995200,
        players: []
      };

      jest.mocked(request).mockResolvedValue(mockMatch);

      const result = await fetchOpenDotaMatch('1234567890', false);

      expect(result).toEqual(mockMatch);
      expect(request).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.any(String),
        false,
        60 * 60 * 24 * 14,
        'opendota:match:1234567890'
      );
    });
  });

  describe('initiateOpenDotaMatchParse', () => {
    it('should initiate parse request successfully', async () => {
      const mockParseResponse = { jobId: 'test-job-123' };

      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify(mockParseResponse))
      } as Response);

      const result = await initiateOpenDotaMatchParse('1234567890');

      expect(result).toEqual(mockParseResponse);
      expect(requestWithRetry).toHaveBeenCalledWith('POST', expect.stringContaining('/request/1234567890'));
    });

    it('should handle parse request failure', async () => {
      
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(initiateOpenDotaMatchParse('1234567890'))
        .rejects.toThrow('Match not found');
    });

    it('should handle invalid parse response', async () => {
      
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}') // Empty response without jobId
      } as Response);

      await expect(initiateOpenDotaMatchParse('1234567890'))
        .rejects.toThrow('Invalid parse response for match 1234567890');
    });
  });

  describe('checkOpenDotaParseStatus', () => {
    it('should check parse status successfully', async () => {
      const mockStatusResponse = { status: 'pending' };

      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify(mockStatusResponse))
      } as Response);

      const result = await checkOpenDotaParseStatus('test-job-123');

      expect(result).toEqual(mockStatusResponse);
      expect(requestWithRetry).toHaveBeenCalledWith('GET', expect.stringContaining('/request/test-job-123'));
    });

    it('should handle parse status failure', async () => {
      
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(checkOpenDotaParseStatus('test-job-123'))
        .rejects.toThrow('Parse job not found');
    });
  });

  describe('fetchParsedOpenDotaMatch', () => {
    it('should fetch parsed match data successfully', async () => {
      const mockParsedMatch = {
        match_id: 1234567890,
        radiant_win: true,
        duration: 2400,
        start_time: 1640995200,
        players: [],
        teamfights: [{ start: 600, end: 900, deaths: 3, players: [] }],
        picks_bans: [{ is_pick: true, hero_id: 1, team: 0, order: 0 }]
      };

      jest.mocked(request).mockResolvedValue(mockParsedMatch);

      const result = await fetchParsedOpenDotaMatch('1234567890', true);

      expect(result).toEqual(mockParsedMatch);
      expect(request).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.any(String),
        true,
        60 * 60 * 24 * 14,
        'opendota:parsed-match:1234567890'
      );
    });
  });

  describe('parseOpenDotaMatchWithJobPolling', () => {
    it('should complete parse workflow successfully', async () => {
      const mockParsedMatch = {
        match_id: 1234567890,
        radiant_win: true,
        duration: 2400,
        start_time: 1640995200,
        players: [],
        teamfights: [{ start: 600, end: 900, deaths: 3, players: [] }],
        picks_bans: [{ is_pick: true, hero_id: 1, team: 0, order: 0 }]
      };

      // Mock the initiate parse request (POST to /request/{matchId})
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ jobId: 'test-job-123' }))
      } as Response);

      // Mock the status check (GET to /request/{jobId}) - returns empty object when complete
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}')
      } as Response);

      // Mock the fetch parsed match data
      jest.mocked(request).mockResolvedValue(mockParsedMatch);

      const result = await parseOpenDotaMatchWithJobPolling('1234567890', 5000);

      expect(result).toEqual(mockParsedMatch);
      expect(requestWithRetry).toHaveBeenCalledTimes(2);
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('should handle parse initiation failure', async () => {
      
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(parseOpenDotaMatchWithJobPolling('1234567890', 5000))
        .rejects.toThrow('Match not found');
    });

    it('should timeout if parsing takes too long', async () => {
      
      // Mock successful parse initiation
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ jobId: 'test-job-123' }))
      } as Response);

      // Mock status check that returns pending status (not empty object)
      jest.mocked(requestWithRetry).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ status: 'pending' }))
      } as Response);

      await expect(parseOpenDotaMatchWithJobPolling('1234567890', 100))
        .rejects.toThrow('Match parsing timed out');
    });

    it('should continue polling when parse job not found during polling', async () => {
      
      // Mock successful parse initiation
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify({ jobId: 'test-job-123' }))
      } as Response);

      // Mock status check that returns job not found (should continue polling)
      jest.mocked(requestWithRetry).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(parseOpenDotaMatchWithJobPolling('1234567890', 100))
        .rejects.toThrow('Match parsing timed out');
    });
  });

  describe('parseOpenDotaMatchWithPolling', () => {
    it('should initiate parse and return parsed match data', async () => {
      const mockParsedMatch = {
        match_id: 1234567890,
        radiant_win: true,
        duration: 2400,
        start_time: 1640995200,
        players: [],
        teamfights: [{ start: 600, end: 900, deaths: 3, players: [] }],
        picks_bans: [{ is_pick: true, hero_id: 1, team: 0, order: 0 }]
      };

      // Mock the parse request (POST to /request/{matchId})
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);

      // Mock the match fetch (GET to /matches/{matchId})
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify(mockParsedMatch))
      } as Response);

      const result = await parseOpenDotaMatchWithPolling('1234567890', 5000);

      expect(result).toEqual(mockParsedMatch);
      expect(requestWithRetry).toHaveBeenCalledTimes(2);
    });

    it('should handle parse request failure', async () => {
      
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(parseOpenDotaMatchWithPolling('1234567890', 5000))
        .rejects.toThrow('Match not found');
    });

    it('should handle rate limiting', async () => {
      
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      } as Response);

      await expect(parseOpenDotaMatchWithPolling('1234567890', 5000))
        .rejects.toThrow('Rate limited');
    });

    it('should timeout if parsing takes too long', async () => {
      
      // Mock successful parse request
      jest.mocked(requestWithRetry).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);

      // Mock match fetch that returns unparsed data (no teamfights, picks_bans, etc.)
      const unparsedMatch = {
        match_id: 1234567890,
        radiant_win: true,
        duration: 2400,
        start_time: 1640995200,
        players: []
        // No teamfights, picks_bans, or draft_timings
      };

      jest.mocked(requestWithRetry).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify(unparsedMatch))
      } as Response);

      await expect(parseOpenDotaMatchWithPolling('1234567890', 100))
        .rejects.toThrow('Match parsing timed out');
    });
  });
}); 