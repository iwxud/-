const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
(async () => {
  const dir = path.join(__dirname, 'game', fs.readdirSync(path.join(__dirname,'game'))[0]);
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const logs = [];
  page.on('console', m => logs.push('[console] '+m.text()));
  page.on('pageerror', e => logs.push('[pageerror] '+e.message));
  await page.goto('file://' + path.join(dir, 'index.html'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'shot_before.png' });
  // press space to start
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => {
    const R = window.Runner && window.Runner.instance_;
    if (!R) return 'no instance';
    return { playing: R.playing, activated: R.activated, distanceRan: Math.round(R.distanceRan), obstacles: R.horizon ? R.horizon.obstacles.length : -1, crashed: R.crashed };
  });
  console.log('state after space+1.5s:', JSON.stringify(state));
  await page.screenshot({ path: 'shot_playing.png' });
  await page.waitForTimeout(2000);
  const state2 = await page.evaluate(() => {
    const R = window.Runner.instance_;
    return { playing: R.playing, distanceRan: Math.round(R.distanceRan), crashed: R.crashed, obstacles: R.horizon.obstacles.length };
  });
  console.log('state after 3.5s:', JSON.stringify(state2));
  await page.screenshot({ path: 'shot_later.png' });
  console.log(logs.join('\n') || 'no errors');
  await browser.close();
})();
