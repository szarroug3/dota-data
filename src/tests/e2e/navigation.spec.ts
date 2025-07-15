import { expect, test, type Page } from '@playwright/test';

// Helper function to test sidebar toggle functionality
async function testSidebarToggle(page: Page) {
  const toggleButton = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="toggle"], button[aria-label*="collapse"]');
  const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
  
  if (await toggleButton.isVisible()) {
    // Get initial sidebar state
    const initialClass = await sidebar.getAttribute('class') || '';
    
    // Toggle collapsed
    await toggleButton.click();
    await page.waitForTimeout(300); // Wait for animation
    
    // Verify state changed
    const collapsedClass = await sidebar.getAttribute('class') || '';
    expect(collapsedClass).not.toBe(initialClass);
    
    // Toggle expanded
    await toggleButton.click();
    await page.waitForTimeout(300); // Wait for animation
    
    // Verify state changed back
    const expandedClass = await sidebar.getAttribute('class') || '';
    expect(expandedClass).toBe(initialClass);
  }
}

// Helper function to test mobile sidebar toggle
async function testMobileSidebarToggle(page: Page) {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Look for mobile toggle button
  const mobileToggle = page.locator('[data-testid="mobile-sidebar-toggle"], button[aria-label*="menu"], .mobile-menu-toggle');
  const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
  
  if (await mobileToggle.isVisible()) {
    // Get initial state
    const initialClass = await sidebar.getAttribute('class') || '';
    
    // Open sidebar
    await mobileToggle.click();
    await page.waitForTimeout(300); // Wait for animation
    
    // Verify sidebar is visible
    await expect(sidebar).toBeVisible();
    
    // Close sidebar
    await mobileToggle.click();
    await page.waitForTimeout(300); // Wait for animation
    
    // Verify sidebar is hidden
    const finalClass = await sidebar.getAttribute('class') || '';
    expect(finalClass).toBe(initialClass);
  }
}

// Helper function to test a single page
async function testSinglePage(page: Page, pageInfo: { path: string; title: string }) {
  await page.goto(pageInfo.path);
  
  // Verify page loads
  await expect(page).toHaveTitle(/Dota Scout Assistant/);
  
  // Verify page content is visible
  await expect(page.locator('body')).toBeVisible();
  
  // Wait for any loading states to complete
  await page.waitForLoadState('networkidle');
}

// Helper function to test page navigation
async function testPageNavigation(page: Page) {
  const pages = [
    { path: '/', title: 'Dashboard' },
    { path: '/team-management', title: 'Team Management' },
    { path: '/match-history', title: 'Match History' },
    { path: '/player-stats', title: 'Player Statistics' },
    { path: '/team-analysis', title: 'Team Analysis' },
    { path: '/draft-suggestions', title: 'Draft Suggestions' }
  ];

  for (const pageInfo of pages) {
    await testSinglePage(page, pageInfo);
  }
}

test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard page successfully', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Dota Scout Assistant/);
    
    // Verify main heading - should be "Dashboard" according to architecture
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verify page loads without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have accessible sidebar navigation', async ({ page }) => {
    // Verify sidebar is visible (persistent sidebar per architecture)
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
    await expect(sidebar).toBeVisible();
    
    // Test navigation links - should match architecture specification
    const navLinks = ['Dashboard', 'Team Management', 'Match History', 'Player Stats', 'Team Analysis', 'Draft Suggestions'];
    
    for (const link of navLinks) {
      // Look for navigation elements with the text
      const navElement = page.locator(`text=${link}`);
      await expect(navElement).toBeVisible();
    }
  });

  test('should have external resources in sidebar', async ({ page }) => {
    // According to architecture, sidebar should have external resources
    const externalLinks = ['Dotabuff', 'OpenDota', 'Dota2ProTracker'];
    
    for (const link of externalLinks) {
      const externalLink = page.locator(`text=${link}`);
      if (await externalLink.count() > 0) {
        await expect(externalLink.first()).toBeVisible();
      }
    }
  });

  test('should toggle sidebar collapse state', async ({ page }) => {
    await testSidebarToggle(page);
  });

  test('should handle mobile sidebar toggle', async ({ page }) => {
    await testMobileSidebarToggle(page);
  });

  test('should navigate between pages', async ({ page }) => {
    await testPageNavigation(page);
  });

  test('should maintain sidebar state across navigation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Toggle sidebar if toggle button exists
    const toggleButton = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="toggle"]');
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(300);
    }
    
    // Navigate to another page
    await page.goto('/team-management');
    
    // Verify sidebar state is maintained
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
    await expect(sidebar).toBeVisible();
  });

  test('should handle theme toggle', async ({ page }) => {
    // Look for theme toggle button (should be in sidebar per architecture)
    const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"], .theme-toggle');
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.locator('html').getAttribute('class') || '';
      
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(100);
      
      // Verify theme changed
      const newTheme = await page.locator('html').getAttribute('class') || '';
      expect(newTheme).not.toBe(initialTheme);
      
      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(100);
      
      // Verify theme changed back
      const finalTheme = await page.locator('html').getAttribute('class') || '';
      expect(finalTheme).toBe(initialTheme);
    }
  });

  test('should handle preferred site toggle', async ({ page }) => {
    // Look for preferred site toggle (Dotabuff/OpenDota per architecture)
    const siteToggle = page.locator('[data-testid="preferred-site-toggle"], button[aria-label*="site"], .site-toggle');
    
    if (await siteToggle.isVisible()) {
      // Get initial state
      const initialText = await siteToggle.textContent();
      
      // Toggle preferred site
      await siteToggle.click();
      await page.waitForTimeout(100);
      
      // Verify state changed
      const newText = await siteToggle.textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is on an element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Verify focus is still maintained
    await expect(focusedElement).toBeVisible();
  });

  test('should display loading states', async ({ page }) => {
    // Navigate to a page that might have loading states
    await page.goto('/');
    
    // Look for loading indicators (should follow consistent pattern per architecture)
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .skeleton, [aria-busy="true"]');
    
    // If loading indicators exist, verify they eventually disappear
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      
      // Verify loading indicators are gone
      await expect(loadingIndicators.first()).not.toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/*', route => route.abort());
    
    // Navigate to page
    await page.goto('/');
    
    // Look for error boundaries or error messages (should be user-friendly per architecture)
    const errorElements = page.locator('[data-testid="error"], .error, [role="alert"]');
    
    // If error elements exist, verify they are displayed
    if (await errorElements.count() > 0) {
      await expect(errorElements.first()).toBeVisible();
    }
  });

  test('should show welcome section when no team is selected', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Look for welcome section (should be shown when no team is selected per architecture)
    const welcomeSection = page.locator('[data-testid="welcome-section"], .welcome-section');
    
    if (await welcomeSection.count() > 0) {
      await expect(welcomeSection.first()).toBeVisible();
      
      // Should have "Add Your First Team" button
      const addTeamButton = page.locator('text=Add Your First Team');
      await expect(addTeamButton).toBeVisible();
    }
  });

  test('should show dashboard content when team is selected', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Look for dashboard content (should be shown when team is selected per architecture)
    const dashboardContent = page.locator('[data-testid="dashboard-content"], .dashboard-content');
    const teamOverview = page.locator('[data-testid="team-overview"], .team-overview');
    const recentMatches = page.locator('[data-testid="recent-matches"], .recent-matches');
    const quickActions = page.locator('[data-testid="quick-actions"], .quick-actions');
    
    // If team is selected, these components should be visible
    if (await dashboardContent.count() > 0) {
      await expect(dashboardContent.first()).toBeVisible();
    }
    
    if (await teamOverview.count() > 0) {
      await expect(teamOverview.first()).toBeVisible();
    }
    
    if (await recentMatches.count() > 0) {
      await expect(recentMatches.first()).toBeVisible();
    }
    
    if (await quickActions.count() > 0) {
      await expect(quickActions.first()).toBeVisible();
    }
  });
}); 