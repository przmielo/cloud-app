# Test wydajnościowy k6 — Hipoteza H1

## Wymagania

- [k6](https://k6.io/docs/get-started/installation/) zainstalowany lokalnie
- Aplikacja wdrożona na Azure (test NIE jest miarodajny na localhost)

## Uruchomienie

```bash
# Pełny test na produkcji Azure (9 minut)
k6 run --out csv=tests/load/results/raw.csv tests/load/load-test.js

# Krótki smoke test (1 VU, 10 sekund) — weryfikacja poprawności skryptu
k6 run --no-thresholds -d 10s -u 1 tests/load/load-test.js

# Inny URL (np. lokalny)
k6 run --env API_URL=http://localhost:8081 tests/load/load-test.js
```

## Analiza wyników

Po uruchomieniu testu plik `tests/load/results/summary.json` zawiera pełne dane.
Uruchom skrypt analizy:

```bash
node tests/load/analyze-results.js
```

Skrypt generuje:
- `results/table-for-thesis.csv` — tabela do Excela (Rys. 3 w pracy)
- `results/results-for-thesis.md` — gotowa Tab. 9 do skopiowania do pracy

## Struktura testu

| Etap | Wirtualni użytkownicy | Czas trwania | Offset startu |
|---|---|---|---|
| Etap 1 | 10 VU | 3 min | 0:00 |
| Etap 2 | 50 VU | 3 min | 3:30 |
| Etap 3 | 100 VU | 3 min | 7:00 |

## Progi (Hipoteza H1)

- p(95) < 2000 ms dla każdego etapu
- avg < 1500 ms dla każdego etapu
- Błędy HTTP < 1%

## Wyniki (uzupełnij po uruchomieniu)

> Uruchom test i skopiuj tu werdykt z `results/results-for-thesis.md`
