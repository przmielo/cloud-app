const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FRONTEND = 'https://cloud-task-manager-frontend-pk-fkegfahnfpfpbagd.germanywestcentral-01.azurewebsites.net';
const BACKEND = 'https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net';
const OUT = path.resolve(__dirname, 'output');

const FIX_CSS = `
  body { display: block !important; min-height: auto !important; place-items: stretch !important; }
  #root { max-width: none !important; padding: 0 !important; text-align: left !important; }
`;

async function run() {
  const browser = await chromium.launch();

  // ===== Rys. 8 — Historia =====
  console.log('[1/2] Rys. 8 — historia...');
  {
    const context = await browser.newContext({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    // Intercept the history GET and return only the first 10 rows to avoid 33k-row table crashing the renderer
    await page.route('**/api/loanapplication', async route => {
      const req = route.request();
      if (req.method() !== 'GET') return route.continue();
      const upstream = await page.request.fetch(req);
      const arr = await upstream.json();
      const trimmed = arr.slice(0, 10);
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(trimmed),
      });
    });
    await page.goto(`${FRONTEND}/history`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.addStyleTag({ content: FIX_CSS });
    await page.waitForTimeout(4000);
    // viewport screenshot, not fullPage
    await page.screenshot({ path: path.join(OUT, 'rys08-historia.png'), fullPage: false });
    console.log('  saved rys08');
    await context.close();
  }

  // ===== Rys. 10 — Swagger =====
  console.log('[2/2] Rys. 10 — Swagger UI...');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${BACKEND}/swagger/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for opblocks
    await page.waitForSelector('.opblock', { timeout: 20000 }).catch(() => console.log('  no .opblock'));
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT, 'rys10-swagger.png'), fullPage: false });
    console.log('  saved rys10');
    await context.close();
  }

  await browser.close();
  console.log('Done.');
  ['rys08-historia.png', 'rys10-swagger.png'].forEach(f => {
    const fp = path.join(OUT, f);
    if (fs.existsSync(fp)) console.log('  ', f, fs.statSync(fp).size, 'bytes');
  });
}

run().catch(e => { console.error('ERROR:', e); process.exit(1); });
