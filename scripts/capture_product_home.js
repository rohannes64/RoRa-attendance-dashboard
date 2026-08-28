const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/raaga/.gemini/antigravity/brain/210f6b8e-5944-492f-99d9-29060977a14f';

async function captureProductHome() {
  console.log('Capturing Product Homepage...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera'],
  });

  const page = await context.newPage();

  // 1. Home Overview Top View
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const shot1 = path.join(ARTIFACT_DIR, 'product_homepage_hero.png');
  await page.screenshot({ path: shot1 });
  console.log(`Saved: ${shot1}`);

  // 2. Scroll down on Homepage to capture Process and Features
  await page.evaluate(() => {
    const main = document.querySelector('main > div');
    if (main) main.scrollTop = 700;
  });
  await page.waitForTimeout(1000);

  const shot2 = path.join(ARTIFACT_DIR, 'product_homepage_features.png');
  await page.screenshot({ path: shot2 });
  console.log(`Saved: ${shot2}`);

  // 3. Click "Launch Live Scanner →" CTA from Homepage
  const launchBtn = page.locator('button:has-text("Launch Live Scanner →")').first();
  if (await launchBtn.count() > 0) {
    await launchBtn.click();
    await page.waitForTimeout(1500);
  }

  const shot3 = path.join(ARTIFACT_DIR, 'product_homepage_to_scanner.png');
  await page.screenshot({ path: shot3 });
  console.log(`Saved: ${shot3}`);

  await browser.close();
  console.log('All product homepage screenshots captured successfully!');
}

captureProductHome().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
