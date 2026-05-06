'use strict';

const express = require('express');
const cors = require('cors');
const { calculateDstI, calculateMonthlyInstalment, calculateLtV } = require('./calculators/dsti');
const { calculateScore, makeDecision } = require('./models/scorecard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'scoring-service' });
});

app.post('/api/score', (req, res) => {
  const data = req.body;

  const required = [
    'age', 'monthlyIncome', 'loanAmount', 'loanTermMonths',
    'existingMonthlyDebt', 'employmentType'
  ];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  const monthlyInstalment = calculateMonthlyInstalment(
    Number(data.loanAmount),
    Number(data.loanTermMonths)
  );

  const dsti = calculateDstI(
    Number(data.existingMonthlyDebt),
    monthlyInstalment,
    Number(data.monthlyIncome)
  );

  const ltv = calculateLtV(Number(data.loanAmount), Number(data.propertyValue));

  const score = calculateScore(data, dsti);
  const { outcome, reason } = makeDecision(score, dsti);

  return res.json({
    score,
    dstI: parseFloat(dsti.toFixed(4)),
    ltV: ltv !== null ? parseFloat(ltv.toFixed(4)) : null,
    monthlyInstalment: parseFloat(monthlyInstalment.toFixed(2)),
    outcome,
    reason
  });
});

app.listen(PORT, () => {
  console.log(`Scoring service running on port ${PORT}`);
});

module.exports = app;
