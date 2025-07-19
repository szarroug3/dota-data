/**
 * @jest-environment node
 */

import { chromium } from 'playwright';

import { scrapeHtmlFromUrl } from '@/lib/utils/playwright';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

const mockChromium = chromium as jest.Mocked<typeof chromium>;

describe('scrapeHtmlFromUrl', () => {
  let mockBrowser: any;
  let mockContext: any;
  let mockPage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock browser, context, and page
    mockPage = {
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      content: jest.fn().mockResolvedValue('<html><body>Test HTML</body></html>'),
      close: jest.fn(),
    };

    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn(),
    };

    mockChromium.launch.mockResolvedValue(mockBrowser);
  });

  it('should successfully scrape HTML from a URL', async () => {
    const url = 'https://www.dotabuff.com/esports/teams/9517508/matches';
    const selector = 'table.table';

    const result = await scrapeHtmlFromUrl(url, selector);

    expect(result).toBe('<html><body>Test HTML</body></html>');
    expect(mockChromium.launch).toHaveBeenCalledWith({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });
    expect(mockBrowser.newContext).toHaveBeenCalledWith({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    expect(mockContext.newPage).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith(url, { waitUntil: 'domcontentloaded' });
    expect(mockPage.waitForSelector).toHaveBeenCalledWith(selector);
    expect(mockPage.content).toHaveBeenCalled();
  });

  it('should handle errors and clean up resources', async () => {
    const url = 'https://www.dotabuff.com/esports/teams/9517508/matches';
    const selector = 'table.table';

    // Mock page.goto to throw an error
    mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

    await expect(scrapeHtmlFromUrl(url, selector)).rejects.toThrow(
      'Failed to scrape https://www.dotabuff.com/esports/teams/9517508/matches: Error: Navigation failed'
    );

    // Verify cleanup
    expect(mockPage.close).toHaveBeenCalled();
    expect(mockContext.close).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  it('should handle selector not found error', async () => {
    const url = 'https://www.dotabuff.com/esports/teams/9517508/matches';
    const selector = 'table.table';

    // Mock waitForSelector to throw an error
    mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));

    await expect(scrapeHtmlFromUrl(url, selector)).rejects.toThrow(
      'Failed to scrape https://www.dotabuff.com/esports/teams/9517508/matches: Error: Selector not found'
    );

    // Verify cleanup
    expect(mockPage.close).toHaveBeenCalled();
    expect(mockContext.close).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  it('should clean up resources even if content extraction fails', async () => {
    const url = 'https://www.dotabuff.com/esports/teams/9517508/matches';
    const selector = 'table.table';

    // Mock content to throw an error
    mockPage.content.mockRejectedValue(new Error('Content extraction failed'));

    await expect(scrapeHtmlFromUrl(url, selector)).rejects.toThrow(
      'Failed to scrape https://www.dotabuff.com/esports/teams/9517508/matches: Error: Content extraction failed'
    );

    // Verify cleanup
    expect(mockPage.close).toHaveBeenCalled();
    expect(mockContext.close).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });
}); 