'use strict';

const request = require('supertest');
const app = require('../server');

const validPayload = {
  age: 35,
  educationLevel: 'higher',
  maritalStatus: 'married',
  dependents: 2,
  employmentType: 'permanent',
  employmentYears: 8,
  monthlyIncome: 12000,
  existingMonthlyDebt: 800,
  loanAmount: 50000,
  loanTermMonths: 36,
  loanPurpose: 'consumer',
  propertyValue: 0,
  hasCreditHistory: true,
  pastDelays: 0,
};

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('1.0.0');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('POST /api/score', () => {
  it('returns 200 with score and decision for valid payload', async () => {
    const res = await request(app).post('/api/score').send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.score).toBeGreaterThanOrEqual(300);
    expect(res.body.score).toBeLessThanOrEqual(850);
    expect(['approve', 'manual', 'reject']).toContain(res.body.outcome);
    expect(res.body.dstI).toBeGreaterThan(0);
    expect(res.body.monthlyInstalment).toBeGreaterThan(0);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/score').send({ age: 30 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('returns 400 when age is out of range', async () => {
    const res = await request(app)
      .post('/api/score')
      .send({ ...validPayload, age: 15 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid employmentType', async () => {
    const res = await request(app)
      .post('/api/score')
      .send({ ...validPayload, employmentType: 'gig' });
    expect(res.status).toBe(400);
  });

  it('forces manual review when DStI > 50% (KNF Rekomendacja S)', async () => {
    const highDebtPayload = {
      ...validPayload,
      monthlyIncome: 3000,
      existingMonthlyDebt: 2000,
      loanAmount: 100000,
      loanTermMonths: 12,
    };
    const res = await request(app).post('/api/score').send(highDebtPayload);
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('manual');
    expect(res.body.dstI).toBeGreaterThan(0.5);
  });

  it('rejects unemployed applicant with low score', async () => {
    const rejectedPayload = {
      ...validPayload,
      employmentType: 'unemployed',
      employmentYears: 0,
      hasCreditHistory: true,
      pastDelays: 5,
      monthlyIncome: 1500,
    };
    const res = await request(app).post('/api/score').send(rejectedPayload);
    expect(res.status).toBe(200);
    expect(['reject', 'manual']).toContain(res.body.outcome);
  });
});
