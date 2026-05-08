# Model oceny ryzyka kredytowego — Dokumentacja techniczna

> Plik stanowi **źródło prawdy** dla Tabel 7 i 8 w pracy pisemnej.
> Wszystkie wartości odpowiadają implementacji w `scoring-service/src/models/scorecard.js`.

## Skala scoringu

**Zakres:** 300–850 punktów (wzorowane na FICO Score)
**Źródło:** Matuszyk A., *Credit Scoring*, wyd. II, CeDeWu, Warszawa 2018, rozdz. 4; Thomas L.C., Crook J., Edelman D., *Credit Scoring and Its Applications*, SIAM 2017, rozdz. 3

**Formuła mapowania:**

```
score = BASE_SCORE + (raw / MAX_RAW) × (MAX_SCORE - BASE_SCORE)
score = 300 + (raw / 450) × 550
```

Gdzie `raw` to suma punktów ze wszystkich kategorii (zakres 0–450).

## Progi decyzyjne (Tab. 7 w pracy)

| Zakres scoringu | Decyzja | Uzasadnienie |
|---|---|---|
| 700–850 | **APPROVE** | Klient wiarygodny — automatyczna akceptacja |
| 550–699 | **MANUAL** | Wymagana decyzja analityka |
| 300–549 | **REJECT** | Automatyczne odrzucenie |

**Reguły nadrzędne (override):**
1. Jeśli **dochód dyspozycyjny ≤ 0** → zawsze MANUAL (Rekomendacja S KNF)
2. Jeśli **DStI > 50%** → zawsze MANUAL (Rekomendacja S KNF, uchwała 242/2023)

Reguła 1 ma wyższy priorytet niż reguła 2.

## Wagi karty punktowej (Tab. 8 w pracy)

### Źródło: `scoring-service/src/models/scorecard.js`

---

### 1. Wiek (`scoreAge`) — max 50 pkt

| Przedział | Punkty | Uzasadnienie |
|---|---|---|
| 35–55 lat | 50 | Sweet spot — stabilność życiowa i zawodowa |
| 25–34 lata | 35 | Rosnąca stabilność |
| 56–65 lat | 30 | Zbliżający się wiek emerytalny |
| < 25 lub > 65 | 15 | Youngest/oldest — wyższe ryzyko |

*Źródło: Matuszyk 2018, s. 97 — wiek jako predyktor stabilności.*

---

### 2. Wykształcenie (`scoreEducation`) — max 40 pkt

| Wartość | Punkty | Uzasadnienie |
|---|---|---|
| `higher` | 40 | Wyższe wykształcenie — korelacja z dochodem |
| `secondary` | 25 | Średnie |
| `vocational` | 20 | Zawodowe |
| `basic` | 10 | Podstawowe |

*Źródło: Matuszyk 2018, s. 97 — wykształcenie jako proxi stabilności zatrudnienia.*

---

### 3. Stan cywilny (`scoreMaritalStatus`) — max 20 pkt

| Wartość | Punkty | Uzasadnienie |
|---|---|---|
| `married` | 20 | Małżeństwo — dodatkowe zabezpieczenie dochodu |
| `single` | 15 | Kawaler/Panna |
| `widowed` | 15 | Wdowiec/Wdowa |
| `divorced` | 10 | Rozwód — możliwe zobowiązania alimentacyjne |

*Źródło: Matuszyk 2018, s. 98 — stan cywilny jako wskaźnik stabilności.*

---

### 4. Osoby na utrzymaniu (`scoreDependents`) — max 20 pkt

| Liczba | Punkty | Uzasadnienie |
|---|---|---|
| 0 | 20 | Brak zobowiązań rodzinnych |
| 1 | 15 | Jedno dziecko |
| 2 | 10 | Dwoje dzieci |
| ≥ 3 | 0 | Wysokie koszty utrzymania |

*Źródło: Thomas, Crook, Edelman 2017, s. 45 — liczba dependentów obniża dochód dyspozycyjny.*

---

### 5. Forma zatrudnienia (`scoreEmploymentType`) — max 60 pkt

| Wartość | Punkty | Uzasadnienie |
|---|---|---|
| `permanent` | 60 | Umowa o pracę — najwyższa stabilność |
| `b2b` | 50 | B2B/działalność — stabilna po 5+ latach |
| `contract` | 30 | Umowa zlecenie/dzieło — tymczasowa |
| `pension` | 20 | Emerytura/renta — stały ale niski dochód |
| `unemployed` | 0 | Brak dochodu — automatyczne odrzucenie |

*Źródło: Matuszyk 2018, s. 99 — forma zatrudnienia jako kluczowy predyktor ryzyka.*

---

### 6. Staż pracy (`scoreEmploymentYears`) — max 50 pkt

| Staż | Punkty | Uzasadnienie |
|---|---|---|
| ≥ 5 lat | 50 | Stabilne, długoterminowe zatrudnienie |
| 2–4 lata | 35 | Rozwijająca się kariera |
| 1–1,99 roku | 20 | Nowe zatrudnienie |
| < 1 roku | 5 | Krótki staż — wysokie ryzyko utraty pracy |

*Źródło: Matuszyk 2018, s. 99 — staż jako miara stabilności zatrudnienia.*

---

### 7. DStI (`scoreDstI`) — max 100 pkt

| Zakres DStI | Punkty | Uzasadnienie |
|---|---|---|
| ≤ 20% | 100 | Bezpieczny poziom zadłużenia |
| 21–30% | 80 | Umiarkowany |
| 31–40% | 50 | Graniczny |
| 41–50% | 20 | Ryzykowny (przy > 50% override do manual) |
| > 50% | 0 | Override KNF — zawsze manual |

*Źródło: Matuszyk 2018, s. 100; Rekomendacja S KNF (uchwała 242/2023).*

---

### 8. Historia kredytowa (`scoreCreditHistory`) — max 80 pkt

Punkty bazowe za długość historii:

| Długość historii | Punkty bazowe |
|---|---|
| 0 miesięcy (brak) | 20 |
| 1–11 miesięcy | 30 |
| 12–35 miesięcy | 50 |
| ≥ 36 miesięcy | 80 |

Kara za opóźnienia w spłacie:

| Liczba opóźnień | Korekta |
|---|---|
| 0 | brak |
| 1 | −20 pkt |
| 2 | −40 pkt |
| ≥ 3 | całkowite wyzerowanie (0 pkt) |

Wynik końcowy = max(0, punkty bazowe + korekta)

*Źródło: Matuszyk 2018, s. 102 — długość historii i opóźnienia jako główne predyktory defaultu.*

---

### 9. Cel kredytu (`scoreLoanPurpose`) — max 30 pkt

| Wartość | Punkty | Uzasadnienie |
|---|---|---|
| `housing` | 30 | Kredyt mieszkaniowy — zabezpieczone |
| `car` | 20 | Samochodowy — umiarkowane zabezpieczenie |
| `consolidation` | 15 | Konsolidacyjny — porządkuje zobowiązania |
| `consumer` | 10 | Konsumpcyjny — niezabezpieczony |
| `other` | 5 | Inne — najwyższe ryzyko |

*Źródło: Matuszyk 2018, s. 101 — cel kredytu jako wskaźnik ryzyka.*

---

## Podsumowanie wag (Tab. 8 w pracy)

| Kategoria | Zmienna | Max punktów |
|---|---|---|
| DStI (wskaźnik finansowy) | `dsti` | 100 |
| Forma zatrudnienia | `employmentType` | 60 |
| Staż pracy | `employmentYears` | 50 |
| Historia kredytowa | `creditHistoryMonths` + `latePayments` | 80 |
| Wykształcenie | `educationLevel` | 40 |
| Wiek | `age` | 50 |
| Stan cywilny | `maritalStatus` | 20 |
| Osoby na utrzymaniu | `dependents` | 20 |
| Cel kredytu | `loanPurpose` | 30 |
| **ŁĄCZNIE** | | **450** |

**Przykład obliczenia** (idealny kandydat, TC-001):

| Kategoria | Wartość | Punkty |
|---|---|---|
| Wiek (35 lat) | sweet spot | 50 |
| Wykształcenie (higher) | max | 40 |
| Stan cywilny (married) | max | 20 |
| Dependents (1) | 1 dziecko | 15 |
| Zatrudnienie (permanent) | max | 60 |
| Staż (10 lat) | max | 50 |
| DStI (~10%) | ≤ 20% | 100 |
| Historia (120 mc, 0 opóźnień) | długa + bez kary | 80 |
| Cel (consumer) | | 10 |
| **Raw suma** | | **425** |
| **Score = 300 + (425/450) × 550** | | **≈ 820** |

## Wskaźniki finansowe

### DStI (Debt Service to Income)

```
DStI = (existingMonthlyDebt + monthlyInstalment) / monthlyIncome
```

Próg KNF: > 50% → override do MANUAL (Rekomendacja S KNF, uchwała 242/2023, §8)

### PTI (Payment to Income)

```
PTI = monthlyInstalment / monthlyIncome
```

Wskaźnik pomocniczy — relacja samej nowej raty do dochodu. Źródło: Matuszyk 2018, s. 88.

### LtV (Loan to Value)

```
LtV = loanAmount / propertyValue
```

Obliczany tylko dla kredytów hipotecznych (propertyValue > 0). Źródło: Rekomendacja S KNF.

### Dochód dyspozycyjny

```
disposableIncome = monthlyIncome - existingMonthlyDebt - livingCosts - monthlyInstalment
```

Musi być > 0. Jeśli ≤ 0 → override do MANUAL (Rekomendacja S KNF, uchwała 242/2023).

### Rata annuitowa (7% p.a.)

```
instalment = loanAmount × r × (1+r)^n / ((1+r)^n − 1)
gdzie r = 0.07 / 12 (miesięczna stopa)
```

Źródło: standardowa formuła annuitetowa stosowana w polskiej bankowości.
