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

async function applyFix(page) {
  await page.addStyleTag({ content: FIX_CSS });
  await page.waitForTimeout(200);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 720, height: 1100 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // Get latest application ID
  const listResp = await page.request.get(`${BACKEND}/api/loanapplication`);
  const apps = await listResp.json();
  const latestId = apps[0].id;
  console.log(`Latest application ID: ${latestId}`);

  // Rys. 7 — Result page
  console.log('[1/3] Rys. 7 — strona wyniku (direct nav)...');
  await page.goto(`${FRONTEND}/result/${latestId}`, { waitUntil: 'networkidle', timeout: 60000 });
  await applyFix(page);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, 'rys07-wynik.png'), fullPage: true });

  // Rys. 8 — History
  console.log('[2/3] Rys. 8 — historia...');
  await page.goto(`${FRONTEND}/history`, { waitUntil: 'networkidle', timeout: 60000 });
  await applyFix(page);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, 'rys08-historia.png'), fullPage: true });

  // If history url didn't work, try via link
  const t = await page.textContent('body');
  if (t.includes('Nie można pobrać') || t.includes('Brak złożonych')) {
    console.log('  History API call failed — trying direct GET via JS...');
    // Force reload
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    await applyFix(page);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT, 'rys08-historia.png'), fullPage: true });
  }

  // Rys. 10 — Swagger
  console.log('[3/3] Rys. 10 — Swagger UI...');
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto(`${BACKEND}/swagger/index.html`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  // Try to expand the first endpoint
  const opblocks = page.locator('.opblock-summary');
  const n = await opblocks.count();
  console.log(`  Swagger opblocks: ${n}`);
  await page.screenshot({ path: path.join(OUT, 'rys10-swagger.png'), fullPage: true });

  await browser.close();
  console.log('\nFiles:');
  ['rys07-wynik.png', 'rys08-historia.png', 'rys10-swagger.png'].forEach(f => {
    const fp = path.join(OUT, f);
    if (fs.existsSync(fp)) console.log('  ', f, fs.statSync(fp).size, 'bytes');
  });
}

run().catch(e => { console.error('ERROR:', e); process.exit(1); });
