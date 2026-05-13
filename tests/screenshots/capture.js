const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FRONTEND = 'https://cloud-task-manager-frontend-pk-fkegfahnfpfpbagd.germanywestcentral-01.azurewebsites.net';
const BACKEND = 'https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net';
const OUT = path.resolve(__dirname, 'output');
fs.mkdirSync(OUT, { recursive: true });

// App constrains form content to maxWidth 640px (page style) and #root to
// max-width 1280px with 2rem padding (App.css). Body has place-items: center
// which centers content. We inject CSS to neutralize this and use a 720px
// viewport so the 640px content + small padding fills the screen.
const VIEWPORT = { width: 720, height: 1000 };

const FIX_CSS = `
  body { display: block !important; min-height: auto !important; place-items: stretch !important; }
  #root { max-width: none !important; padding: 0 !important; text-align: left !important; }
`;

async function applyFix(page) {
  await page.addStyleTag({ content: FIX_CSS });
  await page.waitForTimeout(200);
}

async function fillInput(page, idx, value, isSelect = false) {
  const inputs = page.locator(isSelect ? 'select' : 'input[type="number"]');
  const el = inputs.nth(idx);
  if (isSelect) {
    await el.selectOption(String(value));
  } else {
    await el.fill(String(value));
  }
}

async function clickNext(page) {
  await page.locator('button:has-text("Dalej")').first().click();
  await page.waitForTimeout(400);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // ===== Rys. 5 — formularz (krok 1, dane osobowe — pusty stan domyślny) =====
  console.log('[1/6] Rys. 5 — formularz krok 1...');
  await page.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 60000 });
  await applyFix(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'rys05-formularz.png'), fullPage: true });

  // ===== Rys. 6 — walidacja (wpisz wiek poza zakresem) =====
  console.log('[2/6] Rys. 6 — walidacja błędu...');
  await page.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 60000 });
  await applyFix(page);
  await page.waitForTimeout(1000);
  // Wiek = 150 (poza max=80) — natywna walidacja HTML5 powinna pokazać błąd
  const ageInput = page.locator('input[type="number"]').first();
  await ageInput.fill('150');
  await ageInput.evaluate(el => el.reportValidity());
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'rys06-walidacja.png'), fullPage: true });

  // ===== Rys. 7 — strona wyniku (po pełnym submit) =====
  console.log('[3/6] Wypełniam wniosek...');
  await page.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 60000 });
  await applyFix(page);
  await page.waitForTimeout(1500);

  // KROK 1: Dane osobowe (4 pola)
  // order: age (input), educationLevel (select), maritalStatus (select), dependents (input)
  await page.locator('input[type="number"]').nth(0).fill('35'); // age
  await page.locator('select').nth(0).selectOption('higher'); // edu
  await page.locator('select').nth(1).selectOption('married'); // marital
  await page.locator('input[type="number"]').nth(1).fill('1'); // dependents
  await clickNext(page);

  // KROK 2: Zatrudnienie + dochód
  // employmentType (select), employmentYears (input), monthlyIncome (input)
  await page.locator('select').first().selectOption('permanent');
  await page.locator('input[type="number"]').nth(0).fill('8');
  await page.locator('input[type="number"]').nth(1).fill('12000');
  await clickNext(page);

  // KROK 3: Zobowiązania i historia kredytowa
  // existingMonthlyDebt, livingCosts, pastLoans, creditHistoryMonths, latePayments
  await page.locator('input[type="number"]').nth(0).fill('500');
  await page.locator('input[type="number"]').nth(1).fill('3500');
  await page.locator('input[type="number"]').nth(2).fill('2');
  await page.locator('input[type="number"]').nth(3).fill('84');
  await page.locator('input[type="number"]').nth(4).fill('0');
  await clickNext(page);

  // KROK 4: Kredyt — loanAmount, loanTermMonths, loanPurpose (select), propertyValue
  await page.locator('input[type="number"]').nth(0).fill('50000');
  await page.locator('input[type="number"]').nth(1).fill('36');
  await page.locator('select').first().selectOption('consumer');
  // propertyValue - input nth(2) jeśli istnieje (warunkowo na housing - tu nie ma)
  await page.waitForTimeout(400);

  // Submit
  console.log('[4/6] Rys. 7 — submit i czekam na stronę wyniku...');
  const submitBtn = page.locator('button:has-text("Złóż"), button:has-text("Wyślij"), button:has-text("Submit")').first();
  if (await submitBtn.count() === 0) {
    // fallback - last button on page
    await page.locator('button').last().click();
  } else {
    await submitBtn.click();
  }
  // Czekamy aż URL zmieni się na /result/...
  try {
    await page.waitForURL('**/result/**', { timeout: 60000 });
    await page.waitForTimeout(2500);
    await applyFix(page);
    await page.waitForTimeout(300);
  } catch (e) {
    console.log('  (no result URL change — using current page anyway)');
  }
  await page.screenshot({ path: path.join(OUT, 'rys07-wynik.png'), fullPage: true });

  // ===== Rys. 8 — Historia =====
  console.log('[5/6] Rys. 8 — historia...');
  const histLink = page.locator('a:has-text("Historia")').first();
  if (await histLink.count() > 0) {
    await histLink.click();
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
  }
  await applyFix(page);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, 'rys08-historia.png'), fullPage: true });

  // ===== Rys. 10 — Swagger UI =====
  console.log('[6/6] Rys. 10 — Swagger UI...');
  // Większy viewport na Swaggera
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BACKEND + '/swagger/index.html', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, 'rys10-swagger.png'), fullPage: true });

  await browser.close();
  console.log('\nDone. Files:');
  fs.readdirSync(OUT).forEach(f => console.log('  ', f, fs.statSync(path.join(OUT, f)).size, 'bytes'));
}

run().catch(e => { console.error('ERROR:', e); process.exit(1); });
