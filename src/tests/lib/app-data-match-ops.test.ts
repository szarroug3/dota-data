import {
  editManualMatchToTeam,
  addManualMatchToTeam,
  removeManualMatchFromTeam,
} from '@/frontend/lib/app-data-match-ops';
import type { Match, Team } from '@/frontend/lib/app-data-types';

// Mock the AppData context interface
const createMockAppData = () => ({
  _teams: new Map<string, Team>(),
  _matches: new Map<number, Match>(),
  updateTeam: jest.fn(),
  saveToStorage: jest.fn(),
  loadMatch: jest.fn(),
  addMatch: jest.fn(),
  updateMatch: jest.fn(),
  getMatch: jest.fn(),
  updateTeamMatchParticipation: jest.fn(),
});

describe('app-data-match-ops', () => {
  describe('editManualMatchToTeam', () => {
    it('should optimize side-only changes without network calls', async () => {
      const mockAppData = createMockAppData();
      const teamKey = 'team1';
      const matchId = 12345;

      // Setup existing team with a manual match
      const existingTeam: Team = {
        key: teamKey,
        name: 'Test Team',
        matches: new Map([
          [
            matchId,
            {
              matchId,
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
        players: new Map(),
        hiddenMatches: new Set(),
        hiddenPlayers: new Set(),
        metadata: {
          totalMatches: 1,
          totalWins: 1,
          totalLosses: 0,
          winRate: 100,
          averageMatchDuration: 1800,
          lastMatchDate: '2023-01-01T00:00:00Z',
        },
      };

      mockAppData._teams.set(teamKey, existingTeam);

      // Mock existing match data
      const existingMatch: Match = {
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

      mockAppData._matches.set(matchId, existingMatch);
      mockAppData.getMatch.mockReturnValue(existingMatch);

      // Call editManualMatchToTeam with same match ID but different side
      const result = await editManualMatchToTeam(mockAppData, matchId, matchId, teamKey, 'dire');

      // Should return the existing match without network calls
      expect(result).toBe(existingMatch);

      // Should update the team's match data with new side
      const updatedMatchData = existingTeam.matches.get(matchId);
      expect(updatedMatchData?.side).toBe('dire');

      // Should NOT call loadMatch (no network call)
      expect(mockAppData.loadMatch).not.toHaveBeenCalled();

      // Should NOT add optimistic match
      expect(mockAppData.addMatch).not.toHaveBeenCalled();

      // Should update the team
      expect(mockAppData.updateTeam).toHaveBeenCalledWith(teamKey, {
        matches: existingTeam.matches,
      });

      // Should save to storage to persist the side change
      expect(mockAppData.saveToStorage).toHaveBeenCalled();
    });

    it('should show optimistic update immediately and then show error when match loading fails', async () => {
      const mockAppData = createMockAppData();
      const teamKey = '123-456';
      const oldMatchId = 1001;
      const newMatchId = 1002;
      const userSelectedSide = 'radiant' as const;

      // Create a mock team with an existing manual match
      const mockTeam: Team = {
        id: teamKey,
        teamId: 123,
        leagueId: 456,
        name: 'Test Team',
        leagueName: 'Test League',
        timeAdded: Date.now(),
        matches: new Map([
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
        players: new Map(),
        isLoading: false,
      };

      mockAppData._teams.set(teamKey, mockTeam);

      // Mock loadMatch to fail (return null)
      mockAppData.loadMatch.mockResolvedValue(null);

      // Call the function
      const result = await editManualMatchToTeam(mockAppData, oldMatchId, newMatchId, teamKey, userSelectedSide);

      // Verify that the function doesn't throw an error
      expect(result).toBeDefined();
      expect(result?.id).toBe(newMatchId);
      expect(result?.error).toBeDefined();
      expect(result?.error).toContain('Failed to load match');
      expect(result?.isLoading).toBe(false);

      // Verify that optimistic match was added immediately
      expect(mockAppData.addMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newMatchId,
          isLoading: true,
          error: undefined,
        }),
      );

      // Verify that the optimistic match was updated with error
      expect(mockAppData.updateMatch).toHaveBeenCalledWith(newMatchId, {
        isLoading: false,
        error: expect.stringContaining('Failed to load match'),
      });

      // Verify that the team's matches were updated
      expect(mockAppData.updateTeam).toHaveBeenCalledWith(teamKey, {
        matches: expect.any(Map),
      });

      // Verify that the old match was removed and new match was added
      const updatedMatches = mockAppData.updateTeam.mock.calls[0][1].matches;
      expect(updatedMatches.has(oldMatchId)).toBe(false);
      expect(updatedMatches.has(newMatchId)).toBe(true);

      // Verify that team participation was updated
      expect(mockAppData.updateTeamMatchParticipation).toHaveBeenCalledWith(
        teamKey,
        expect.arrayContaining([newMatchId]),
      );
    });

    it('should show optimistic update immediately and then show success when match loading succeeds', async () => {
      const mockAppData = createMockAppData();
      const teamKey = '123-456';
      const oldMatchId = 1001;
      const newMatchId = 1002;
      const userSelectedSide = 'dire' as const;

      // Create a mock team with an existing manual match
      const mockTeam: Team = {
        id: teamKey,
        teamId: 123,
        leagueId: 456,
        name: 'Test Team',
        leagueName: 'Test League',
        timeAdded: Date.now(),
        matches: new Map([
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
        players: new Map(),
        isLoading: false,
      };

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

      mockAppData.loadMatch.mockResolvedValue(mockMatch);

      // Call the function
      const result = await editManualMatchToTeam(mockAppData, oldMatchId, newMatchId, teamKey, userSelectedSide);

      // Verify that the function returns the loaded match
      expect(result).toBe(mockMatch);
      expect(result?.error).toBeUndefined();

      // Verify that optimistic match was added immediately
      expect(mockAppData.addMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newMatchId,
          isLoading: true,
          error: undefined,
        }),
      );

      // Verify that the team's matches were updated
      expect(mockAppData.updateTeam).toHaveBeenCalledWith(teamKey, {
        matches: expect.any(Map),
      });

      // Verify that the old match was removed and new match was added
      const updatedMatches = mockAppData.updateTeam.mock.calls[0][1].matches;
      expect(updatedMatches.has(oldMatchId)).toBe(false);
      expect(updatedMatches.has(newMatchId)).toBe(true);

      // Verify that team participation was updated
      expect(mockAppData.updateTeamMatchParticipation).toHaveBeenCalledWith(
        teamKey,
        expect.arrayContaining([newMatchId]),
      );
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
      const mockTeam: Team = {
        id: teamKey,
        teamId: 123,
        leagueId: 456,
        name: 'Test Team',
        leagueName: 'Test League',
        timeAdded: Date.now(),
        matches: new Map(),
        players: new Map(),
        isLoading: false,
      };

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
      const mockTeam: Team = {
        id: teamKey,
        teamId: 123,
        leagueId: 456,
        name: 'Test Team',
        leagueName: 'Test League',
        timeAdded: Date.now(),
        matches: new Map([
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
        players: new Map(),
        isLoading: false,
      };

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
      const mockTeam: Team = {
        key: teamKey,
        name: 'Test Team',
        matches: new Map(),
        players: new Map(),
        hiddenMatches: new Set(),
        hiddenPlayers: new Set(),
        metadata: {
          totalMatches: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          averageMatchDuration: 0,
          lastMatchDate: '2023-01-01T00:00:00Z',
        },
      };

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
