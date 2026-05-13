const { chromium } = require('playwright');
const path = require('path');

const OUT = path.resolve(__dirname, 'output');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto('file:///tmp/terminal.html', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'rys11-npm-test.png'), fullPage: true });
  console.log('Saved rys11-npm-test.png');
  await browser.close();
}

run().catch(e => { console.error('ERROR:', e); process.exit(1); });
