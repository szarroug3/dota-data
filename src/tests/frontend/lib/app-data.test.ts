import { AppData } from '@/frontend/lib/app-data';
import { GLOBAL_TEAM_KEY } from '@/frontend/lib/app-data-types';

const createAppDataWithGlobalTeam = (): AppData => {
  const appData = new AppData();
  appData.updateTeamsMap(GLOBAL_TEAM_KEY, appData.createGlobalTeam());
  return appData;
};

const createTeamInput = (teamId: number, leagueId: number) => ({
  id: `${teamId}-${leagueId}`,
  teamId,
  leagueId,
  name: `Team ${teamId}`,
  leagueName: `League ${leagueId}`,
  timeAdded: Date.now(),
  isLoading: false,
  isGlobal: false,
});

describe('AppData team selection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('selects the global team when removing the active team', () => {
    const appData = createAppDataWithGlobalTeam();
    appData.addTeam(createTeamInput(1, 2));
    appData.setSelectedTeam('1-2');

    appData.removeTeam('1-2');

    expect(appData.state.selectedTeamId).toBe(GLOBAL_TEAM_KEY);
    expect(appData.teams.has('1-2')).toBe(false);
  });

  it('resets selection before editing the active team', async () => {
    const appData = createAppDataWithGlobalTeam();
    appData.addTeam(createTeamInput(1, 2));
    appData.setSelectedTeam('1-2');

    const setSelectedTeamSpy = jest.spyOn(appData, 'setSelectedTeam');
    const loadTeamSpy = jest.spyOn(appData, 'loadTeam').mockResolvedValue();

    await appData.editTeamFromInputs('1', '2', '3', '4');

    expect(setSelectedTeamSpy).toHaveBeenCalledWith(GLOBAL_TEAM_KEY);
    expect(loadTeamSpy).toHaveBeenCalledWith(3, 4);
    expect(appData.state.selectedTeamId).toBe(GLOBAL_TEAM_KEY);
    expect(appData.teams.has('1-2')).toBe(false);
  });
});
