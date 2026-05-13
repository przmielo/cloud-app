# Wyniki ewaluacji modelu scoringowego — Hipoteza H2

**Data testu:** 2026-05-13
**Liczba przypadków testowych:** 25
**Klasy:** APPROVE (10), MANUAL (7), REJECT (8)

## Macierz konfuzji (Tab. 10 w pracy)

|  | Predicted APPROVE | Predicted MANUAL | Predicted REJECT |
|---|---|---|---|
| **Actual APPROVE** | 9 | 1 | 0 |
| **Actual MANUAL**  | 0  | 7  | 0  |
| **Actual REJECT**  | 0  | 5  | 3  |

## Metryki klasyfikacji (Tab. 11 w pracy)

| Klasa | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| APPROVE | 100.0% | 90.0% | 94.7% | 10 |
| MANUAL | 53.8% | 100.0% | 70.0% | 7 |
| REJECT | 100.0% | 37.5% | 54.5% | 8 |
| **Accuracy** | | | **76.0%** | **25** |

## Werdykt

**❌ HIPOTEZA H2 ODRZUCONA — accuracy < 80%, wymagana analiza błędów**

Dokładność modelu: **76.0%** (19/25 poprawnych klasyfikacji).


## Przypadki błędnie sklasyfikowane

| ID | Oczekiwano | Model dał | Score | Powód modelu |
|---|---|---|---|---|
| TC-003 | approve | manual | 667 | Scoring w przedziale 550-699 pkt – skierowanie do analizy ma |
| TC-011 | reject | manual | 441 | Dochód dyspozycyjny ≤ 0 — wymagana analiza manualna zgodnie  |
| TC-014 | reject | manual | 453 | Dochód dyspozycyjny ≤ 0 — wymagana analiza manualna zgodnie  |
| TC-017 | reject | manual | 606 | Scoring w przedziale 550-699 pkt – skierowanie do analizy ma |
| TC-021 | reject | manual | 581 | Scoring w przedziale 550-699 pkt – skierowanie do analizy ma |
| TC-025 | reject | manual | 587 | Scoring w przedziale 550-699 pkt – skierowanie do analizy ma |

### Analiza błędów

- **TC-003** (oczekiwano: approve, model: manual): DStI=12.2%, dochód dyspozycyjny=2828.41 PLN
- **TC-011** (oczekiwano: reject, model: manual): DStI=185.3%, dochód dyspozycyjny=-1926.31 PLN
- **TC-014** (oczekiwano: reject, model: manual): DStI=79.2%, dochód dyspozycyjny=-980.12 PLN
- **TC-017** (oczekiwano: reject, model: manual): DStI=24.9%, dochód dyspozycyjny=5.96 PLN
- **TC-021** (oczekiwano: reject, model: manual): DStI=21.5%, dochód dyspozycyjny=1182.46 PLN
- **TC-025** (oczekiwano: reject, model: manual): DStI=22.1%, dochód dyspozycyjny=136.84 PLN


## Metodologia

Test przeprowadzono na 25 ręcznie zaprojektowanych przypadkach zgodnie z metodyką opisaną w:
- Matuszyk A., *Credit Scoring*, wyd. II, CeDeWu, Warszawa 2018 — kryteria profilowania przypadków testowych
- Thomas L.C., Crook J., Edelman D., *Credit Scoring and Its Applications*, SIAM 2017 — interpretacja macierzy konfuzji
- Rekomendacja S KNF (uchwała nr 242/2023) — reguły override

Każdy przypadek testowy zawiera pole `expectedRationale` z uzasadnieniem klasyfikacji opartym na cytowanej literaturze.
