'use strict';

const { calculateDstI, calculateMonthlyInstalment, calculateLtV } = require('../calculators/dsti');
const { calculateScore, makeDecision } = require('../models/scorecard');

describe('calculateMonthlyInstalment', () => {
  test('returns instalment > 0 for positive loan', () => {
    const inst = calculateMonthlyInstalment(50000, 60);
    expect(inst).toBeGreaterThan(0);
    expect(inst).toBeCloseTo(990.06, 0);
  });

  test('handles 0 term by returning full amount', () => {
    const inst = calculateMonthlyInstalment(10000, 0);
    expect(inst).toBe(10000);
  });
});

describe('calculateDstI', () => {
  test('computes ratio correctly', () => {
    // (800 + 990) / 10000 = 0.179
    const dsti = calculateDstI(800, 990, 10000);
    expect(dsti).toBeCloseTo(0.179, 2);
  });

  test('returns 1 when income is 0', () => {
    expect(calculateDstI(0, 0, 0)).toBe(1);
  });

  test('returns 1 when income is negative', () => {
    expect(calculateDstI(500, 500, -100)).toBe(1);
  });
});

describe('calculateLtV', () => {
  test('returns ratio for housing loan', () => {
    expect(calculateLtV(200000, 400000)).toBeCloseTo(0.5, 2);
  });

  test('returns null when propertyValue is 0', () => {
    expect(calculateLtV(50000, 0)).toBeNull();
  });

  test('returns null when propertyValue is missing', () => {
    expect(calculateLtV(50000, undefined)).toBeNull();
  });
});

describe('calculateScore', () => {
  const baseData = {
    age: 40,
    educationLevel: 'higher',
    maritalStatus: 'married',
    dependents: 1,
    employmentType: 'permanent',
    employmentYears: 10,
    loanPurpose: 'housing',
    hasCreditHistory: true,
    pastDelays: 0,
  };

  test('score is within 300-850 range', () => {
    const score = calculateScore(baseData, 0.2);
    expect(score).toBeGreaterThanOrEqual(300);
    expect(score).toBeLessThanOrEqual(850);
  });

  test('good profile yields higher score than risky profile', () => {
    const goodScore = calculateScore({ ...baseData, pastDelays: 0 }, 0.15);
    const badScore = calculateScore({
      ...baseData,
      age: 19,
      educationLevel: 'basic',
      maritalStatus: 'divorced',
      dependents: 5,
      employmentType: 'unemployed',
      employmentYears: 0,
      pastDelays: 5,
    }, 0.9);
    expect(goodScore).toBeGreaterThan(badScore);
  });
});

describe('makeDecision', () => {
  test('ACCEPT when score >= 700 and DStI <= 0.5', () => {
    const { outcome } = makeDecision(750, 0.3);
    expect(outcome).toBe('approve');
  });

  test('MANUAL_REVIEW when DStI > 0.5 regardless of score', () => {
    const { outcome } = makeDecision(800, 0.51);
    expect(outcome).toBe('manual');
  });

  test('MANUAL_REVIEW when score 550-699', () => {
    const { outcome } = makeDecision(600, 0.3);
    expect(outcome).toBe('manual');
  });

  test('REJECT when score < 550 and DStI <= 0.5', () => {
    const { outcome } = makeDecision(400, 0.25);
    expect(outcome).toBe('reject');
  });
});
