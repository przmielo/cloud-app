# Wyniki badań empirycznych

> Plik zbiera wyniki obu testów weryfikujących hipotezy H1 i H2.
> Wygenerowane raporty należy skopiować do rozdziału 3.6 pracy pisemnej.

## H1 — Test wydajnościowy (rozdz. 3.6.1)

**Hipoteza:** Średni czas odpowiedzi aplikacji ≤ 2s przy 100 równoczesnych użytkownikach.

**Metodologia:**
- Narzędzie: k6 v0.50+
- Endpoint: `POST /api/loanapplication` (pełny flow: backend → scoring → Azure SQL)
- Środowisko: Azure App Service (production), region Germany West Central
- Scenariusz: 3 etapy (10/50/100 VU), po 3 minuty każdy

**Jak uruchomić test:**
```bash
k6 run --out csv=tests/load/results/raw.csv tests/load/load-test.js
node tests/load/analyze-results.js
```

**Wyniki (Tab. 9):**
> Po uruchomieniu testu: skopiuj tu zawartość `tests/load/results/results-for-thesis.md`

---

## H2 — Test poprawności modelu (rozdz. 3.6.2)

**Hipoteza:** Model scoringowy zgodny z Rekomendacją S KNF poprawnie ocenia ryzyko kredytowe — accuracy ≥ 80% na 25 przypadkach testowych.

**Metodologia:**
- 25 ręcznie zaprojektowanych przypadków testowych
- Klasy: APPROVE (10), MANUAL (7), REJECT (8)
- Każdy case posiada uzasadnienie literaturowe (Matuszyk 2018, KNF)
- Metryki: macierz konfuzji 3×3, precision/recall/F1 per klasa, accuracy globalne

**Jak uruchomić test:**
```bash
node tests/model-evaluation/evaluate-model.js
```

**Wyniki (Tab. 10 — macierz konfuzji, Tab. 11 — metryki):**
> Po uruchomieniu ewaluacji: skopiuj tu zawartość `tests/model-evaluation/results/report-for-thesis.md`

---

## Podsumowanie (rozdz. 3.7)

| Hipoteza | Treść | Werdykt |
|---|---|---|
| **H1** | Czas odpowiedzi ≤ 2s przy 100 równoczesnych użytkownikach | Uruchom test k6 → wpisz tu |
| **H2** | Accuracy modelu ≥ 80% na 25 przypadkach testowych | Uruchom evaluate-model.js → wpisz tu |

---

## Materiały do pracy pisemnej

| Element pracy | Źródło |
|---|---|
| Tab. 9 (wyniki obciążeniowe) | `tests/load/results/results-for-thesis.md` |
| Rys. 3 (wykres czasu odpowiedzi) | `tests/load/results/table-for-thesis.csv` → Excel |
| Tab. 10 (macierz konfuzji) | `tests/model-evaluation/results/report-for-thesis.md` |
| Tab. 11 (precision/recall/F1) | `tests/model-evaluation/results/report-for-thesis.md` |
| Rys. 4 (wykres metryk) | `tests/model-evaluation/results/metrics.csv` → Excel |
| Tab. 7 (progi decyzyjne) | `docs/scoring-model.md` |
| Tab. 8 (wagi scorecard) | `docs/scoring-model.md` |
