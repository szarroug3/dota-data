# Screenshot Guide

This guide explains how to take screenshots of HTML pages using the built-in screenshot tools in this project.

## Quick Start

### 1. Screenshot a Single Page

```bash
# Screenshot a local HTML file
pnpm screenshot file:///path/to/your/page.html ./screenshot.png

# Screenshot a web URL
pnpm screenshot http://localhost:3000 ./screenshot.png

# Screenshot with full page (captures entire page, not just viewport)
pnpm screenshot http://localhost:3000 ./screenshot.png --full-page
```

### 2. Screenshot Your App Pages

```bash
# Take screenshots of all configured app pages
pnpm screenshot:app
```

This will create screenshots of your app's main pages in the `./screenshots/` directory.

## Advanced Usage

### Using the TypeScript API

```typescript
import { takeScreenshot, takeBatchScreenshots } from './scripts/screenshot';

// Single page screenshot
await takeScreenshot({
  url: 'http://localhost:3000',
  outputPath: './screenshot.png',
  options: {
    fullPage: true,
    type: 'png',
    quality: 80
  },
  viewport: { width: 1920, height: 1080 },
  waitForSelector: '[data-testid="heroes-grid"]',
  waitForTimeout: 2000
});

// Batch screenshots
await takeBatchScreenshots({
  pages: [
    {
      url: 'http://localhost:3000/',
      outputPath: './screenshots/homepage.png',
      options: { fullPage: true },
      viewport: { width: 1920, height: 1080 }
    },
    {
      url: 'http://localhost:3000/heroes',
      outputPath: './screenshots/heroes.png',
      options: { fullPage: true },
      viewport: { width: 1920, height: 1080 },
      waitForSelector: '[data-testid="heroes-grid"]'
    }
  ],
  outputDir: './screenshots'
});
```

### Using the JavaScript API

```javascript
const { takeScreenshot, takeMultipleScreenshots } = require('./scripts/screenshot.js');

// Single page screenshot
await takeScreenshot('http://localhost:3000', './screenshot.png', {
  fullPage: true,
  type: 'png',
  quality: 80
});

// Multiple pages
await takeMultipleScreenshots([
  {
    url: 'http://localhost:3000/',
    outputPath: './screenshots/homepage.png',
    options: { fullPage: true }
  },
  {
    url: 'http://localhost:3000/heroes',
    outputPath: './screenshots/heroes.png',
    options: { fullPage: true }
  }
]);
```

## Configuration Options

### Screenshot Options

- `fullPage`: Capture the entire page, not just the viewport
- `clip`: Capture a specific area `{ x, y, width, height }`
- `omitBackground`: Remove background for transparent PNGs
- `type`: Output format (`png`, `jpeg`)
- `quality`: JPEG quality (1-100)

### Page Options

- `viewport`: Set browser viewport size
- `waitForSelector`: Wait for a specific element to appear
- `waitForTimeout`: Wait for a specific time (milliseconds)

### Browser Options

- `headless`: Run browser in headless mode (default: true)
- `slowMo`: Slow down actions for debugging (milliseconds)

## Examples

### Screenshot with Custom Viewport

```bash
# Mobile viewport
pnpm tsx scripts/screenshot.ts http://localhost:3000 ./mobile-screenshot.png
```

### Screenshot with Wait Conditions

```typescript
await takeScreenshot({
  url: 'http://localhost:3000/heroes',
  outputPath: './heroes-loaded.png',
  waitForSelector: '[data-testid="heroes-grid"]',
  waitForTimeout: 1000, // Wait 1 second after page loads
  options: { fullPage: true }
});
```

### Screenshot Specific Area

```typescript
await takeScreenshot({
  url: 'http://localhost:3000',
  outputPath: './header-only.png',
  options: {
    clip: { x: 0, y: 0, width: 1920, height: 100 }
  }
});
```

### Batch Screenshots with Different Viewports

```typescript
await takeBatchScreenshots({
  pages: [
    {
      url: 'http://localhost:3000',
      outputPath: './screenshots/desktop.png',
      viewport: { width: 1920, height: 1080 }
    },
    {
      url: 'http://localhost:3000',
      outputPath: './screenshots/tablet.png',
      viewport: { width: 768, height: 1024 }
    },
    {
      url: 'http://localhost:3000',
      outputPath: './screenshots/mobile.png',
      viewport: { width: 375, height: 667 }
    }
  ]
});
```

## Testing the Screenshot Tool

You can test the screenshot functionality using the provided test page:

```bash
# Screenshot the test page
pnpm screenshot file:///$(pwd)/test-page.html ./test-screenshot.png
```

## Troubleshooting

### Common Issues

1. **Page not loading**: Ensure the URL is accessible and the server is running
2. **Element not found**: Check that the `waitForSelector` matches an element on the page
3. **Screenshot is blank**: Try increasing `waitForTimeout` or adding `waitForSelector`
4. **Permission denied**: Ensure the output directory is writable

### Debug Mode

For debugging, you can run the browser in headed mode:

```typescript
await takeScreenshot({
  url: 'http://localhost:3000',
  outputPath: './debug-screenshot.png',
  browserOptions: {
    headless: false,
    slowMo: 1000 // Slow down for visibility
  }
});
```

## Integration with CI/CD

The screenshot tools can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Take Screenshots
  run: |
    pnpm dev &
    sleep 10
    pnpm screenshot:app
```

## Performance Tips

1. **Use headless mode** for faster execution
2. **Set appropriate timeouts** to avoid waiting too long
3. **Use specific selectors** instead of arbitrary timeouts
4. **Batch operations** when taking multiple screenshots
5. **Optimize image quality** based on your needs (PNG for quality, JPEG for size)

## File Formats

- **PNG**: Best for screenshots with text, logos, or transparency
- **JPEG**: Smaller file size, good for photos or complex graphics

## Browser Compatibility

The screenshot tools use Playwright's Chromium browser, which provides:
- Modern web standards support
- Consistent rendering across platforms
- Fast execution
- Reliable automation 