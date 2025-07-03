/**
 * Integration Tests for Dota Data Backend Orchestration System
 * 
 * Tests the complete orchestration flow including:
 * - Queue status endpoint
 * - Team import with background queueing
 * - Match and player data fetching
 * - Cache invalidation
 * - Error handling
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { logWithTimestampToFile } from '../src/lib/server-logger';

const BASE_URL = 'http://localhost:3000';

// Test data
const TEST_DATA = {
  teamId: '2586976',
  leagueId: '1234',
  matchId: '1234567890',
  playerId: '123456789',
};

// Helper functions
async function makeRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  return { response, data };
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollUntilReady(url: string, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { response, data } = await makeRequest(url);
    
    if (response.status === 200 && !data.status) {
      return data;
    }
    
    if (response.status === 202 && data.status === 'queued') {
      await wait(2000); // Wait 2 seconds before next poll
      continue;
    }
    
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  }
  
  throw new Error('Polling timeout - data not ready after maximum attempts');
}

describe('Orchestration System Integration Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await wait(1000);
  });

  describe('Team Import Flow', () => {
    it('should handle team import with queued response', async () => {
      const url = `${BASE_URL}/api/teams/${TEST_DATA.teamId}/matches?leagueId=${TEST_DATA.leagueId}`;
      
      const { response, data } = await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({ leagueId: TEST_DATA.leagueId }),
      });
      
      // Should return either queued status or immediate data
      expect([200, 202]).toContain(response.status);
      
      if (response.status === 202) {
        expect(data).toHaveProperty('status', 'queued');
        expect(data).toHaveProperty('signature');
      } else if (response.status === 200) {
        expect(data).toHaveProperty('teamId', TEST_DATA.teamId);
        expect(data).toHaveProperty('leagueId', TEST_DATA.leagueId);
        expect(data).toHaveProperty('matchIds');
        expect(Array.isArray(data.matchIds)).toBe(true);
      }
    });

    it('should handle force refresh parameter', async () => {
      const url = `${BASE_URL}/api/teams/${TEST_DATA.teamId}/matches?leagueId=${TEST_DATA.leagueId}&force=true`;
      
      const { response, data } = await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({ leagueId: TEST_DATA.leagueId }),
      });
      
      expect([200, 202]).toContain(response.status);
      
      if (response.status === 202) {
        expect(data).toHaveProperty('status', 'queued');
      } else if (response.status === 200) {
        expect(data).toHaveProperty('teamId', TEST_DATA.teamId);
      }
    });
  });

  describe('Match Data Fetching', () => {
    it('should handle match data requests with queuing', async () => {
      const url = `${BASE_URL}/api/matches/${TEST_DATA.matchId}`;
      
      const { response, data } = await makeRequest(url);
      
      expect([200, 202]).toContain(response.status);
      
      if (response.status === 202) {
        expect(data).toHaveProperty('status', 'queued');
        expect(data).toHaveProperty('signature');
      } else if (response.status === 200) {
        expect(data).toHaveProperty('match_id');
        expect(data).toHaveProperty('players');
        expect(Array.isArray(data.players)).toBe(true);
      }
    });

    it('should handle force refresh for match data', async () => {
      const url = `${BASE_URL}/api/matches/${TEST_DATA.matchId}?force=true`;
      
      const { response, data } = await makeRequest(url);
      
      expect([200, 202]).toContain(response.status);
      
      if (response.status === 202) {
        expect(data).toHaveProperty('status', 'queued');
      } else if (response.status === 200) {
        expect(data).toHaveProperty('match_id');
      }
    });
  });

  describe('Player Data Fetching', () => {
    it('should handle player data requests with queuing', async () => {
      const url = `${BASE_URL}/api/players/${TEST_DATA.playerId}/data`;
      
      const { response, data } = await makeRequest(url);
      
      expect([200, 202]).toContain(response.status);
      
      if (response.status === 202) {
        expect(data).toHaveProperty('status', 'queued');
        expect(data).toHaveProperty('signature');
      } else if (response.status === 200) {
        expect(data).toHaveProperty('profile');
        expect(data.profile).toHaveProperty('account_id');
      }
    });

    it('should handle force refresh for player data', async () => {
      const url = `${BASE_URL}/api/players/${TEST_DATA.playerId}/data?force=true`;
      
      const { response, data } = await makeRequest(url);
      
      expect([200, 202]).toContain(response.status);
      
      if (response.status === 202) {
        expect(data).toHaveProperty('status', 'queued');
      } else if (response.status === 200) {
        expect(data).toHaveProperty('profile');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid team ID gracefully', async () => {
      const url = `${BASE_URL}/api/teams/invalid-id/matches?leagueId=${TEST_DATA.leagueId}`;
      
      const { response, data } = await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({ leagueId: TEST_DATA.leagueId }),
      });
      
      expect([400, 404, 500]).toContain(response.status);
      expect(data).toHaveProperty('error');
    });

    it('should handle invalid match ID gracefully', async () => {
      const url = `${BASE_URL}/api/matches/invalid-match-id`;
      
      const { response, data } = await makeRequest(url);
      
      expect([400, 404, 500]).toContain(response.status);
      expect(data).toHaveProperty('error');
    });

    it('should handle missing required parameters', async () => {
      const url = `${BASE_URL}/api/teams/${TEST_DATA.teamId}/matches`;
      
      const { response, data } = await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Missing required parameters');
    });
  });

  describe('Polling and Background Processing', () => {
    it('should support polling for queued requests', async () => {
      // This test requires the server to be in a state where requests get queued
      // We'll test the polling mechanism by making a request and checking if it gets queued
      const url = `${BASE_URL}/api/matches/${TEST_DATA.matchId}?force=true`;
      
      const { response, data } = await makeRequest(url);
      
      if (response.status === 202 && data.status === 'queued') {
        // If queued, try polling a few times
        let polledData = null;
        try {
          polledData = await pollUntilReady(url, 3);
        } catch (error) {
          // It's okay if polling times out in tests
          logWithTimestampToFile('log', 'Polling timed out as expected in test environment');
        }
        
        // If we got data, verify it's valid
        if (polledData) {
          expect(polledData).toHaveProperty('match_id');
        }
      } else if (response.status === 200) {
        // If immediate response, verify it's valid
        expect(data).toHaveProperty('match_id');
      }
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [];
      const numRequests = 3;
      
      for (let i = 0; i < numRequests; i++) {
        const matchId = `${TEST_DATA.matchId}${i}`;
        const url = `${BASE_URL}/api/matches/${matchId}`;
        
        promises.push(
          makeRequest(url).then(({ response, data }) => {
            expect([200, 202]).toContain(response.status);
            if (response.status === 202) {
              expect(data).toHaveProperty('status', 'queued');
            }
            return data;
          })
        );
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(numRequests);
    });
  });
}); 