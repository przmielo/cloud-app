'use strict';

const fs = require('fs');
const path = require('path');

const SCORING_URL = process.env.SCORING_URL ||
  'https://cloud-task-manager-scoring-pk.azurewebsites.net';

const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-cases.json'), 'utf-8')
);

const labels = ['approve', 'manual', 'reject'];

const matrix = {
  approve: { approve: 0, manual: 0, reject: 0 },
  manual:  { approve: 0, manual: 0, reject: 0 },
  reject:  { approve: 0, manual: 0, reject: 0 },
};

const errors = [];

(async () => {
  console.log(`\nEwaluacja modelu scoringowego na ${cases.length} przypadkach testowych`);
  console.log(`URL: ${SCORING_URL}\n`);

  for (const tc of cases) {
    let result;
    try {
      const res = await fetch(`${SCORING_URL}/api/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.input),
      });

      if (!res.ok) {
        const body = await res.text();
        errors.push({ id: tc.id, status: res.status, body });
        console.error(`  [${tc.id}] HTTP ${res.status}: ${body.slice(0, 80)}`);
        continue;
      }

      result = await res.json();
    } catch (err) {
      errors.push({ id: tc.id, networkError: err.message });
      console.error(`  [${tc.id}] Network error: ${err.message}`);
      continue;
    }

    const actual = tc.expectedOutcome;
    const predicted = result.outcome;

    if (!(actual in matrix) || !(predicted in matrix[actual])) {
      console.error(`  [${tc.id}] Nieznana klasa: actual=${actual}, predicted=${predicted}`);
      continue;
    }

    matrix[actual][predicted]++;

    const ok = actual === predicted;
    const symbol = ok ? '✓' : '✗';
    const detail = ok ? '' : ` → BŁĄD: oczekiwano ${actual}, model dał ${predicted} (score=${result.score}, DStI=${(result.dstI * 100).toFixed(1)}%, disp=${result.disposableIncome})`;
    console.log(`  [${tc.id}] ${symbol} ${tc.description.slice(0, 60)}${detail}`);

    if (!ok) {
      errors.push({
        id: tc.id,
        description: tc.description,
        expected: actual,
        got: predicted,
        score: result.score,
        dsti: result.dstI,
        disposableIncome: result.disposableIncome,
        reason: result.reason,
      });
    }
  }

  // Metryki
  const evaluated = cases.filter(tc =>
    Object.keys(matrix).some(l => matrix[l][tc.expectedOutcome] !== undefined)
  ).length - errors.filter(e => e.networkError || e.status).length;

  let correct = 0;
  for (const l of labels) correct += matrix[l][l];
  const total = labels.reduce((s, l) => s + Object.values(matrix[l]).reduce((a, b) => a + b, 0), 0);
  const accuracy = total > 0 ? correct / total : 0;

  const metrics = {};
  for (const l of labels) {
    const tp = matrix[l][l];
    const fp = labels.reduce((s, ll) => s + (ll !== l ? matrix[ll][l] : 0), 0);
    const fn = labels.reduce((s, ll) => s + (ll !== l ? matrix[l][ll] : 0), 0);
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall    = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    metrics[l] = { precision, recall, f1, support: tp + fn, tp, fp, fn };
  }

  const verdict = accuracy >= 0.80
    ? '✅ HIPOTEZA H2 POTWIERDZONA — accuracy ≥ 80%'
    : '❌ HIPOTEZA H2 ODRZUCONA — accuracy < 80%, wymagana analiza błędów';

  // Zapis wyników
  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });

  // confusion-matrix.json
  fs.writeFileSync(
    path.join(resultsDir, 'confusion-matrix.json'),
    JSON.stringify({ matrix, metrics, accuracy, total, correct, errors, verdict }, null, 2)
  );

  // metrics.csv
  const csvLines = [
    'Klasa,Precision,Recall,F1,Support',
    ...labels.map(l =>
      `${l},${metrics[l].precision.toFixed(3)},${metrics[l].recall.toFixed(3)},${metrics[l].f1.toFixed(3)},${metrics[l].support}`
    ),
    `overall (accuracy),${accuracy.toFixed(3)},,,${total}`,
  ];
  fs.writeFileSync(path.join(resultsDir, 'metrics.csv'), csvLines.join('\n'));

  // report-for-thesis.md
  const matrixMd = [
    '|  | Predicted APPROVE | Predicted MANUAL | Predicted REJECT |',
    '|---|---|---|---|',
    `| **Actual APPROVE** | ${matrix.approve.approve} | ${matrix.approve.manual} | ${matrix.approve.reject} |`,
    `| **Actual MANUAL**  | ${matrix.manual.approve}  | ${matrix.manual.manual}  | ${matrix.manual.reject}  |`,
    `| **Actual REJECT**  | ${matrix.reject.approve}  | ${matrix.reject.manual}  | ${matrix.reject.reject}  |`,
  ].join('\n');

  const metricsMd = [
    '| Klasa | Precision | Recall | F1 | Support |',
    '|---|---|---|---|---|',
    ...labels.map(l =>
      `| ${l.toUpperCase()} | ${(metrics[l].precision * 100).toFixed(1)}% | ${(metrics[l].recall * 100).toFixed(1)}% | ${(metrics[l].f1 * 100).toFixed(1)}% | ${metrics[l].support} |`
    ),
    `| **Accuracy** | | | **${(accuracy * 100).toFixed(1)}%** | **${total}** |`,
  ].join('\n');

  let errorsSection = '';
  if (errors.filter(e => e.expected).length > 0) {
    const mismatchRows = errors.filter(e => e.expected).map(e =>
      `| ${e.id} | ${e.expected} | ${e.got} | ${e.score} | ${e.reason?.slice(0, 60)} |`
    );
    errorsSection = `
## Przypadki błędnie sklasyfikowane

| ID | Oczekiwano | Model dał | Score | Powód modelu |
|---|---|---|---|---|
${mismatchRows.join('\n')}

### Analiza błędów

${errors.filter(e => e.expected).map(e =>
  `- **${e.id}** (oczekiwano: ${e.expected}, model: ${e.got}): DStI=${e.dsti ? (e.dsti * 100).toFixed(1) + '%' : 'N/A'}, dochód dyspozycyjny=${e.disposableIncome ?? 'N/A'} PLN`
).join('\n')}
`;
  }

  const reportMd = `# Wyniki ewaluacji modelu scoringowego — Hipoteza H2

**Data testu:** ${new Date().toISOString().slice(0, 10)}
**Liczba przypadków testowych:** ${total}
**Klasy:** APPROVE (${metrics.approve.support}), MANUAL (${metrics.manual.support}), REJECT (${metrics.reject.support})

## Macierz konfuzji (Tab. 10 w pracy)

${matrixMd}

## Metryki klasyfikacji (Tab. 11 w pracy)

${metricsMd}

## Werdykt

**${verdict}**

Dokładność modelu: **${(accuracy * 100).toFixed(1)}%** (${correct}/${total} poprawnych klasyfikacji).

${errorsSection}

## Metodologia

Test przeprowadzono na 25 ręcznie zaprojektowanych przypadkach zgodnie z metodyką opisaną w:
- Matuszyk A., *Credit Scoring*, wyd. II, CeDeWu, Warszawa 2018 — kryteria profilowania przypadków testowych
- Thomas L.C., Crook J., Edelman D., *Credit Scoring and Its Applications*, SIAM 2017 — interpretacja macierzy konfuzji
- Rekomendacja S KNF (uchwała nr 242/2023) — reguły override

Każdy przypadek testowy zawiera pole \`expectedRationale\` z uzasadnieniem klasyfikacji opartym na cytowanej literaturze.
`;

  fs.writeFileSync(path.join(resultsDir, 'report-for-thesis.md'), reportMd);

  // Podsumowanie na stdout
  console.log('\n=== MACIERZ KONFUZJI ===\n');
  console.log(matrixMd);
  console.log('\n=== METRYKI ===\n');
  console.log(metricsMd);
  console.log('\n' + verdict);
  console.log(`\nDokładność: ${(accuracy * 100).toFixed(1)}% (${correct}/${total})`);
  console.log('\nPliki wyjściowe:');
  console.log('  - tests/model-evaluation/results/confusion-matrix.json');
  console.log('  - tests/model-evaluation/results/metrics.csv');
  console.log('  - tests/model-evaluation/results/report-for-thesis.md');
})();
