// Mock the team context
const mockTeam = {
  id: '123-456',
  teamId: '123',
  teamName: 'Test Team',
  leagueId: '456',
  leagueName: 'Test League',
  players: [],
  matchIds: [],
  manualMatches: [],
  manualPlayers: [],
  hiddenMatches: [],
  hiddenPlayers: [],
  loading: false
};

const mockTeamWithoutLeague = {
  id: '123-456',
  teamId: '123',
  teamName: 'Test Team',
  leagueId: '',
  leagueName: '',
  players: [],
  matchIds: [],
  manualMatches: [],
  manualPlayers: [],
  hiddenMatches: [],
  hiddenPlayers: [],
  loading: false
};

// Mock the getExternalLinks function
function getExternalLinks(activeTeam: typeof mockTeam | typeof mockTeamWithoutLeague | null) {
  if (!activeTeam) return [];
  
  const links = [];
  
  // Add team's Dotabuff page
  links.push({
    href: `https://www.dotabuff.com/esports/teams/${activeTeam.teamId}`,
    label: `${activeTeam.teamName} on Dotabuff`,
    icon: 'Users' // Mock icon component
  });
  
  // Add league's Dotabuff page if leagueId exists
  if (activeTeam.leagueId && activeTeam.leagueId !== '') {
    links.push({
      href: `https://www.dotabuff.com/esports/leagues/${activeTeam.leagueId}`,
      label: `${activeTeam.leagueName || 'League'} on Dotabuff`,
      icon: 'Trophy' // Mock icon component
    });
  }
  
  return links;
}

describe('Quick Links Functionality', () => {
  it('should return empty array when no active team', () => {
    const links = getExternalLinks(null);
    expect(links).toEqual([]);
  });

  it('should return team link when active team exists', () => {
    const links = getExternalLinks(mockTeamWithoutLeague);
    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({
      href: 'https://www.dotabuff.com/esports/teams/123',
      label: 'Test Team on Dotabuff',
      icon: 'Users'
    });
  });

  it('should return both team and league links when active team has league', () => {
    const links = getExternalLinks(mockTeam);
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({
      href: 'https://www.dotabuff.com/esports/teams/123',
      label: 'Test Team on Dotabuff',
      icon: 'Users'
    });
    expect(links[1]).toEqual({
      href: 'https://www.dotabuff.com/esports/leagues/456',
      label: 'Test League on Dotabuff',
      icon: 'Trophy'
    });
  });

  it('should use "League" as fallback when leagueName is empty', () => {
    const teamWithoutLeagueName = {
      ...mockTeam,
      leagueName: ''
    };
    const links = getExternalLinks(teamWithoutLeagueName);
    expect(links).toHaveLength(2);
    expect(links[1].label).toBe('League on Dotabuff');
  });
}); 