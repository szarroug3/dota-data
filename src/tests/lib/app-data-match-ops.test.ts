import {
  editManualMatchToTeam,
  addManualMatchToTeam,
  removeManualMatchFromTeam,
} from '@/frontend/lib/app-data-match-ops';
import type { Match, Team } from '@/frontend/lib/app-data-types';
import type { StoredMatchData, StoredPlayerData } from '@/frontend/lib/storage-manager';

// Mock the AppData context interface
const createMockAppData = () => ({
  _teams: new Map<string, Team>(),
  updateTeam: jest.fn(),
  saveToStorage: jest.fn(),
  loadMatch: jest.fn(),
  updateTeamMatchParticipation: jest.fn(),
});

const createTeam = (overrides: Partial<Team> = {}): Team => ({
  id: '123-456',
  teamId: 123,
  leagueId: 456,
  name: 'Test Team',
  leagueName: 'Test League',
  timeAdded: Date.now(),
  matches: new Map<number, StoredMatchData>(),
  players: new Map<number, StoredPlayerData>(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isLoading: false,
  highPerformingHeroes: new Set<string>(),
  ...overrides,
});

describe('app-data-match-ops', () => {
  describe('editManualMatchToTeam', () => {
    it('should replace the manual match and update participation', async () => {
      const mockAppData = createMockAppData();
      const teamKey = '123-456';
      const oldMatchId = 1001;
      const newMatchId = 1002;

      // Setup existing team with a manual match
      const existingTeam = createTeam({
        matches: new Map<number, StoredMatchData>([
          [
            oldMatchId,
            {
              matchId: oldMatchId,
              result: 'won',
              opponentName: 'Enemy Team',
              side: 'radiant',
              duration: 1800,
              date: '2023-01-01T00:00:00Z',
              pickOrder: 'unknown',
              heroes: [],
              isManual: true,
              isHidden: false,
            },
          ],
        ]),
      });

      mockAppData._teams.set(teamKey, existingTeam);

      const mockMatch: Match = {
        id: newMatchId,
        date: '2023-01-02T00:00:00Z',
        duration: 2000,
        radiant: { id: 1, name: 'Team A' },
        dire: { id: 2, name: 'Team B' },
        draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
        players: { radiant: [], dire: [] },
        statistics: {
          radiantScore: 1,
          direScore: 0,
          goldAdvantage: { times: [], radiantGold: [], direGold: [] },
          experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
        },
        events: [],
        result: 'radiant',
        isLoading: false,
        error: undefined,
      };

      mockAppData.loadMatch.mockResolvedValueOnce(mockMatch);

      const result = await editManualMatchToTeam(mockAppData, oldMatchId, newMatchId, teamKey, 'dire');

      expect(result).toBe(mockMatch);
      expect(mockAppData.loadMatch).toHaveBeenCalledWith(newMatchId);

      expect(mockAppData.updateTeam).toHaveBeenCalledWith(teamKey, {
        matches: expect.any(Map),
      });

      const updatedMatches = mockAppData.updateTeam.mock.calls[0][1].matches;
      expect(updatedMatches.has(oldMatchId)).toBe(false);
      expect(updatedMatches.has(newMatchId)).toBe(true);

      expect(mockAppData.updateTeamMatchParticipation).toHaveBeenCalledWith(teamKey, [newMatchId]);
    });

    it('should throw error when match loading fails', async () => {
      const mockAppData = createMockAppData();
      const teamKey = '123-456';
      const oldMatchId = 1001;
      const newMatchId = 1002;
      const userSelectedSide = 'radiant' as const;

      const mockTeam = createTeam({
        matches: new Map<number, StoredMatchData>([
          [
            oldMatchId,
            {
              matchId: oldMatchId,
              result: 'won',
              opponentName: 'Old Opponent',
              side: 'radiant',
              duration: 1800,
              date: '2023-01-01T00:00:00Z',
              pickOrder: 'first',
              heroes: [],
              isManual: true,
              isHidden: false,
            },
          ],
        ]),
      });

      mockAppData._teams.set(teamKey, mockTeam);

      // Mock loadMatch to fail (return null)
      mockAppData.loadMatch.mockResolvedValue(null);

      await expect(
        editManualMatchToTeam(mockAppData, oldMatchId, newMatchId, teamKey, userSelectedSide),
      ).rejects.toThrow(`Failed to load match ${newMatchId}`);
    });

    it('should return loaded match when match loading succeeds', async () => {
      const mockAppData = createMockAppData();
      const teamKey = '123-456';
      const oldMatchId = 1001;
      const newMatchId = 1002;
      const userSelectedSide = 'dire' as const;

      const mockTeam = createTeam({
        matches: new Map<number, StoredMatchData>([
          [
            oldMatchId,
            {
              matchId: oldMatchId,
              result: 'won',
              opponentName: 'Old Opponent',
              side: 'radiant',
              duration: 1800,
              date: '2023-01-01T00:00:00Z',
              pickOrder: 'first',
              heroes: [],
              isManual: true,
              isHidden: false,
            },
          ],
        ]),
      });

      mockAppData._teams.set(teamKey, mockTeam);

      // Mock loadMatch to succeed
      const mockMatch: Match = {
        id: newMatchId,
        date: '2023-01-02T00:00:00Z',
        duration: 2000,
        radiant: { id: 1, name: 'Radiant Team' },
        dire: { id: 2, name: 'Dire Team' },
        draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
        players: { radiant: [], dire: [] },
        statistics: {
          radiantScore: 0,
          direScore: 0,
          goldAdvantage: { times: [], radiantGold: [], direGold: [] },
          experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
        },
        events: [],
        result: 'dire',
      };

      mockAppData.loadMatch.mockResolvedValueOnce(mockMatch);

      // Call the function
      const result = await editManualMatchToTeam(mockAppData, oldMatchId, newMatchId, teamKey, userSelectedSide);

      // Verify that the function returns the loaded match
      expect(result).toBe(mockMatch);
      expect(result?.error).toBeUndefined();

      // Verify that the team's matches were updated
      expect(mockAppData.updateTeam).toHaveBeenCalledWith(teamKey, {
        matches: expect.any(Map),
      });

      // Verify that the old match was removed and new match was added
      const updatedMatches = mockAppData.updateTeam.mock.calls[0][1].matches;
      expect(updatedMatches.has(oldMatchId)).toBe(false);
      expect(updatedMatches.has(newMatchId)).toBe(true);

      // Verify that team participation was updated
      expect(mockAppData.updateTeamMatchParticipation).toHaveBeenCalledWith(teamKey, [newMatchId]);
    });

    it('should throw error when team is not found', async () => {
      const mockAppData = createMockAppData();
      const teamKey = 'nonexistent-team';
      const oldMatchId = 1001;
      const newMatchId = 1002;
      const userSelectedSide = 'radiant' as const;

      // Don't add any teams to the mock

      // Call the function and expect it to throw
      await expect(
        editManualMatchToTeam(mockAppData, oldMatchId, newMatchId, teamKey, userSelectedSide),
      ).rejects.toThrow('Team nonexistent-team not found');
    });
  });

  describe('addManualMatchToTeam', () => {
    it('should return null when match loading fails', async () => {
      const mockAppData = createMockAppData();
      const teamKey = '123-456';
      const matchId = 1001;
      const userSelectedSide = 'radiant' as const;

      // Create a mock team
      const mockTeam = createTeam();

      mockAppData._teams.set(teamKey, mockTeam);

      // Mock loadMatch to fail (return null)
      mockAppData.loadMatch.mockResolvedValue(null);

      // Call the function
      const result = await addManualMatchToTeam(mockAppData, matchId, teamKey, userSelectedSide);

      // Verify that the function returns null
      expect(result).toBeNull();

      // Verify that no team updates were made
      expect(mockAppData.updateTeam).not.toHaveBeenCalled();
    });
  });

  describe('removeManualMatchFromTeam', () => {
    it('should remove manual match from team', () => {
      const mockAppData = createMockAppData();
      const teamKey = '123-456';
      const matchId = 1001;

      // Create a mock team with a manual match
      const mockTeam = createTeam({
        matches: new Map<number, StoredMatchData>([
          [
            matchId,
            {
              matchId,
              result: 'won',
              opponentName: 'Test Opponent',
              side: 'radiant',
              duration: 1800,
              date: '2023-01-01T00:00:00Z',
              pickOrder: 'first',
              heroes: [],
              isManual: true,
              isHidden: false,
            },
          ],
        ]),
      });

      mockAppData._teams.set(teamKey, mockTeam);

      // Call the function
      removeManualMatchFromTeam(mockAppData, matchId, teamKey);

      // Verify that the team was updated
      expect(mockAppData.updateTeam).toHaveBeenCalledWith(teamKey, {
        matches: expect.any(Map),
      });

      // Verify that the match was removed
      const updatedMatches = mockAppData.updateTeam.mock.calls[0][1].matches;
      expect(updatedMatches.has(matchId)).toBe(false);

      // Verify that team participation was updated
      expect(mockAppData.updateTeamMatchParticipation).toHaveBeenCalledWith(teamKey, []);
    });

    it('should preserve user-selected side when adding manual match', async () => {
      const mockAppData = createMockAppData();
      const teamKey = 'team1';
      const matchId = 12345;
      const userSelectedSide = 'dire';

      // Setup existing team
      const mockTeam = createTeam({
        id: teamKey,
        teamId: 1,
        leagueId: 1,
      });

      mockAppData._teams.set(teamKey, mockTeam);

      // Mock loadMatch to return a match
      const mockMatch: Match = {
        id: matchId,
        date: '2023-01-01T00:00:00Z',
        duration: 1800,
        radiant: { id: 1, name: 'Team A' },
        dire: { id: 2, name: 'Team B' },
        draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
        players: { radiant: [], dire: [] },
        statistics: {
          radiantScore: 1,
          direScore: 0,
          goldAdvantage: { times: [], radiantGold: [], direGold: [] },
          experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
        },
        events: [],
        result: 'radiant',
        isLoading: false,
        error: undefined,
      };

      mockAppData.loadMatch.mockResolvedValue(mockMatch);

      // Call addManualMatchToTeam with dire side
      await addManualMatchToTeam(mockAppData, matchId, teamKey, userSelectedSide);

      // Verify that the match was added with the correct side
      const updatedMatches = mockAppData.updateTeam.mock.calls[0][1].matches;
      const addedMatchData = updatedMatches.get(matchId);
      expect(addedMatchData?.side).toBe('dire');
      expect(addedMatchData?.isManual).toBe(true);

      // Verify that updateTeamMatchParticipation was called
      expect(mockAppData.updateTeamMatchParticipation).toHaveBeenCalled();
    });
  });
});
