const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/raaga/.gemini/antigravity/brain/210f6b8e-5944-492f-99d9-29060977a14f';

async function runTestFlow() {
  console.log('Launching browser automation...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera'],
  });

  const page = await context.newPage();

  // TURN 1: Load Homepage / Sessions Hub
  console.log('--- TURN 1: Loading Sessions Hub ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const shot1 = path.join(ARTIFACT_DIR, 'turn1_sessions_hub.png');
  await page.screenshot({ path: shot1 });
  console.log(`Saved screenshot 1: ${shot1}`);

  // TURN 2: Click Start Session on CS301
  console.log('--- TURN 2: Starting CS301 Session ---');
  const startButton = page.locator('button:has-text("Start Session")').first();
  await startButton.click();
  await page.waitForTimeout(2500);
  const shot2 = path.join(ARTIFACT_DIR, 'turn2_live_session_scanner.png');
  await page.screenshot({ path: shot2 });
  console.log(`Saved screenshot 2: ${shot2}`);

  // TURN 3: Click Test Preset Students
  console.log('--- TURN 3: Scanning Test Presets (Aarav, Diya, Rohan) ---');
  const presetButtons = page.locator('button[title*="Simulate scan"]');
  const count = await presetButtons.count();
  console.log(`Found ${count} simulation presets`);

  if (count > 0) {
    await presetButtons.nth(0).click();
    await page.waitForTimeout(1200);
    if (count > 1) {
      await presetButtons.nth(1).click();
      await page.waitForTimeout(1200);
    }
    if (count > 2) {
      await presetButtons.nth(2).click();
      await page.waitForTimeout(1200);
    }
  }

  await page.waitForTimeout(2000);
  const shot3 = path.join(ARTIFACT_DIR, 'turn3_live_verified_stream.png');
  await page.screenshot({ path: shot3 });
  console.log(`Saved screenshot 3: ${shot3}`);

  // TURN 4: Switch to Attendance Register tab inside session
  console.log('--- TURN 4: Switching to Attendance Register ---');
  const attTab = page.locator('button:has-text("Attendance Register")');
  await attTab.click();
  await page.waitForTimeout(2000);
  const shot4 = path.join(ARTIFACT_DIR, 'turn4_session_attendance_register.png');
  await page.screenshot({ path: shot4 });
  console.log(`Saved screenshot 4: ${shot4}`);

  // TURN 5: Open Enroll Student Modal from Sidebar
  console.log('--- TURN 5: Opening Biometric Enrollment Studio ---');
  const enrollNav = page.locator('button:has-text("Enroll Student")');
  await enrollNav.click();
  await page.waitForTimeout(2000);
  const shot5 = path.join(ARTIFACT_DIR, 'turn5_enrollment_studio.png');
  await page.screenshot({ path: shot5 });
  console.log(`Saved screenshot 5: ${shot5}`);

  await browser.close();
  console.log('Test interaction sequence completed successfully!');
}

runTestFlow().catch((err) => {
  console.error('Automation test error:', err);
  process.exit(1);
});
