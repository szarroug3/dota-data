import { chromium, Browser, BrowserContext, Page } from 'playwright';

/**
 * Playwright browser configuration for scraping Dotabuff
 */
const BROWSER_CONFIG = {
  headless: true,
  args: ['--disable-blink-features=AutomationControlled'],
};

/**
 * Browser context configuration to avoid detection
 */
const CONTEXT_CONFIG = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 800 },
};

/**
 * Scrapes HTML from a URL using Playwright
 * 
 * @param url The URL to scrape
 * @param selector The CSS selector to wait for before extracting HTML
 * @returns The HTML content of the page
 */
export async function scrapeHtmlFromUrl(
  url: string,
  selector: string
): Promise<string> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    browser = await chromium.launch(BROWSER_CONFIG);
    context = await browser.newContext(CONTEXT_CONFIG);
    page = await context.newPage();

    // Navigate to the page
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the content to load
    await page.waitForSelector(selector);

    // Extract HTML
    const html = await page.content();

    return html;
  } catch (error) {
    console.error(`❌ Failed to scrape ${url}:`, error);
    throw new Error(`Failed to scrape ${url}: ${error}`);
  } finally {
    // Clean up resources
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
} 