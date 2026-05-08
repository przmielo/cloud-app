# Test poprawności modelu scoringowego — Hipoteza H2

## Wymagania

- Node.js 20+
- Mikrousługa scoringowa działająca (lokalnie lub w Azure)

## Uruchomienie

```bash
# Test na produkcji Azure
node tests/model-evaluation/evaluate-model.js

# Test lokalny (scoring-service musi być uruchomiony)
SCORING_URL=http://localhost:3001 node tests/model-evaluation/evaluate-model.js
```

## Struktura

| Plik | Opis |
|---|---|
| `test-cases.json` | 25 przypadków testowych (10 approve / 7 manual / 8 reject) |
| `evaluate-model.js` | Skrypt uruchamiający ewaluację i generujący raporty |
| `results/confusion-matrix.json` | Macierz konfuzji 3×3 + metryki (JSON) |
| `results/metrics.csv` | Precision/Recall/F1 do wykresu (Rys. 4 w pracy) |
| `results/report-for-thesis.md` | Gotowe Tab. 10 i Tab. 11 do skopiowania do pracy |

## Rozkład klas testowych

- **APPROVE** (10 przypadków): TC-001 – TC-010
- **MANUAL** (7 przypadków): TC-012, TC-015, TC-019, TC-020, TC-022, TC-023, TC-024
- **REJECT** (8 przypadków): TC-011, TC-013, TC-014, TC-016, TC-017, TC-018, TC-021, TC-025

## Interpretacja wyników

| Accuracy | Werdykt H2 |
|---|---|
| ≥ 80% | POTWIERDZONA |
| < 80% | ODRZUCONA — opisz błędy uczciwie w pracy |

Każdy przypadek testowy posiada pole `expectedRationale` z odniesieniem do literatury:
- Matuszyk A., *Credit Scoring*, wyd. II, CeDeWu 2018
- Thomas, Crook, Edelman, *Credit Scoring and Its Applications*, SIAM 2017
- Rekomendacja S KNF (uchwała nr 242/2023)
