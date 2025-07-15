import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Start the browser and create a new context
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto(baseURL!);
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Set up test data in localStorage
    await page.evaluate(() => {
      // Clear any existing data
      localStorage.clear();
      
      // Set up test preferences
      localStorage.setItem('theme', 'light');
      localStorage.setItem('sidebarCollapsed', 'false');
      localStorage.setItem('preferredSite', 'dotabuff');
      
      // Set up test teams data
      const testTeams = [
        { id: 'test-team-1', name: 'Test Team Alpha', league: 'Test League 1' },
        { id: 'test-team-2', name: 'Test Team Beta', league: 'Test League 2' }
      ];
      localStorage.setItem('teams', JSON.stringify(testTeams));
      
      // Set up test players data
      const testPlayers = [
        { id: 'test-player-1', name: 'Test Player 1', role: 'carry' },
        { id: 'test-player-2', name: 'Test Player 2', role: 'support' }
      ];
      localStorage.setItem('players', JSON.stringify(testPlayers));
      
      // Set up test matches data
      const testMatches = [
        { id: 'test-match-1', date: '2024-01-01', result: 'win', opponent: 'Test Opponent 1' },
        { id: 'test-match-2', date: '2024-01-02', result: 'loss', opponent: 'Test Opponent 2' }
      ];
      localStorage.setItem('matches', JSON.stringify(testMatches));
    });
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup; 