'use strict';

const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const { calculateDstI, calculateMonthlyInstalment, calculateLtV } = require('./calculators/dsti');
const { calculatePti, calculateDisposableIncome } = require('./calculators/indicators');
const { calculateScore, makeDecision } = require('./models/scorecard');

const app = express();
const PORT = process.env.PORT || 3001;
const START_TIME = Date.now();

app.use(cors());
app.use(express.json());

const scoreSchema = Joi.object({
  age: Joi.number().integer().min(18).max(80).required(),
  educationLevel: Joi.string()
    .valid('basic', 'vocational', 'secondary', 'higher').required(),
  maritalStatus: Joi.string()
    .valid('single', 'married', 'divorced', 'widowed').required(),
  dependents: Joi.number().integer().min(0).max(10).required(),
  employmentType: Joi.string()
    .valid('permanent', 'b2b', 'contract', 'pension', 'unemployed').required(),
  employmentYears: Joi.number().min(0).max(50).required(),
  monthlyIncome: Joi.number().min(0).required(),
  existingMonthlyDebt: Joi.number().min(0).required(),
  livingCosts: Joi.number().min(0).default(0),
  loanAmount: Joi.number().min(1000).required(),
  loanTermMonths: Joi.number().integer().min(3).max(360).required(),
  loanPurpose: Joi.string()
    .valid('housing', 'car', 'consumer', 'consolidation', 'other').required(),
  propertyValue: Joi.number().min(0).default(0),
  pastLoans: Joi.number().integer().min(0).default(0),
  latePayments: Joi.number().integer().min(0).default(0),
  creditHistoryMonths: Joi.number().integer().min(0).default(0),
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
  });
});

// Legacy alias kept for backwards compat with docker-compose health-checks
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/score', (req, res) => {
  const { error, value: data } = scoreSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message),
    });
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

  const pti = calculatePti(monthlyInstalment, Number(data.monthlyIncome));

  const disposableIncome = calculateDisposableIncome(
    Number(data.monthlyIncome),
    Number(data.existingMonthlyDebt),
    Number(data.livingCosts),
    monthlyInstalment
  );

  const ltv = calculateLtV(Number(data.loanAmount), Number(data.propertyValue));

  const score = calculateScore(data, dsti);
  const { outcome, reason } = makeDecision(score, dsti, disposableIncome);

  return res.json({
    score,
    dstI: parseFloat(dsti.toFixed(4)),
    pti: parseFloat(pti.toFixed(4)),
    ltV: ltv !== null ? parseFloat(ltv.toFixed(4)) : null,
    disposableIncome: parseFloat(disposableIncome.toFixed(2)),
    monthlyInstalment: parseFloat(monthlyInstalment.toFixed(2)),
    outcome,
    reason,
  });
});

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Scoring service running on port ${PORT}`);
  });
}

module.exports = app;
