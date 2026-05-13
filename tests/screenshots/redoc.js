const { chromium } = require('playwright');
const path = require('path');

const OUT = path.resolve(__dirname, 'output');

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  console.log('Loading Redoc page...');
  await page.goto('file:///tmp/redoc.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Wait for redoc to render
  await page.waitForSelector('.api-info', { timeout: 30000 }).catch(() => console.log('no .api-info'));
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(OUT, 'rys10-swagger.png'), fullPage: false });
  console.log('Saved rys10-swagger.png');
  await browser.close();
}

run().catch(e => { console.error('ERROR:', e); process.exit(1); });
