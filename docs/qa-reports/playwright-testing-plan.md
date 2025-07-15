# Playwright Frontend Testing Plan

**Date:** December 19, 2024  
**QA Engineer:** QA AI  
**Scope:** Comprehensive E2E testing for Dota 2 Data Dashboard Frontend  

## Overview

This document outlines the comprehensive Playwright testing strategy for the Dota 2 data dashboard application. The testing plan covers all major user flows, accessibility compliance, responsive design, and cross-browser compatibility.

## 🎯 **Testing Objectives**

### **Primary Goals**
- ✅ Verify all user flows work correctly end-to-end
- ✅ Ensure accessibility compliance (WCAG 2.1)
- ✅ Test responsive design across device sizes
- ✅ Validate cross-browser compatibility
- ✅ Test error handling and loading states
- ✅ Verify data persistence and state management

### **Quality Standards**
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** Page load times under 3 seconds
- **Responsive:** Mobile-first design validation
- **Cross-browser:** Chrome, Firefox, Safari, Edge support
- **Error Handling:** Graceful degradation and user feedback

## 📋 **Test Structure**

### **1. Core User Flows**
- Dashboard navigation and overview
- Team management workflows
- Match history browsing
- Player statistics analysis
- Draft suggestions interaction
- Team analysis features

### **2. Accessibility Testing**
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management
- ARIA attributes verification

### **3. Responsive Design**
- Mobile (320px - 768px)
- Tablet (768px - 1024px)
- Desktop (1024px+)
- Large screens (1440px+)

### **4. Cross-Browser Testing**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🧪 **Test Implementation Plan**

### **Phase 1: Setup and Configuration**

#### **1.1 Playwright Installation and Setup**
```bash
# Install Playwright
pnpm add -D @playwright/test
pnpm exec playwright install

# Install accessibility testing
pnpm add -D @axe-core/playwright
```

#### **1.2 Playwright Configuration**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### **Phase 2: Core Test Suites**

#### **2.1 Navigation and Layout Tests**
```typescript
// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Dota Scout Assistant/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should have accessible sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    
    // Test navigation links
    const navLinks = ['Dashboard', 'Team Management', 'Match History', 'Player Stats', 'Team Analysis', 'Draft Suggestions'];
    for (const link of navLinks) {
      await expect(page.locator(`text=${link}`)).toBeVisible();
    }
  });

  test('should toggle sidebar collapse state', async ({ page }) => {
    const toggleButton = page.locator('[data-testid="sidebar-toggle"]');
    const sidebar = page.locator('[data-testid="sidebar"]');
    
    // Initial state
    await expect(sidebar).toHaveClass(/w-64/);
    
    // Toggle collapsed
    await toggleButton.click();
    await expect(sidebar).toHaveClass(/w-16/);
    
    // Toggle expanded
    await toggleButton.click();
    await expect(sidebar).toHaveClass(/w-64/);
  });

  test('should handle mobile sidebar toggle', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileToggle = page.locator('[data-testid="mobile-sidebar-toggle"]');
    const sidebar = page.locator('[data-testid="sidebar"]');
    
    // Initially hidden on mobile
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    
    // Open sidebar
    await mobileToggle.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Close sidebar
    await mobileToggle.click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });
});
```

#### **2.2 Dashboard Tests**
```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome section when no team selected', async ({ page }) => {
    await expect(page.locator('[data-testid="welcome-section"]')).toBeVisible();
    await expect(page.locator('text=Welcome to Dota Scout Assistant')).toBeVisible();
    await expect(page.locator('text=Add Your First Team')).toBeVisible();
  });

  test('should display dashboard content when team is selected', async ({ page }) => {
    // Mock team selection (this would be done via context in real app)
    await page.evaluate(() => {
      localStorage.setItem('activeTeamId', 'test-team-1');
    });
    
    await page.reload();
    
    await expect(page.locator('[data-testid="team-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-matches"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
  });

  test('should display loading states during data fetch', async ({ page }) => {
    // Navigate to dashboard with slow network
    await page.route('**/api/**', route => route.fulfill({ status: 200, body: '{}', delay: 1000 }));
    
    await page.goto('/');
    
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/**', route => route.fulfill({ status: 500 }));
    
    await page.goto('/');
    
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    await expect(page.locator('text=Something went wrong')).toBeVisible();
  });
});
```

#### **2.3 Team Management Tests**
```typescript
// tests/e2e/team-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/team-management');
  });

  test('should display team management page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Team Management');
    await expect(page.locator('[data-testid="add-team-form"]')).toBeVisible();
  });

  test('should add a new team', async ({ page }) => {
    const teamIdInput = page.locator('[data-testid="team-id-input"]');
    const leagueIdInput = page.locator('[data-testid="league-id-input"]');
    const submitButton = page.locator('[data-testid="add-team-button"]');
    
    await teamIdInput.fill('12345');
    await leagueIdInput.fill('67890');
    await submitButton.click();
    
    // Verify team was added
    await expect(page.locator('[data-testid="team-card"]')).toBeVisible();
    await expect(page.locator('text=Team 12345')).toBeVisible();
  });

  test('should remove a team', async ({ page }) => {
    // Add a team first
    await page.locator('[data-testid="team-id-input"]').fill('12345');
    await page.locator('[data-testid="league-id-input"]').fill('67890');
    await page.locator('[data-testid="add-team-button"]').click();
    
    // Remove the team
    await page.locator('[data-testid="remove-team-button"]').first().click();
    
    // Verify confirmation dialog
    await expect(page.locator('text=Are you sure?')).toBeVisible();
    await page.locator('[data-testid="confirm-remove"]').click();
    
    // Verify team was removed
    await expect(page.locator('[data-testid="team-card"]')).not.toBeVisible();
  });

  test('should set active team', async ({ page }) => {
    // Add a team
    await page.locator('[data-testid="team-id-input"]').fill('12345');
    await page.locator('[data-testid="league-id-input"]').fill('67890');
    await page.locator('[data-testid="add-team-button"]').click();
    
    // Set as active
    await page.locator('[data-testid="set-active-team"]').click();
    
    // Verify active state
    await expect(page.locator('[data-testid="active-team-indicator"]')).toBeVisible();
  });
});
```

#### **2.4 Match History Tests**
```typescript
// tests/e2e/match-history.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Match History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/match-history');
  });

  test('should display match history page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Match History');
    await expect(page.locator('[data-testid="match-filters"]')).toBeVisible();
  });

  test('should filter matches by date range', async ({ page }) => {
    const dateFromInput = page.locator('[data-testid="date-from-input"]');
    const dateToInput = page.locator('[data-testid="date-to-input"]');
    const applyFiltersButton = page.locator('[data-testid="apply-filters"]');
    
    await dateFromInput.fill('2024-01-01');
    await dateToInput.fill('2024-12-31');
    await applyFiltersButton.click();
    
    // Verify filter applied
    await expect(page.locator('[data-testid="filter-indicator"]')).toBeVisible();
  });

  test('should view match details', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    
    // Verify match details modal/page
    await expect(page.locator('[data-testid="match-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="match-header"]')).toBeVisible();
  });

  test('should hide/show matches', async ({ page }) => {
    const hideButton = page.locator('[data-testid="hide-match"]').first();
    const matchCard = page.locator('[data-testid="match-card"]').first();
    
    // Hide match
    await hideButton.click();
    await expect(matchCard).toHaveClass(/hidden/);
    
    // Show match
    const showButton = page.locator('[data-testid="show-match"]').first();
    await showButton.click();
    await expect(matchCard).not.toHaveClass(/hidden/);
  });
});
```

#### **2.5 Player Stats Tests**
```typescript
// tests/e2e/player-stats.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Player Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/player-stats');
  });

  test('should display player stats page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Player Statistics');
    await expect(page.locator('[data-testid="player-filters"]')).toBeVisible();
  });

  test('should add a player', async ({ page }) => {
    const playerIdInput = page.locator('[data-testid="player-id-input"]');
    const addButton = page.locator('[data-testid="add-player-button"]');
    
    await playerIdInput.fill('123456789');
    await addButton.click();
    
    // Verify player was added
    await expect(page.locator('[data-testid="player-card"]')).toBeVisible();
  });

  test('should filter players by role', async ({ page }) => {
    const roleFilter = page.locator('[data-testid="role-filter"]');
    
    await roleFilter.selectOption('support');
    
    // Verify filter applied
    await expect(page.locator('[data-testid="filter-indicator"]')).toBeVisible();
  });

  test('should view player details', async ({ page }) => {
    const playerCard = page.locator('[data-testid="player-card"]').first();
    await playerCard.click();
    
    // Verify player details
    await expect(page.locator('[data-testid="player-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-stats"]')).toBeVisible();
  });
});
```

#### **2.6 Draft Suggestions Tests**
```typescript
// tests/e2e/draft-suggestions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Draft Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/draft-suggestions');
  });

  test('should display draft suggestions page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Draft Suggestions');
    await expect(page.locator('[data-testid="draft-board"]')).toBeVisible();
  });

  test('should generate draft suggestions', async ({ page }) => {
    const generateButton = page.locator('[data-testid="generate-suggestions"]');
    await generateButton.click();
    
    // Verify suggestions generated
    await expect(page.locator('[data-testid="hero-suggestion"]')).toBeVisible();
  });

  test('should filter suggestions by role', async ({ page }) => {
    const roleFilter = page.locator('[data-testid="role-filter"]');
    
    await roleFilter.selectOption('carry');
    
    // Verify filtered suggestions
    await expect(page.locator('[data-testid="hero-suggestion"]')).toContainText('Carry');
  });

  test('should view hero details', async ({ page }) => {
    const heroCard = page.locator('[data-testid="hero-card"]').first();
    await heroCard.click();
    
    // Verify hero details
    await expect(page.locator('[data-testid="hero-details"]')).toBeVisible();
  });
});
```

#### **2.7 Team Analysis Tests**
```typescript
// tests/e2e/team-analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Team Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/team-analysis');
  });

  test('should display team analysis page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Team Analysis');
    await expect(page.locator('[data-testid="analysis-controls"]')).toBeVisible();
  });

  test('should generate team analysis', async ({ page }) => {
    const analyzeButton = page.locator('[data-testid="analyze-team"]');
    await analyzeButton.click();
    
    // Verify analysis results
    await expect(page.locator('[data-testid="strengths-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="weaknesses-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();
  });

  test('should filter analysis by time period', async ({ page }) => {
    const timeFilter = page.locator('[data-testid="time-period-filter"]');
    
    await timeFilter.selectOption('last-30-days');
    
    // Verify filter applied
    await expect(page.locator('[data-testid="filter-indicator"]')).toBeVisible();
  });

  test('should export analysis report', async ({ page }) => {
    const exportButton = page.locator('[data-testid="export-report"]');
    
    // Mock download
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('team-analysis');
  });
});
```

### **Phase 3: Accessibility Testing**

#### **3.1 Accessibility Test Suite**
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should meet WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test arrow key navigation in sidebar
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(':focus')).toHaveAttribute('role', 'menuitem');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA labels
    const elementsWithAria = page.locator('[aria-label], [aria-labelledby]');
    await expect(elementsWithAria).toHaveCount(expect.any(Number));
    
    // Verify no empty ARIA labels
    const emptyAriaLabels = page.locator('[aria-label=""]');
    await expect(emptyAriaLabels).toHaveCount(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### **Phase 4: Responsive Design Testing**

#### **4.1 Responsive Design Test Suite**
```typescript
// tests/e2e/responsive.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile Small' },
    { width: 375, height: 667, name: 'Mobile Medium' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Desktop Small' },
    { width: 1440, height: 900, name: 'Desktop Large' },
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Verify page loads without horizontal scroll
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width);
      
      // Verify sidebar behavior
      if (viewport.width < 768) {
        // Mobile: sidebar should be hidden by default
        await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/-translate-x-full/);
      } else {
        // Desktop: sidebar should be visible
        await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      }
    });
  }

  test('should handle mobile menu toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mobileToggle = page.locator('[data-testid="mobile-sidebar-toggle"]');
    const sidebar = page.locator('[data-testid="sidebar"]');
    
    // Initially hidden
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    
    // Open menu
    await mobileToggle.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Close menu
    await mobileToggle.click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });
});
```

### **Phase 5: Cross-Browser Testing**

#### **5.1 Cross-Browser Test Suite**
```typescript
// tests/e2e/cross-browser.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('should work in all supported browsers', async ({ page }) => {
    await page.goto('/');
    
    // Test basic functionality
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Test theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Verify theme change
    await expect(page.locator('html')).toHaveAttribute('class', /dark/);
  });

  test('should handle browser-specific features', async ({ page }) => {
    await page.goto('/');
    
    // Test localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });
    
    const value = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });
    
    expect(value).toBe('test-value');
  });
});
```

## 📊 **Test Execution Strategy**

### **Local Development**
```bash
# Install dependencies
pnpm add -D @playwright/test @axe-core/playwright

# Install browsers
pnpm exec playwright install

# Run all tests
pnpm test:e2e

# Run specific test suite
pnpm test:e2e navigation.spec.ts

# Run with UI
pnpm test:e2e --ui

# Run with headed mode
pnpm test:e2e --headed
```

### **CI/CD Integration**
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ All user flows complete successfully
- ✅ No broken links or navigation errors
- ✅ Forms submit and validate correctly
- ✅ Data loads and displays properly
- ✅ Error states handled gracefully

### **Accessibility Requirements**
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation works
- ✅ Screen reader compatibility
- ✅ Sufficient color contrast
- ✅ Proper ARIA attributes

### **Performance Requirements**
- ✅ Page load times under 3 seconds
- ✅ No memory leaks
- ✅ Smooth animations
- ✅ Responsive interactions

### **Cross-Browser Requirements**
- ✅ Works in Chrome, Firefox, Safari, Edge
- ✅ Mobile browsers supported
- ✅ Consistent behavior across browsers

## 📈 **Monitoring and Reporting**

### **Test Metrics**
- **Test Coverage:** 100% of user flows
- **Pass Rate:** >95% in all browsers
- **Performance:** <3s page load times
- **Accessibility:** 0 WCAG violations

### **Reporting**
- HTML reports with screenshots
- Accessibility violation details
- Performance metrics
- Cross-browser compatibility matrix

## 🚀 **Next Steps**

1. **Install Playwright** and configure the testing environment
2. **Implement test data** and mocking strategies
3. **Create test utilities** for common operations
4. **Set up CI/CD** integration
5. **Run initial test suite** and address any issues
6. **Expand test coverage** based on user feedback

This comprehensive testing plan ensures the Dota 2 data dashboard meets all quality standards and provides an excellent user experience across all devices and browsers. 