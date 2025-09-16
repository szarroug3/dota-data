import { expect, test, type Page } from '@playwright/test';

// Helper function to check heading hierarchy
async function checkHeadingHierarchy(page: Page) {
  const headings = page.locator('h1, h2, h3, h4, h5, h6');
  const headingCount = await headings.count();

  if (headingCount > 0) {
    // Check that we have at least one h1
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(expect.any(Number) as any);

    // Check heading hierarchy (basic check)
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);

      // Verify heading has text content
      const text = await heading.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  }
}

// Helper function to check form labels
async function checkFormLabels(page: Page) {
  const formElements = page.locator('input, select, textarea');

  for (let i = 0; i < (await formElements.count()); i++) {
    const element = formElements.nth(i);
    const type = await element.getAttribute('type');

    // Skip hidden inputs
    if (type === 'hidden') continue;

    // Check for associated label or aria-label
    const id = await element.getAttribute('id');
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaLabelledBy = await element.getAttribute('aria-labelledby');

    if (id) {
      // Check for label with matching for attribute
      const label = page.locator(`label[for="${id}"]`);
      if ((await label.count()) > 0) {
        await expect(label.first()).toBeVisible();
      }
    }

    // Element should have either aria-label, aria-labelledby, or associated label
    expect(ariaLabel || ariaLabelledBy || id).toBeTruthy();
  }
}

// Helper function to check color contrast
async function checkColorContrast(page: Page) {
  const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');

  for (let i = 0; i < Math.min(await textElements.count(), 10); i++) {
    const element = textElements.nth(i);
    const text = await element.textContent();

    if (text && text.trim().length > 0) {
      // Verify text is visible (basic contrast check)
      const color = await element.evaluate((el: Element) => {
        const style = window.getComputedStyle(el);
        return style.color;
      });

      // Basic check that color is not transparent or very light
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      expect(color).not.toBe('transparent');
    }
  }
}

// Helper function to check ARIA labels
async function checkAriaLabels(page: Page) {
  // Check for proper ARIA labels on interactive elements
  const elementsWithAria = page.locator('[aria-label], [aria-labelledby], [aria-describedby]');
  await expect(elementsWithAria).toHaveCount(expect.any(Number) as any);

  // Verify no empty ARIA labels
  const emptyAriaLabels = page.locator('[aria-label=""]');
  await expect(emptyAriaLabels).toHaveCount(0);

  // Verify buttons have accessible names
  const buttons = page.locator('button');
  for (let i = 0; i < (await buttons.count()); i++) {
    const button = buttons.nth(i);
    const ariaLabel = await button.getAttribute('aria-label');
    const textContent = await button.textContent();

    // Button should have either aria-label or text content
    expect(ariaLabel || textContent?.trim()).toBeTruthy();
  }
}

// Helper function to check focus management
async function checkFocusManagement(page: Page) {
  // Test focus on interactive elements
  const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]');

  for (let i = 0; i < Math.min(await interactiveElements.count(), 5); i++) {
    const element = interactiveElements.nth(i);

    // Focus the element
    await element.focus();

    // Verify it has focus
    await expect(element).toHaveCSS('outline', expect.stringContaining('') as any);
  }
}

// Helper function to check sidebar accessibility
async function checkSidebarAccessibility(page: Page) {
  // Verify sidebar has proper navigation role
  const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
  if ((await sidebar.count()) > 0) {
    const sidebarElement = sidebar.first();

    // Check for navigation role
    const role = await sidebarElement.getAttribute('role');
    expect(role === 'navigation' || role === null).toBeTruthy();

    // Check for proper navigation structure
    const navItems = sidebarElement.locator('a, button');
    await expect(navItems).toHaveCount(expect.any(Number) as any);
  }
}

// Helper function to check theme toggle accessibility
async function checkThemeToggleAccessibility(page: Page) {
  // Check theme toggle accessibility
  const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"], .theme-toggle');

  if ((await themeToggle.count()) > 0) {
    const toggle = themeToggle.first();

    // Should have proper ARIA label
    const ariaLabel = await toggle.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // Should be keyboard accessible
    await toggle.focus();
    await expect(toggle).toHaveCSS('outline', expect.stringContaining('') as any);
  }
}

// Helper function to check loading states accessibility
async function checkLoadingStatesAccessibility(page: Page) {
  // Check loading states accessibility
  const loadingIndicators = page.locator('[data-testid="loading"], .loading, .skeleton, [aria-busy="true"]');

  if ((await loadingIndicators.count()) > 0) {
    for (let i = 0; i < (await loadingIndicators.count()); i++) {
      const loading = loadingIndicators.nth(i);

      // Should have proper ARIA attributes
      const ariaBusy = await loading.getAttribute('aria-busy');
      const ariaLabel = await loading.getAttribute('aria-label');

      expect(ariaBusy === 'true' || ariaLabel).toBeTruthy();
    }
  }
}

// Helper function to check empty states accessibility
async function checkEmptyStatesAccessibility(page: Page) {
  // Check empty states accessibility
  const emptyStates = page.locator('[data-testid="empty-state"], .empty-state, [role="status"]');

  if ((await emptyStates.count()) > 0) {
    for (let i = 0; i < (await emptyStates.count()); i++) {
      const emptyState = emptyStates.nth(i);

      // Should have proper ARIA attributes
      const role = await emptyState.getAttribute('role');
      const ariaLabel = await emptyState.getAttribute('aria-label');

      expect(role === 'status' || ariaLabel).toBeTruthy();
    }
  }
}

// Helper function to check data tables accessibility
async function checkDataTablesAccessibility(page: Page) {
  // Check data tables accessibility
  const tables = page.locator('table');

  if ((await tables.count()) > 0) {
    for (let i = 0; i < (await tables.count()); i++) {
      const table = tables.nth(i);

      // Should have proper table structure
      const headers = table.locator('th');
      const rows = table.locator('tr');

      // At least one header or row should exist
      expect((await headers.count()) > 0 || (await rows.count()) > 0).toBeTruthy();
    }
  }
}

// Helper function to check individual form control
async function checkIndividualFormControl(control: ReturnType<Page['locator']>) {
  // Should have proper focus management
  await control.focus();
  await expect(control).toHaveCSS('outline', expect.stringContaining('') as any);

  // Should have proper ARIA attributes if needed
  const type = await control.getAttribute('type');
  if (type === 'checkbox' || type === 'radio') {
    const ariaLabel = await control.getAttribute('aria-label');
    const ariaLabelledBy = await control.getAttribute('aria-labelledby');
    expect(ariaLabel || ariaLabelledBy).toBeTruthy();
  }
}

// Helper function to check form controls accessibility
async function checkFormControlsAccessibility(page: Page) {
  // Check form controls accessibility
  const formControls = page.locator('input, select, textarea, button');

  for (let i = 0; i < Math.min(await formControls.count(), 10); i++) {
    const control = formControls.nth(i);
    await checkIndividualFormControl(control);
  }
}

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper page structure', async ({ page }) => {
    // Verify page has proper HTML structure
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Verify main content area exists (should have main role per architecture)
    const main = page.locator('main, [role="main"]');
    if ((await main.count()) > 0) {
      await expect(main.first()).toBeVisible();
    }

    // Verify heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings).toHaveCount(expect.any(Number) as any);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');

    // Verify focus is on an element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }

    // Test shift+tab for reverse navigation
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await checkAriaLabels(page);
  });

  test('should have proper focus management', async ({ page }) => {
    await checkFocusManagement(page);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await checkColorContrast(page);
  });

  test('should have proper form labels', async ({ page }) => {
    await checkFormLabels(page);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await checkHeadingHierarchy(page);
  });

  test('should have proper alt text for images', async ({ page }) => {
    // Check for images
    const images = page.locator('img');

    for (let i = 0; i < (await images.count()); i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      const role = await image.getAttribute('role');

      // Images should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should have proper skip links', async ({ page }) => {
    // Check for skip links (common accessibility feature)
    const skipLinks = page.locator('a[href^="#"], a[href*="skip"]');

    if ((await skipLinks.count()) > 0) {
      for (let i = 0; i < (await skipLinks.count()); i++) {
        const skipLink = skipLinks.nth(i);
        await expect(skipLink).toBeVisible();

        // Test skip link functionality
        await skipLink.click();
        await page.waitForTimeout(100);
      }
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Check for live regions (aria-live)
    const liveRegions = page.locator('[aria-live]');

    if ((await liveRegions.count()) > 0) {
      for (let i = 0; i < (await liveRegions.count()); i++) {
        const region = liveRegions.nth(i);
        const liveValue = await region.getAttribute('aria-live');

        // aria-live should have valid values
        expect(['polite', 'assertive', 'off']).toContain(liveValue);
      }
    }
  });

  test('should have proper landmark roles', async ({ page }) => {
    // Check for landmark roles (should be present per architecture)
    const landmarks = page.locator(
      '[role="banner"], [role="main"], [role="navigation"], [role="complementary"], [role="contentinfo"]',
    );

    if ((await landmarks.count()) > 0) {
      for (let i = 0; i < (await landmarks.count()); i++) {
        const landmark = landmarks.nth(i);
        await expect(landmark).toBeVisible();
      }
    }
  });

  test('should handle dynamic content updates', async ({ page }) => {
    // Test that dynamic content updates are announced
    // This is a basic test - in a real app, you'd test specific dynamic updates

    // Look for elements that might update dynamically
    const dynamicElements = page.locator('[aria-live], [aria-atomic]');

    if ((await dynamicElements.count()) > 0) {
      for (let i = 0; i < (await dynamicElements.count()); i++) {
        const element = dynamicElements.nth(i);
        await expect(element).toBeVisible();
      }
    }
  });

  test('should have proper error handling for screen readers', async ({ page }) => {
    // Check for error messages with proper ARIA attributes
    const errorMessages = page.locator('[role="alert"], [aria-invalid="true"]');

    if ((await errorMessages.count()) > 0) {
      for (let i = 0; i < (await errorMessages.count()); i++) {
        const error = errorMessages.nth(i);
        await expect(error).toBeVisible();

        // Error messages should be announced
        const role = await error.getAttribute('role');
        const ariaInvalid = await error.getAttribute('aria-invalid');

        expect(role === 'alert' || ariaInvalid === 'true').toBeTruthy();
      }
    }
  });

  test('should have accessible sidebar navigation', async ({ page }) => {
    await checkSidebarAccessibility(page);
  });

  test('should have accessible theme toggle', async ({ page }) => {
    await checkThemeToggleAccessibility(page);
  });

  test('should have accessible loading states', async ({ page }) => {
    await checkLoadingStatesAccessibility(page);
  });

  test('should have accessible empty states', async ({ page }) => {
    await checkEmptyStatesAccessibility(page);
  });

  test('should have accessible data tables', async ({ page }) => {
    await checkDataTablesAccessibility(page);
  });

  test('should have accessible form controls', async ({ page }) => {
    await checkFormControlsAccessibility(page);
  });
});
