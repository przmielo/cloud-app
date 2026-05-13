# Wyniki testu wydajnościowego — Hipoteza H1

**Data testu:** 2026-05-13
**Cel:** Weryfikacja H1 — średni czas odpowiedzi ≤ 2s przy 100 równoczesnych użytkownikach

## Tabela wyników (Tab. 9 w pracy)

| Etap | Liczba VU | Średni czas (ms) | p95 (ms) | p99 (ms) | RPS | % błędów |
|---|---|---|---|---|---|---|
| Etap 10 VU | 10 | 198 | 341 | 522 | N/A | N/A |
| Etap 50 VU | 50 | 607 | 1288 | 2198 | N/A | N/A |
| Etap 100 VU | 100 | 1879 | 4191 | 5912 | N/A | N/A |

## Werdykt

❌ HIPOTEZA H1 ODRZUCONA — co najmniej jeden etap przekroczył próg 2000 ms

Globalny p(95): **2749 ms**

## Metodologia

Test przeprowadzono narzędziem k6 na aplikacji wdrożonej w Azure.
Testowy endpoint: `POST /api/loanapplication` (pełny flow: backend → scoring service → Azure SQL).
Trzy etapy: 10, 50, 100 wirtualnych użytkowników przez 3 minuty każdy.
Próg H1: p(95) < 2000 ms i avg < 1500 ms dla każdego etapu.

Źródło metodologii: Matuszyk A., Credit Scoring, CeDeWu 2018 — weryfikacja niefunkcjonalna systemów oceny ryzyka.
