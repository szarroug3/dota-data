import request from 'supertest';
import { logWithTimestampToFile } from '../src/lib/server-logger';

describe('Dota Data API Integration (Teams/Leagues Full Coverage)', () => {
  const api = request('http://localhost:3000');

  // IDs for testing
  const unlikelyId = '9999999999'; // unlikely to exist in mock-data
  const likelyTeamId = '9517508'; // exists in mock-data
  const likelyLeagueId = '16435'; // exists in mock-data

  // Helper for polling
  async function pollPost(endpoint: string, body: any, times: number, intervalMs: number) {
    const results = [];
    for (let i = 0; i < times; i++) {
       
      const res = await api.post(endpoint).send(body);
      results.push({ status: res.status, body: res.body });
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return results;
  }
  async function pollGet(endpoint: string, times: number, intervalMs: number) {
    const results = [];
    for (let i = 0; i < times; i++) {
       
      const res = await api.get(endpoint);
      results.push({ status: res.status, body: res.body });
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return results;
  }

  // --- /api/teams/{id}/matches ---
  describe('/api/teams/{id}/matches', () => {
    const endpoint = (id: string) => `/api/teams/${id}/matches`;
    const leagueBody = (leagueId: string) => ({ leagueId });

    it('1. Missing data (should generate fake, 200 or 202)', async () => {
      const res = await api.post(endpoint(unlikelyId)).send(leagueBody(unlikelyId));
      logWithTimestampToFile('log', 'Teams/Missing:', res.status, res.body);
      expect([200, 202]).toContain(res.status);
      expect(res.body).toBeDefined();
    });
    it('2. Mock data (should return mock, 200)', async () => {
      const res = await api.post(endpoint(likelyTeamId)).send(leagueBody(likelyLeagueId));
      logWithTimestampToFile('log', 'Teams/Mock:', res.status, res.body);
      expect([200, 202]).toContain(res.status);
      expect(res.body).toBeDefined();
    });
    it('3. Cached data (should return cached, 200)', async () => {
      // First request to populate cache
      await api.post(endpoint(likelyTeamId)).send(leagueBody(likelyLeagueId));
      // Second request should hit cache
      const res = await api.post(endpoint(likelyTeamId)).send(leagueBody(likelyLeagueId));
      logWithTimestampToFile('log', 'Teams/Cached:', res.status, res.body);
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
    it('4. Polling (should eventually return 200 with data)', async () => {
      const pollResults = await pollPost(endpoint(likelyTeamId), leagueBody(likelyLeagueId), 5, 200);
      logWithTimestampToFile('log', 'Teams/Polling:', pollResults);
      expect(pollResults.length).toBe(5);
      // Should see at least one 200
      expect(pollResults.some(r => r.status === 200)).toBe(true);
    });
  });

  // --- /api/leagues/{id} ---
  describe('/api/leagues/{id}', () => {
    const endpoint = (id: string) => `/api/leagues/${id}`;

    it('1. Missing data (should generate fake, 200 or 202)', async () => {
      const res = await api.get(endpoint(unlikelyId));
      logWithTimestampToFile('log', 'Leagues/Missing:', res.status, res.body);
      expect([200, 202]).toContain(res.status);
      expect(res.body).toBeDefined();
    });
    it('2. Mock data (should return mock, 200)', async () => {
      const res = await api.get(endpoint(likelyLeagueId));
      logWithTimestampToFile('log', 'Leagues/Mock:', res.status, res.body);
      expect([200, 202]).toContain(res.status);
      expect(res.body).toBeDefined();
    });
    it('3. Cached data (should return cached, 200)', async () => {
      // First request to populate cache
      await api.get(endpoint(likelyLeagueId));
      // Second request should hit cache
      const res = await api.get(endpoint(likelyLeagueId));
      logWithTimestampToFile('log', 'Leagues/Cached:', res.status, res.body);
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
    it('4. Polling (should eventually return 200 with data)', async () => {
      const pollResults = await pollGet(endpoint(likelyLeagueId), 5, 200);
      logWithTimestampToFile('log', 'Leagues/Polling:', pollResults);
      expect(pollResults.length).toBe(5);
      // Should see at least one 200
      expect(pollResults.some(r => r.status === 200)).toBe(true);
    });
  });
}); 