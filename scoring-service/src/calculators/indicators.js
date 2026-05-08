'use strict';

// PTI (Payment to Income) — relacja samej raty do dochodu netto.
// Wskaźnik pomocniczy obok DStI (Matuszyk 2018, s. 88).
function calculatePti(monthlyInstalment, monthlyIncome) {
  if (monthlyIncome <= 0) return 1;
  return monthlyInstalment / monthlyIncome;
}

// Dochód dyspozycyjny — kwota pozostająca po zaspokojeniu zobowiązań,
// kosztów utrzymania i raty nowego kredytu.
// Zgodnie z Rekomendacją S KNF (uchwała 242/2023) musi być > 0.
function calculateDisposableIncome(monthlyIncome, existingMonthlyDebt, livingCosts, monthlyInstalment) {
  return monthlyIncome - existingMonthlyDebt - livingCosts - monthlyInstalment;
}

module.exports = { calculatePti, calculateDisposableIncome };
