'use strict';

const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, 'results', 'summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('Brak pliku results/summary.json. Najpierw uruchom test k6.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

const stages = ['10users', '50users', '100users'];
const vus    = { '10users': 10, '50users': 50, '100users': 100 };

const rows = [];

for (const stage of stages) {
  const key = `http_req_duration{stage:${stage}}`;
  const m = data.metrics[key];
  if (!m) {
    console.warn(`Brak metryk dla etapu ${stage}`);
    continue;
  }

  const rpsKey = `http_reqs{stage:${stage}}`;
  const rpsMetric = data.metrics[rpsKey];
  const rps = rpsMetric ? rpsMetric.values.rate.toFixed(2) : 'N/A';

  const failKey = `http_req_failed{stage:${stage}}`;
  const failMetric = data.metrics[failKey];
  const failRate = failMetric ? (failMetric.values.rate * 100).toFixed(2) + '%' : 'N/A';

  rows.push({
    etap: `Etap ${vus[stage]} VU`,
    vu: vus[stage],
    avg: m.values.avg.toFixed(0),
    p95: m.values['p(95)'].toFixed(0),
    p99: m.values['p(99)'].toFixed(0),
    rps,
    failRate,
  });
}

// Ogólny wynik H1
const overall = data.metrics['http_req_duration'];
const overallP95 = overall ? overall.values['p(95)'] : null;
const h1Passed = rows.length > 0 && rows.every(r => Number(r.p95) < 2000);
const verdict = h1Passed
  ? '✅ HIPOTEZA H1 POTWIERDZONA — p(95) < 2000 ms dla każdego etapu'
  : '❌ HIPOTEZA H1 ODRZUCONA — co najmniej jeden etap przekroczył próg 2000 ms';

// Tabela CSV
const csvHeader = 'Etap,Liczba VU,Średni czas (ms),95p (ms),99p (ms),RPS,% błędów';
const csvRows = rows.map(r =>
  `${r.etap},${r.vu},${r.avg},${r.p95},${r.p99},${r.rps},${r.failRate}`
);
const csvContent = [csvHeader, ...csvRows].join('\n');
fs.writeFileSync(path.join(__dirname, 'results', 'table-for-thesis.csv'), csvContent, 'utf-8');

// Tabela Markdown
const mdTable = [
  '| Etap | Liczba VU | Średni czas (ms) | p95 (ms) | p99 (ms) | RPS | % błędów |',
  '|---|---|---|---|---|---|---|',
  ...rows.map(r =>
    `| ${r.etap} | ${r.vu} | ${r.avg} | ${r.p95} | ${r.p99} | ${r.rps} | ${r.failRate} |`
  ),
].join('\n');

const mdContent = `# Wyniki testu wydajnościowego — Hipoteza H1

**Data testu:** ${new Date().toISOString().slice(0, 10)}
**Cel:** Weryfikacja H1 — średni czas odpowiedzi ≤ 2s przy 100 równoczesnych użytkownikach

## Tabela wyników (Tab. 9 w pracy)

${mdTable}

## Werdykt

${verdict}

${overallP95 !== null ? `Globalny p(95): **${overallP95.toFixed(0)} ms**` : ''}

## Metodologia

Test przeprowadzono narzędziem k6 na aplikacji wdrożonej w Azure.
Testowy endpoint: \`POST /api/loanapplication\` (pełny flow: backend → scoring service → Azure SQL).
Trzy etapy: 10, 50, 100 wirtualnych użytkowników przez 3 minuty każdy.
Próg H1: p(95) < 2000 ms i avg < 1500 ms dla każdego etapu.

Źródło metodologii: Matuszyk A., Credit Scoring, CeDeWu 2018 — weryfikacja niefunkcjonalna systemów oceny ryzyka.
`;

fs.writeFileSync(path.join(__dirname, 'results', 'results-for-thesis.md'), mdContent, 'utf-8');

console.log('\n=== WYNIKI TESTU WYDAJNOŚCIOWEGO ===\n');
console.log(mdTable);
console.log('\n' + verdict);
console.log('\nPliki wyjściowe:');
console.log('  - tests/load/results/table-for-thesis.csv');
console.log('  - tests/load/results/results-for-thesis.md');
