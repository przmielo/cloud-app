'use strict';

const { calculateDstI, calculateMonthlyInstalment, calculateLtV } = require('../calculators/dsti');
const { calculatePti, calculateDisposableIncome } = require('../calculators/indicators');
const { calculateScore, makeDecision, scoreCreditHistory } = require('../models/scorecard');

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

describe('calculatePti', () => {
  test('computes PTI correctly for normal case', () => {
    // rata 990 / dochód 10000 = 0.099
    const pti = calculatePti(990, 10000);
    expect(pti).toBeCloseTo(0.099, 2);
  });

  test('returns 1 when income is 0', () => {
    expect(calculatePti(500, 0)).toBe(1);
  });

  test('returns 1 when income is negative', () => {
    expect(calculatePti(500, -1000)).toBe(1);
  });

  test('returns ratio less than DStI when there is existing debt', () => {
    const instalment = 1000;
    const income = 10000;
    const existingDebt = 500;
    const pti = calculatePti(instalment, income);
    const dsti = calculateDstI(existingDebt, instalment, income);
    expect(pti).toBeLessThan(dsti);
  });
});

describe('calculateDisposableIncome', () => {
  test('computes disposable income correctly', () => {
    // 10000 - 500 - 3000 - 990 = 5510
    const disp = calculateDisposableIncome(10000, 500, 3000, 990);
    expect(disp).toBeCloseTo(5510, 0);
  });

  test('returns negative value when costs exceed income', () => {
    const disp = calculateDisposableIncome(3000, 500, 2800, 990);
    expect(disp).toBeLessThan(0);
  });

  test('returns 0 when all costs equal income', () => {
    const disp = calculateDisposableIncome(5000, 1000, 2000, 2000);
    expect(disp).toBe(0);
  });

  test('returns full income when all costs are zero', () => {
    const disp = calculateDisposableIncome(8000, 0, 0, 0);
    expect(disp).toBe(8000);
  });
});

describe('scoreCreditHistory', () => {
  test('no history (0 months) returns 20 (neutral)', () => {
    expect(scoreCreditHistory(0, 0)).toBe(20);
  });

  test('short history (<12 months) returns 30', () => {
    expect(scoreCreditHistory(6, 0)).toBe(30);
  });

  test('moderate history (12-35 months) returns 50', () => {
    expect(scoreCreditHistory(24, 0)).toBe(50);
  });

  test('long history (>=36 months) returns 80', () => {
    expect(scoreCreditHistory(48, 0)).toBe(80);
  });

  test('one late payment reduces score by 20', () => {
    expect(scoreCreditHistory(48, 1)).toBe(60);
  });

  test('two late payments reduce score by 40', () => {
    expect(scoreCreditHistory(48, 2)).toBe(40);
  });

  test('three or more late payments returns 0', () => {
    expect(scoreCreditHistory(48, 3)).toBe(0);
    expect(scoreCreditHistory(48, 5)).toBe(0);
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
    creditHistoryMonths: 48,
    latePayments: 0,
  };

  test('score is within 300-850 range', () => {
    const score = calculateScore(baseData, 0.2);
    expect(score).toBeGreaterThanOrEqual(300);
    expect(score).toBeLessThanOrEqual(850);
  });

  test('good profile yields higher score than risky profile', () => {
    const goodScore = calculateScore({ ...baseData, latePayments: 0 }, 0.15);
    const badScore = calculateScore({
      ...baseData,
      age: 19,
      educationLevel: 'basic',
      maritalStatus: 'divorced',
      dependents: 5,
      employmentType: 'unemployed',
      employmentYears: 0,
      latePayments: 5,
      creditHistoryMonths: 0,
    }, 0.9);
    expect(goodScore).toBeGreaterThan(badScore);
  });
});

describe('makeDecision', () => {
  test('ACCEPT when score >= 700, DStI <= 0.5 and disposable income > 0', () => {
    const { outcome } = makeDecision(750, 0.3, 2000);
    expect(outcome).toBe('approve');
  });

  test('MANUAL when DStI > 0.5 regardless of score', () => {
    const { outcome } = makeDecision(800, 0.51, 1000);
    expect(outcome).toBe('manual');
  });

  test('MANUAL when disposable income <= 0 regardless of score', () => {
    const { outcome } = makeDecision(750, 0.3, 0);
    expect(outcome).toBe('manual');
  });

  test('MANUAL when score 550-699', () => {
    const { outcome } = makeDecision(600, 0.3, 1000);
    expect(outcome).toBe('manual');
  });

  test('REJECT when score < 550 and DStI <= 0.5', () => {
    const { outcome } = makeDecision(400, 0.25, 500);
    expect(outcome).toBe('reject');
  });
});
