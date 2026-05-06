'use strict';

// Klasyczna karta scoringowa (scorecard) – skala 300-850 (standard FICO)
// Źródło: Matuszyk A., Credit Scoring, wyd. II, CeDeWu, Warszawa 2018, rozdz. 4
// Źródło: Thomas L., Crook J., Edelman D., Credit Scoring and Its Applications, SIAM 2017, rozdz. 3

const BASE_SCORE = 300;
const MAX_SCORE = 850;

// Each category returns points 0..max
function scoreAge(age) {
  if (age >= 35 && age <= 55) return 50;
  if (age >= 25 && age < 35)  return 35;
  if (age > 55 && age <= 65)  return 30;
  return 15;
}

function scoreEducation(level) {
  const map = { higher: 40, secondary: 25, basic: 10 };
  return map[level] ?? 10;
}

function scoreMaritalStatus(status) {
  const map = { married: 20, single: 15, divorced: 10 };
  return map[status] ?? 10;
}

function scoreDependents(count) {
  if (count === 0) return 20;
  if (count === 1) return 15;
  if (count === 2) return 10;
  return 0;
}

function scoreEmploymentType(type) {
  const map = { permanent: 60, self: 40, contract: 30, unemployed: 0 };
  return map[type] ?? 0;
}

function scoreEmploymentYears(years) {
  if (years >= 5)  return 50;
  if (years >= 2)  return 35;
  if (years >= 1)  return 20;
  return 5;
}

function scoreDstI(dsti) {
  if (dsti <= 0.2)  return 100;
  if (dsti <= 0.3)  return 80;
  if (dsti <= 0.4)  return 50;
  if (dsti <= 0.5)  return 20;
  return 0;
}

function scoreCreditHistory(hasCreditHistory, pastDelays) {
  if (!hasCreditHistory) return 20; // neutral – no history
  if (pastDelays === 0)  return 80;
  if (pastDelays === 1)  return 40;
  if (pastDelays === 2)  return 10;
  return 0;
}

function scoreLoanPurpose(purpose) {
  const map = { housing: 30, car: 20, consumer: 10, other: 5 };
  return map[purpose] ?? 5;
}

// Total raw points range: 0 .. 450
// Map linearly to 300-850
function calculateScore(data, dsti) {
  const raw =
    scoreAge(data.age) +
    scoreEducation(data.educationLevel) +
    scoreMaritalStatus(data.maritalStatus) +
    scoreDependents(data.dependents) +
    scoreEmploymentType(data.employmentType) +
    scoreEmploymentYears(data.employmentYears) +
    scoreDstI(dsti) +
    scoreCreditHistory(data.hasCreditHistory, data.pastDelays) +
    scoreLoanPurpose(data.loanPurpose);

  const maxRaw = 450;
  const score = Math.round(BASE_SCORE + (raw / maxRaw) * (MAX_SCORE - BASE_SCORE));
  return Math.min(MAX_SCORE, Math.max(BASE_SCORE, score));
}

// Progi decyzyjne (Matuszyk 2018, rozdz. 6)
function makeDecision(score, dsti) {
  // DStI override per Rekomendacja S KNF
  if (dsti > 0.5) {
    return { outcome: 'manual', reason: 'Wskaźnik DStI przekracza 50% – wymagana analiza manualna zgodnie z Rekomendacją S KNF.' };
  }
  if (score >= 700) {
    return { outcome: 'approve', reason: 'Scoring powyżej 700 pkt – automatyczna akceptacja.' };
  }
  if (score >= 550) {
    return { outcome: 'manual', reason: 'Scoring w przedziale 550-699 pkt – skierowanie do analizy manualnej.' };
  }
  return { outcome: 'reject', reason: 'Scoring poniżej 550 pkt – automatyczne odrzucenie.' };
}

module.exports = { calculateScore, makeDecision };
