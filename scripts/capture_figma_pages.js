const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/raaga/.gemini/antigravity/brain/210f6b8e-5944-492f-99d9-29060977a14f';

async function captureFigmaPages() {
  console.log('Starting screenshot capture of exact Figma pages...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera'],
  });

  const page = await context.newPage();

  // Page 1: Live Scanner
  console.log('Capturing Figma Live Scanner...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const shot1 = path.join(ARTIFACT_DIR, 'figma_page1_live_scanner.png');
  await page.screenshot({ path: shot1 });
  console.log(`Saved: ${shot1}`);

  // Page 2: Attendance Page
  console.log('Capturing Figma Attendance Page...');
  const attendanceNav = page.locator('button:has-text("Attendance")');
  await attendanceNav.click();
  await page.waitForTimeout(1500);

  // Click first student to show weekly history drawer
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.click();
  await page.waitForTimeout(1000);

  const shot2 = path.join(ARTIFACT_DIR, 'figma_page2_attendance.png');
  await page.screenshot({ path: shot2 });
  console.log(`Saved: ${shot2}`);

  // Page 3: Enroll Student Page
  console.log('Capturing Figma Enroll Student Page...');
  const enrollNav = page.locator('button:has-text("Enroll Student")');
  await enrollNav.click();
  await page.waitForTimeout(1500);
  const shot3 = path.join(ARTIFACT_DIR, 'figma_page3_enroll.png');
  await page.screenshot({ path: shot3 });
  console.log(`Saved: ${shot3}`);

  await browser.close();
  console.log('All Figma pages captured successfully!');
}

captureFigmaPages().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
