import fs from 'fs';
import path from 'path';

import { chromium } from 'playwright';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: pnpm screenshot <input.html> <output.png>');
  process.exit(1);
}

const absoluteInputPath = path.resolve(inputPath);
const absoluteOutputPath = path.resolve(outputPath);

if (!fs.existsSync(absoluteInputPath)) {
  console.error(`Input file does not exist: ${absoluteInputPath}`);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }, // Standard viewport height
  });

  await page.goto(`file://${absoluteInputPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Expand the .content area to show all content (remove scroll/overflow)
  await page.evaluate(() => {
    const selectors = ['.dashboard-layout', '.main-content', '.content'];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        (el as HTMLElement).style.height = 'auto';
        (el as HTMLElement).style.maxHeight = 'none';
        (el as HTMLElement).style.overflow = 'visible';
        // DO NOT set flex or display here!
      }
    });
  });

  await page.screenshot({
    path: absoluteOutputPath,
    fullPage: true, // Only content height will be captured
  });

  await browser.close();

  console.log(`✅ Screenshot saved to: ${absoluteOutputPath}`);
})(); 