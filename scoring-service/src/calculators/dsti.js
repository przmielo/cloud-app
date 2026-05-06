'use strict';

// Debt Service to Income ratio (Rekomendacja S KNF, uchwała nr 242/2023)
// DStI = (suma miesięcznych rat kredytowych + nowa rata) / miesięczny dochód netto
function calculateDstI(existingMonthlyDebt, monthlyInstalment, monthlyIncome) {
  if (monthlyIncome <= 0) return 1;
  return (existingMonthlyDebt + monthlyInstalment) / monthlyIncome;
}

// Annuity instalment at fixed annual rate 7%
function calculateMonthlyInstalment(loanAmount, loanTermMonths) {
  const annualRate = 0.07;
  const r = annualRate / 12;
  if (loanTermMonths <= 0) return loanAmount;
  if (r === 0) return loanAmount / loanTermMonths;
  const factor = Math.pow(1 + r, loanTermMonths);
  return (loanAmount * r * factor) / (factor - 1);
}

// Loan to Value ratio
function calculateLtV(loanAmount, propertyValue) {
  if (!propertyValue || propertyValue <= 0) return null;
  return loanAmount / propertyValue;
}

module.exports = { calculateDstI, calculateMonthlyInstalment, calculateLtV };
