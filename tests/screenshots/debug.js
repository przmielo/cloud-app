const { chromium } = require('playwright');

const FRONTEND = 'https://cloud-task-manager-frontend-pk-fkegfahnfpfpbagd.germanywestcentral-01.azurewebsites.net';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[BROWSER ${msg.type()}]`, msg.text()));
  page.on('requestfailed', req => console.log(`[FAILED] ${req.url()} - ${req.failure()?.errorText}`));
  page.on('response', resp => {
    if (!resp.url().includes('azurewebsites.net/api')) return;
    console.log(`[RESPONSE] ${resp.status()} ${resp.url()}`);
  });

  console.log('Loading result page for ID 33584...');
  await page.goto(`${FRONTEND}/result/33584`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  const bodyText = await page.textContent('body');
  console.log('---');
  console.log('Body contains error?', bodyText.includes('Nie można'));
  console.log('Body sample:', bodyText.substring(0, 200));

  await browser.close();
}

run().catch(e => { console.error('ERROR:', e); process.exit(1); });
