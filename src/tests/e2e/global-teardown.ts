import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
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
    
    // Clean up test data from localStorage
    await page.evaluate(() => {
      // Clear all test data
      localStorage.clear();
      
      // Reset to default preferences
      localStorage.setItem('theme', 'light');
      localStorage.setItem('sidebarCollapsed', 'false');
      localStorage.setItem('preferredSite', 'dotabuff');
    });
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown; 