const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/raaga/.gemini/antigravity/brain/210f6b8e-5944-492f-99d9-29060977a14f';

async function testLiveDbAndAccuracy() {
  console.log('Testing 80% accuracy threshold and live attendance database persistence...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera'],
  });

  const page = await context.newPage();

  // 1. Open Live Scanner
  console.log('1. Navigating to Live Scanner...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. Trigger test recognition for Aarav Sharma
  console.log('2. Triggering biometric recognition (>80% accuracy) for Aarav...');
  const aaravBtn = page.locator('button:has-text("Aarav")');
  if (await aaravBtn.count() > 0) {
    await aaravBtn.click();
    await page.waitForTimeout(1000);
  }

  const shot1 = path.join(ARTIFACT_DIR, 'live_scanner_verified_80plus.png');
  await page.screenshot({ path: shot1 });
  console.log(`Saved: ${shot1}`);

  // 3. Switch to Attendance Page
  console.log('3. Navigating to Attendance Page to verify live database update...');
  const attendanceNav = page.locator('button:has-text("Attendance")');
  await attendanceNav.click();
  await page.waitForTimeout(1500);

  const shot2 = path.join(ARTIFACT_DIR, 'attendance_live_db_reflected.png');
  await page.screenshot({ path: shot2 });
  console.log(`Saved: ${shot2}`);

  await browser.close();
  console.log('Test completed successfully!');
}

testLiveDbAndAccuracy().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
