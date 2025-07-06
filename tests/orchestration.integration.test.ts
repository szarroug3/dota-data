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
      
      expect([400, 404, 500]).toContain(response.status);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Cache Invalidation', () => {
    it('should handle cache invalidation requests', async () => {
      const url = `${BASE_URL}/api/cache/invalidate/teams`;
      
      const { response, data } = await makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      expect([200, 202]).toContain(response.status);
      
      if (response.status === 202) {
        expect(data).toHaveProperty('status', 'queued');
      } else if (response.status === 200) {
        expect(data).toHaveProperty('message');
      }
    });
  });
}); 