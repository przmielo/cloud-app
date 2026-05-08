# CLAUDE.md

> **Cloud Credit Risk App** – projekt kierunkowy WSB Wrocław, kierunek Informatyka.
>
> Plik kontekstowy dla Claude Code. Automatycznie wczytywany przy każdym
> uruchomieniu w katalogu projektu. Zawiera **opis aktualnego stanu projektu**
> oraz **listę zadań do wykonania**, żeby projekt spełniał wymagania pracy
> licencjackiej (rozdział 3.6 — badania własne, weryfikacja hipotez H1 i H2).

---

## 📋 O PROJEKCIE

**Tytuł pracy:** Projekt i implementacja aplikacji chmurowej do oceny ryzyka kredytowego

**Autor:** Przemysław Kuś (album 98953)

**Uczelnia:** Wyższa Szkoła Bankowa we Wrocławiu, kierunek Informatyka

**Termin oddania:** kwiecień 2026

**Hipotezy badawcze do weryfikacji w pracy:**
- **H1:** Średni czas odpowiedzi aplikacji ≤ 2s przy 100 równoczesnych użytkownikach.
- **H2:** Model scoringowy zgodny z Rekomendacją S KNF (uchwała 242/2023) poprawnie ocenia ryzyko kredytowe — accuracy ≥ 80% na 25 przypadkach testowych.

---

## ✅ AKTUALNY STAN PROJEKTU (stan: maj 2026)

**Stan implementacji: ~75%**. Cała architektura i podstawowa funkcjonalność
działa end-to-end w produkcji na Azure. **FAZY 1–4 są w większości
ukończone**. Pozostały głównie **brakujące zmienne modelu, badania
weryfikujące hipotezy, oraz drobne wymagania funkcjonalne**.

### ✅ Co działa (NIE ZMIENIAJ)

- **Frontend React 19 + TypeScript + Vite** — formularz wniosku, strona wyniku, historia. Hosting: `cloud-task-manager-frontend-pk` (App Service, nie Static Web Apps).
- **Backend .NET 10 + EF Core 10** — endpoint `/api/loanapplication` (POST, GET, GET/{id}), integracja z Key Vault, fallback gdy scoring service jest niedostępny. Hosting: `cloud-task-manager-api-pk`.
- **Mikrousługa scoringowa Node.js + Express + Joi** — endpoint `POST /api/score`, walidacja, kalkulator DStI, kalkulator raty annuitowej, kalkulator LtV, klasyczny scorecard 300–850 z cytowaniem Matuszyk 2018, override DStI > 50% (Rekomendacja S KNF). Testy Jest + Supertest. Hosting: `cloud-task-manager-scoring-pk`.
- **Azure SQL Database** `CloudTaskDB` — tabele `LoanApplications` i `CreditDecisions` z relacją 1:1, migracja `20260507195033_InitialCreditRiskSchema`.
- **Azure Key Vault** `cloud-task-manager-kv-pk` — sekrety `DbConnectionString`, `ScoringServiceUrl`.
- **CI/CD** — 3 workflowy GitHub Actions (`main_cloud-task-manager-api-pk.yml`, `main_cloud-task-manager-frontend-pk.yml`, `scoring-deploy.yml`).
- **Docker Compose** — lokalne uruchomienie 4 kontenerów (frontend 8080, backend 8081, scoring 3001, SQL Edge 1433).
- **Dokumentacja** — `README.md`, `docs/api-documentation.md`, `docs/architecture.mmd`.

### ⚠️ Czego brakuje względem wymagań pracy (do zrobienia)

1. **Niepełna lista zmiennych modelu** — w pracy zadeklarowano 15 zmiennych i 3 wskaźniki, w kodzie jest 14 zmiennych i 2 wskaźniki. Brakuje: `livingCosts`, `pastLoans`, pełnej palety enumów (`widowed`, `pension`, `b2b`), wskaźnika **PTI** i **dochodu dyspozycyjnego**. Zmienna `creditHistoryMonths` jest uproszczona do `hasCreditHistory: bool`.
2. **Test wydajnościowy k6** — kluczowy do weryfikacji **H1**. Brak skryptu i wyników.
3. **Test poprawności modelu** — kluczowy do weryfikacji **H2**. Brak pliku `test-cases.json` z 25 przypadkami i skryptu liczącego macierz konfuzji 3×3 + precision/recall/F1.
4. **Niespójność route'a** — kontroler nazywa się `LoanApplicationController` → route `/api/loanapplication` (lowercase, bez myślnika), w dokumentacji wszędzie `/api/loan-applications`. Trzeba zdecydować i ujednolicić.
5. **Wagi w scorecard** — implementacja używa innych wag niż zadeklarowane w pracy (max raw 450 vs deklarowane 549). Trzeba albo zaktualizować kod do wag z pracy, albo zaktualizować tabelę w pracy do faktycznych wag z kodu.

### ❌ Co świadomie pomijamy (poza zakresem pracy)

Te elementy były pierwotnie planowane, ale **nie są wymagane** do obrony pracy.
Jeśli zostanie czas po zadaniach 1–3 poniżej, można rozważyć ich dodanie:

- System autoryzacji użytkowników (`User`, role `client`/`analyst`/`admin`)
- Panel analityka do przeglądu wniosków manual review
- Eksport decyzji do PDF
- Powiadomienia email (Azure Communication Services)
- Rate limiting, HSTS

W pracy te punkty można wymienić jako **"kierunki dalszego rozwoju"** w
zakończeniu — to liczy się na plus, bo pokazuje świadomość ograniczeń.

---

## 🏗️ AKTUALNA STRUKTURA REPOZYTORIUM

```
cloud-app/
├── .github/workflows/
│   ├── main_cloud-task-manager-api-pk.yml      ✅ działa
│   ├── main_cloud-task-manager-frontend-pk.yml ✅ działa
│   └── scoring-deploy.yml                      ✅ działa
├── backend/                                    ✅ działa
│   ├── Controllers/LoanApplicationController.cs
│   ├── Models/LoanApplication.cs, CreditDecision.cs
│   ├── DTOs/LoanApplicationCreateDto.cs, LoanApplicationReadDto.cs
│   ├── Data/AppDbContext.cs, AppDbContextFactory.cs
│   ├── Migrations/20260507195033_InitialCreditRiskSchema.cs
│   ├── Services/ScoringServiceClient.cs
│   ├── Program.cs                              ✅ Key Vault + EF + HttpClient
│   ├── appsettings.json, appsettings.Development.json
│   ├── Dockerfile
│   └── CloudBackend.csproj                     (.NET 10)
├── frontend/                                   ✅ działa
│   ├── src/App.tsx                             (React Router)
│   ├── src/main.tsx
│   ├── src/pages/LoanApplicationForm.tsx
│   ├── src/pages/ResultPage.tsx
│   ├── src/pages/ApplicationHistory.tsx
│   ├── src/services/api.ts
│   ├── package.json                            (React 19 + Vite 7 + TS)
│   ├── Dockerfile + nginx.conf                 (multi-stage build)
│   └── .env, .env.production
├── scoring-service/                            ✅ działa
│   ├── src/server.js                           (Express + Joi)
│   ├── src/calculators/dsti.js
│   ├── src/models/scorecard.js
│   ├── src/__tests__/score.test.js             (Supertest)
│   ├── src/__tests__/calculators.test.js       (Jest)
│   ├── package.json
│   └── Dockerfile
├── tests/CloudBackend.Tests/                   ✅ ScoringFallbackTests.cs (xUnit)
├── tests/load/                                 ❌ DO STWORZENIA (Zadanie 2)
├── tests/model-evaluation/                     ❌ DO STWORZENIA (Zadanie 3)
├── docs/
│   ├── api-documentation.md
│   └── architecture.mmd
├── docker-compose.yml                          ✅ 4 kontenery
├── README.md
└── CLAUDE.md                                   ← TEN PLIK
```

---

## 🛠️ STACK TECHNOLOGICZNY

### Frontend
- React 19, TypeScript, Vite 7, axios, react-router-dom v6
- Hosting: Azure App Service (Nginx multi-stage Docker)

### Backend główny
- .NET 10, ASP.NET Core Web API, EF Core 10, Swagger
- Azure Key Vault (Azure.Identity + Azure.Extensions.AspNetCore.Configuration.Secrets)
- Hosting: Azure App Service (Linux container)

### Mikrousługa scoringowa
- Node.js 20 LTS, Express 4, Joi 17, CORS
- Testy: Jest 29 + Supertest 7
- Hosting: Azure App Service (Linux container)

### Baza danych
- Azure SQL Database `CloudTaskDB` (produkcja)
- Azure SQL Edge w Dockerze (dev)
- Migracje EF Core, auto-aplikowane przy starcie backendu

### CI/CD
- GitHub Actions, federated credentials (OIDC) z Azure
- Build → Test → Deploy do App Service

---

## 🧮 MODEL OCENY RYZYKA KREDYTOWEGO

### Skala scoringu

300–850 punktów (wzorowane na FICO Score, zgodne z Matuszyk 2018, rozdz. 4).

### Progi decyzyjne

| Zakres scoringu | Decyzja | Uzasadnienie |
|---|---|---|
| 700–850 | **APPROVE** (akceptacja) | klient wiarygodny |
| 550–699 | **MANUAL** (analiza manualna) | wymagana decyzja analityka |
| 300–549 | **REJECT** (odrzucenie) | automatyczne odrzucenie |

**Reguła nadrzędna (override):** Jeśli **DStI > 50%**, wniosek zawsze
trafia do `MANUAL` niezależnie od scoringu — zgodnie z **Rekomendacją S
KNF, uchwała 242/2023**.

**Druga reguła nadrzędna (do dodania w Zadaniu 1):** Jeśli **dochód
dyspozycyjny ≤ 0**, wniosek zawsze trafia do `MANUAL`.

### Wskaźniki finansowe

| Wskaźnik | Wzór | Próg / interpretacja |
|---|---|---|
| **DStI** | (zobowiązania + nowa rata) / dochód netto | < 40% bezpieczne, > 50% override → manual |
| **PTI** | nowa rata / dochód netto | wskaźnik pomocniczy |
| **LtV** | kwota kredytu / wartość zabezpieczenia | tylko dla kredytów hipotecznych |
| **Dochód dyspozycyjny** | dochód − zobowiązania − koszty utrzymania − nowa rata | musi być > 0 |

### Zmienne wejściowe modelu (15 zmiennych — DOCELOWO)

```typescript
interface LoanApplicationData {
  // Dane demograficzne (4)
  age: number;                                                  // 18-80
  educationLevel: 'basic' | 'vocational' | 'secondary' | 'higher';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dependents: number;                                           // 0-10

  // Dane zawodowe i dochodowe (3)
  employmentType: 'permanent' | 'b2b' | 'contract' | 'pension' | 'unemployed';
  employmentYears: number;                                      // 0-50
  monthlyIncome: number;                                        // PLN

  // Zobowiązania (2)
  existingMonthlyDebt: number;                                  // PLN
  livingCosts: number;                                          // PLN

  // Dane o kredycie (4)
  loanAmount: number;                                           // PLN, min 1000
  loanTermMonths: number;                                       // 3-360
  loanPurpose: 'housing' | 'car' | 'consumer' | 'consolidation' | 'other';
  propertyValue: number;                                        // PLN, dla LtV (0 jeśli n/d)

  // Dane behawioralne (3)
  pastLoans: number;                                            // 0+
  latePayments: number;                                         // 0+ (opóźnienia >30 dni w 24 mc)
  creditHistoryMonths: number;                                  // 0+
}
```

### Wagi w karcie punktowej (zgodne z aktualną implementacją)

Bazowy scoring: **300 pkt**, max raw +450 pkt, mapowanie liniowe na skalę 300–850.

| Kategoria | Max raw |
|---|---|
| Historia kredytowa (long history bonus) | +80 |
| DStI (im niższy tym lepiej) | +100 |
| Forma zatrudnienia | +60 |
| Staż pracy | +50 |
| Wykształcenie | +40 |
| Wiek (sweet spot 30–50) | +40 |
| Stan cywilny | +30 |
| Liczba osób na utrzymaniu | +30 |
| Cel kredytu | +20 |

**Uwaga:** w pracy pisemnej Tab. 7 (progi decyzyjne) i Tab. 8 (wagi
karty punktowej) muszą być **identyczne z faktycznymi wartościami w
`scoring-service/src/models/scorecard.js`** — w razie rozbieżności,
**źródłem prawdy jest kod**.

---

## 🔌 SPECYFIKACJA API (aktualny stan)

### Backend główny — `cloud-task-manager-api-pk`

**Base URL produkcyjny:**
`https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api`

| Metoda | Endpoint | Status |
|---|---|---|
| POST | `/loanapplication` | ✅ działa |
| GET | `/loanapplication` | ✅ działa |
| GET | `/loanapplication/{id}` | ✅ działa |
| GET | `/swagger` | ✅ działa |

⚠️ **Niespójność:** route to `/api/loanapplication` (lowercase, bez myślnika).
W dokumentacji `docs/api-documentation.md` wszędzie jest `/api/loan-applications`.
**Zadanie 4** ujednolica to.

### Mikrousługa scoringowa — `cloud-task-manager-scoring-pk`

**Base URL produkcyjny:**
`https://cloud-task-manager-scoring-pk.azurewebsites.net`

| Metoda | Endpoint | Status |
|---|---|---|
| POST | `/api/score` | ✅ działa |
| GET | `/api/health` | ✅ działa |
| GET | `/health` (legacy) | ✅ działa |

---

# 🎯 ZADANIA DO WYKONANIA (instrukcje dla Claude Code)

> **Wykonuj zadania sekwencyjnie. Po każdym uruchom testy i potwierdź,
> że nic się nie zepsuło, zanim przejdziesz dalej.**
>
> Zasady ogólne:
> - Nie zmieniaj infrastruktury Azure ani działających workflowów GitHub Actions.
> - Nie commituj `node_modules`, `bin/`, `obj/`, `.zip`, dużych CSV z wyników testów.
> - Każdy commit atomowy, opis po polsku.
> - Po każdym zadaniu uruchom: `cd scoring-service && npm test` oraz `dotnet test`.

---

## 📌 ZADANIE 1 — WYRÓWNANIE MODELU SCORINGOWEGO Z PRACĄ PISEMNĄ

**Priorytet:** 🔴 KRYTYCZNY (musi być przed Zadaniem 3)
**Szacowany czas:** 4–6 godzin

### Powód

Praca pisemna deklaruje 15 zmiennych i 3 wskaźniki finansowe (Tab. 1, Tab. 2
w rozdziale 2.3). Obecna implementacja ma 14 zmiennych i 2 wskaźniki.
Bez wyrównania tabela wskaźników w pracy nie zgodzi się z kodem i recenzent
to zauważy.

**Brakujące elementy:**
- zmienna `livingCosts` (koszty utrzymania)
- zmienna `pastLoans` (liczba poprzednich kredytów)
- `creditHistoryMonths` jako int (obecnie `hasCreditHistory: bool`)
- wskaźnik **PTI**
- wskaźnik **dochód dyspozycyjny**
- wartość `widowed` w `maritalStatus`
- wartości `b2b` i `pension` w `employmentType`
- 4 wartości w `educationLevel` (obecnie 3)

### 1.1. Rozszerzenie schematu Joi w `scoring-service/src/server.js`

Zmień `scoreSchema` na:

```javascript
const scoreSchema = Joi.object({
  age: Joi.number().integer().min(18).max(80).required(),
  educationLevel: Joi.string()
    .valid('basic', 'vocational', 'secondary', 'higher').required(),
  maritalStatus: Joi.string()
    .valid('single', 'married', 'divorced', 'widowed').required(),
  dependents: Joi.number().integer().min(0).max(10).required(),
  employmentType: Joi.string()
    .valid('permanent', 'b2b', 'contract', 'pension', 'unemployed').required(),
  employmentYears: Joi.number().min(0).max(50).required(),
  monthlyIncome: Joi.number().min(0).required(),
  existingMonthlyDebt: Joi.number().min(0).required(),
  livingCosts: Joi.number().min(0).default(0),
  loanAmount: Joi.number().min(1000).required(),
  loanTermMonths: Joi.number().integer().min(3).max(360).required(),
  loanPurpose: Joi.string()
    .valid('housing', 'car', 'consumer', 'consolidation', 'other').required(),
  propertyValue: Joi.number().min(0).default(0),
  pastLoans: Joi.number().integer().min(0).default(0),
  latePayments: Joi.number().integer().min(0).default(0),
  creditHistoryMonths: Joi.number().integer().min(0).default(0),
});
```

**Backwards compatibility:** zaktualizuj wszystkich konsumentów spójnie
(backend .NET, testy, frontend) — nie ciągnij długu technicznego z aliasami.

### 1.2. Nowe kalkulatory wskaźników

Stwórz `scoring-service/src/calculators/indicators.js`:

```javascript
'use strict';

// PTI (Payment to Income) — relacja samej raty do dochodu netto.
// Wskaźnik pomocniczy obok DStI (Matuszyk 2018, s. 88).
function calculatePti(monthlyInstalment, monthlyIncome) {
  if (monthlyIncome <= 0) return 1;
  return monthlyInstalment / monthlyIncome;
}

// Dochód dyspozycyjny — kwota pozostająca po zaspokojeniu zobowiązań,
// kosztów utrzymania i raty nowego kredytu. Zgodnie z Rekomendacją S KNF
// musi być > 0.
function calculateDisposableIncome(monthlyIncome, existingMonthlyDebt, livingCosts, monthlyInstalment) {
  return monthlyIncome - existingMonthlyDebt - livingCosts - monthlyInstalment;
}

module.exports = { calculatePti, calculateDisposableIncome };
```

### 1.3. Wpięcie wskaźników w endpoint `POST /api/score`

W `server.js` po obliczeniu `monthlyInstalment` i `dsti` dodaj:

```javascript
const { calculatePti, calculateDisposableIncome } = require('./calculators/indicators');

const pti = calculatePti(monthlyInstalment, Number(data.monthlyIncome));
const disposableIncome = calculateDisposableIncome(
  Number(data.monthlyIncome),
  Number(data.existingMonthlyDebt),
  Number(data.livingCosts),
  monthlyInstalment
);
```

Rozszerz odpowiedź:

```javascript
return res.json({
  score,
  dstI: parseFloat(dsti.toFixed(4)),
  pti: parseFloat(pti.toFixed(4)),
  ltV: ltv !== null ? parseFloat(ltv.toFixed(4)) : null,
  disposableIncome: parseFloat(disposableIncome.toFixed(2)),
  monthlyInstalment: parseFloat(monthlyInstalment.toFixed(2)),
  outcome,
  reason,
});
```

### 1.4. Aktualizacja `scoring-service/src/models/scorecard.js`

Funkcja `scoreCreditHistory` przyjmuje teraz `creditHistoryMonths` (int)
zamiast `hasCreditHistory` (bool):

- 0 mies. → 20 pkt (neutralne, brak historii)
- 1–11 mies. → 30 pkt (krótka)
- 12–35 mies. → 50 pkt (umiarkowana)
- ≥ 36 mies. → 80 pkt (długa)

Następnie odejmuj punkty za opóźnienia:
- `latePayments === 0` → bez kary
- `latePayments === 1` → −20 pkt
- `latePayments === 2` → −40 pkt
- `latePayments ≥ 3` → cała pozycja = 0

W `makeDecision` dodaj override:
```javascript
if (disposableIncome <= 0) {
  return {
    outcome: 'manual',
    reason: 'Dochód dyspozycyjny ≤ 0 — wymagana analiza manualna zgodnie z Rekomendacją S KNF.'
  };
}
```

### 1.5. Aktualizacja backendu .NET

**Pliki do zmiany:**

`backend/Models/LoanApplication.cs`:
- usuń `HasCreditHistory (bool)`
- dodaj `CreditHistoryMonths (int)`
- dodaj `LivingCosts (decimal)`
- dodaj `PastLoans (int)`

`backend/Models/CreditDecision.cs`:
- dodaj `Pti (decimal)`
- dodaj `DisposableIncome (decimal)`

`backend/DTOs/LoanApplicationCreateDto.cs` i `LoanApplicationReadDto.cs`:
- analogicznie + w `CreditDecisionDto` dodaj `Pti`, `DisposableIncome`

`backend/Data/AppDbContext.cs`:
- dodaj konfigurację typów: `decimal(18,2)` dla `LivingCosts`, `DisposableIncome`
- dodaj konfigurację `decimal(18,4)` dla `Pti`

`backend/Controllers/LoanApplicationController.cs`:
- w `Create()` mapuj nowe pola
- w `MapToDto()` mapuj nowe pola
- w `FallbackScoring` uwzględnij `LivingCosts` przy liczeniu i ustaw `Pti`, `DisposableIncome`

`backend/Services/ScoringServiceClient.cs`:
- w `ScoringRequest`: dodaj `LivingCosts`, `PastLoans`, `CreditHistoryMonths`,
  usuń `HasCreditHistory`
- w `ScoringResult`: dodaj `Pti`, `DisposableIncome`

### 1.6. Migracja EF Core

```bash
cd backend
dotnet ef migrations add ExtendCreditRiskSchema
```

Sprawdź wygenerowany plik. Powinien zawierać:
- DROP `HasCreditHistory` (bit), ADD `CreditHistoryMonths` (int)
- ADD `LivingCosts`, `PastLoans` w `LoanApplications`
- ADD `Pti`, `DisposableIncome` w `CreditDecisions`

⚠️ **Uwaga produkcyjna:** jeśli w bazie Azure SQL są już dane testowe,
dodaj w migracji `migrationBuilder.Sql("UPDATE LoanApplications SET CreditHistoryMonths = 0 WHERE ...")`
przed `DropColumn`. Auto-migracja w `Program.cs` zastosuje to przy starcie.

### 1.7. Aktualizacja frontendu

`frontend/src/services/api.ts`:
- zaktualizuj typy `LoanApplicationCreateDto`, `LoanApplicationReadDto`,
  `CreditDecisionDto` o nowe pola

`frontend/src/pages/LoanApplicationForm.tsx`:
- dodaj `widowed` do select stanu cywilnego
- zmień edukację na 4 wartości (`basic`/`vocational`/`secondary`/`higher`)
- dodaj `pension`, `b2b` do `employmentType`
- dodaj pole **Koszty utrzymania (PLN)** → `livingCosts`
- dodaj pole **Liczba dotychczasowych kredytów** → `pastLoans`
- zmień **checkbox historia kredytowa** na pole numeryczne
  **Długość historii kredytowej (miesiące)** → `creditHistoryMonths`

`frontend/src/pages/ResultPage.tsx`:
- dodaj wyświetlanie PTI (% z 2 miejscami po przecinku)
- dodaj wyświetlanie dochodu dyspozycyjnego (PLN)
- dodaj sekcję "Zgodność z Rekomendacją S KNF" z odniesieniem do uchwały 242/2023

### 1.8. Aktualizacja testów

`scoring-service/src/__tests__/score.test.js`:
- zaktualizuj `validPayload` o wszystkie nowe pola
- dodaj test "rejects when disposable income ≤ 0"
- dodaj test "accepts payload with widowed and pension values"

`scoring-service/src/__tests__/calculators.test.js`:
- dodaj `describe('calculatePti')` z min 3 testami
- dodaj `describe('calculateDisposableIncome')` z min 3 testami

`tests/CloudBackend.Tests/ScoringFallbackTests.cs`:
- zaktualizuj inicjalizację `LoanApplication` o nowe pola
- dodaj test fallback gdy `LivingCosts > MonthlyIncome`

### 1.9. Aktualizacja dokumentacji

- `docs/api-documentation.md` — zaktualizuj request/response `POST /api/score`
- `README.md` — jeśli jest sekcja zmiennych modelu, zaktualizuj
- W tym pliku CLAUDE.md zaznacz Zadanie 1 jako wykonane

### Kryterium ukończenia Zadania 1

- ✅ `cd scoring-service && npm test` — minimum 18 zielonych testów
- ✅ `dotnet test tests/CloudBackend.Tests/` — wszystkie zielone
- ✅ `docker compose up --build` startuje 4 kontenery, `/api/health` zwraca 200
- ✅ POST `/api/loanapplication` z frontu zwraca w `decision`: `pti`, `disposableIncome`
- ✅ Migracja EF Core zaaplikowana, baza zawiera nowe kolumny

---

## 📌 ZADANIE 2 — TEST WYDAJNOŚCIOWY k6 (HIPOTEZA H1)

**Priorytet:** 🔴 KRYTYCZNY — bez tego nie da się napisać 3.6.1 ani 3.7
**Szacowany czas:** 3–4 godziny

### Cel

Wygenerować twarde dane do weryfikacji **H1** (czas odpowiedzi ≤ 2s przy
100 równoczesnych użytkownikach) na **wdrożonej w Azure** wersji aplikacji.

### 2.1. Struktura katalogu

Stwórz katalog `tests/load/` z plikami:

```
tests/load/
├── load-test.js                # skrypt k6
├── payload-samples.json        # 5 realistycznych profili wniosków
├── README.md                   # instrukcja uruchomienia
└── results/
    └── .gitkeep                # tu trafią wyniki (gitignore)
```

Dopisz do `.gitignore`:
```
tests/load/results/*
!tests/load/results/.gitkeep
```

### 2.2. Skrypt k6 — `tests/load/load-test.js`

Wymagania:

- 3 etapy: **10 → 50 → 100 użytkowników**, każdy etap **3 minuty**
- Cel: endpoint `POST /api/loanapplication` na backendzie .NET (testujemy
  pełny flow: backend → scoring service → DB)
- URL backendu z parametru `--env API_URL=...` (domyślnie produkcyjny z README)
- Losuj payload z `payload-samples.json` przy każdym żądaniu
- Tagi `stage` (`10users`/`50users`/`100users`) — żeby sortować wyniki per etap
- Thresholdy zgodne z H1:
  - `http_req_duration{stage:10users}`: `p(95)<2000`, `avg<1500`
  - `http_req_duration{stage:50users}`: `p(95)<2000`, `avg<1500`
  - `http_req_duration{stage:100users}`: `p(95)<2000`, `avg<1500`
  - `http_req_failed`: `rate<0.01`
- `summaryTrendStats: ['avg','min','med','max','p(90)','p(95)','p(99)']`
- Eksport raportu przez `handleSummary` do `tests/load/results/summary.json`

Szkielet:

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const samples = new SharedArray('payloads', () =>
  JSON.parse(open('./payload-samples.json'))
);

const API_URL = __ENV.API_URL ||
  'https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net';

export const options = {
  scenarios: {
    stage_10:  { executor: 'constant-vus', vus: 10,  duration: '3m', tags: { stage: '10users'  }, startTime: '0s'    },
    stage_50:  { executor: 'constant-vus', vus: 50,  duration: '3m', tags: { stage: '50users'  }, startTime: '3m30s' },
    stage_100: { executor: 'constant-vus', vus: 100, duration: '3m', tags: { stage: '100users' }, startTime: '7m'    },
  },
  thresholds: {
    'http_req_duration{stage:10users}':  ['p(95)<2000', 'avg<1500'],
    'http_req_duration{stage:50users}':  ['p(95)<2000', 'avg<1500'],
    'http_req_duration{stage:100users}': ['p(95)<2000', 'avg<1500'],
    http_req_failed: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function () {
  const payload = samples[Math.floor(Math.random() * samples.length)];
  const res = http.post(
    `${API_URL}/api/loanapplication`,
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, {
    'status is 201': (r) => r.status === 201,
  });
}

export function handleSummary(data) {
  return {
    'tests/load/results/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### 2.3. Plik `tests/load/payload-samples.json`

5 realistycznych profili wniosków, każdy musi przejść walidację Joi po
Zadaniu 1. Profile zróżnicowane:

1. **Idealny kandydat** — 35 lat, UoP 8 lat, dochód 12000, mały kredyt
2. **Średni kandydat** — 28 lat, UoP 2 lata, dochód 6000, średni kredyt
3. **Trudny kandydat** — 45 lat, B2B 3 lata, dochód 8000, kredyt hipoteczny
4. **Słaby kandydat** — 22 lata, contract 1 rok, dochód 4000, duży kredyt
5. **Nietypowy** — 60 lat, pension, dochód 5000, krótki termin

Każdy profil w pełnym formacie zgodnym ze schematem Joi z Zadania 1.

### 2.4. Plik `tests/load/README.md`

Krótka instrukcja:

```markdown
# Test wydajnościowy k6

## Wymagania
- k6 zainstalowany lokalnie (https://k6.io/docs/get-started/installation/)
- Aplikacja wdrożona na Azure (test NIE działa na localhost rzetelnie)

## Uruchomienie
\`\`\`bash
# Domyślnie testuje produkcję na Azure
k6 run --out csv=tests/load/results/raw.csv tests/load/load-test.js

# Inny URL
k6 run --env API_URL=http://localhost:8081 tests/load/load-test.js
\`\`\`

## Wyniki
- `tests/load/results/summary.json` — pełny raport JSON
- `tests/load/results/raw.csv` — surowe dane do dalszej analizy
- Skrypt do generowania wykresów: zob. Zadanie 2.5
```

### 2.5. Skrypt analizy wyników — `tests/load/analyze-results.js`

Node.js skrypt który czyta `summary.json` i generuje:

1. **Tabelę CSV** `tests/load/results/table-for-thesis.csv` z kolumnami:
   `Etap | Liczba VU | Średni czas (ms) | 95p (ms) | 99p (ms) | RPS | % błędów`
2. **Markdown** `tests/load/results/results-for-thesis.md` z gotową tabelą
   (do skopiowania do pracy jako Tab. 9)
3. **Werdykt H1** (`H1 POTWIERDZONA` / `H1 ODRZUCONA`) na podstawie thresholdów

Skrypt powinien wyciągać metryki per stage używając `data.metrics` z k6
JSON (klucze typu `http_req_duration{stage:10users}`).

### 2.6. Workflow do ręcznego uruchamiania (opcjonalnie)

Stwórz `.github/workflows/load-test.yml` (workflow dispatch):

```yaml
name: Load Test (manual)
on:
  workflow_dispatch:
    inputs:
      api_url:
        description: 'API URL (puste = produkcja)'
        required: false
        type: string

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1
      - run: k6 run --out csv=tests/load/results/raw.csv tests/load/load-test.js
        env:
          API_URL: ${{ inputs.api_url }}
      - uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: tests/load/results/
```

Dzięki temu możesz uruchamiać test z UI GitHuba i ściągać wyniki jako artefakt.

### Kryterium ukończenia Zadania 2

- ✅ `tests/load/load-test.js` istnieje i przechodzi `k6 run --no-thresholds tests/load/load-test.js -d 10s -u 1` (smoke test)
- ✅ `payload-samples.json` zawiera 5 walidnych profili (test: `node -e "require('./tests/load/payload-samples.json').length === 5"`)
- ✅ `analyze-results.js` parsuje przykładowy `summary.json` i generuje markdown
- ✅ `README.md` opisuje sposób uruchomienia
- ✅ Wykonany jeden pełny przebieg testu na Azure (9 minut), wyniki w `results/`,
  do pracy: `results-for-thesis.md`

---

## 📌 ZADANIE 3 — TEST POPRAWNOŚCI MODELU (HIPOTEZA H2)

**Priorytet:** 🔴 KRYTYCZNY — sedno rozdziału 3.6.2 i 3.7
**Wymaga ukończenia Zadania 1**
**Szacowany czas:** 4–5 godzin

### Cel

Zweryfikować **H2** — model scoringowy zgodny z Rekomendacją S KNF
poprawnie ocenia ryzyko. Standardowe podejście:

1. 25 ręcznie zaprojektowanych przypadków testowych z **oczekiwaną decyzją**
   na podstawie literatury (Matuszyk 2018) i Rekomendacji S KNF
2. Uruchomienie modelu na każdym przypadku
3. Macierz konfuzji 3×3 (APPROVE / MANUAL / REJECT)
4. Metryki: precision, recall, F1 per klasa + accuracy ogólne
5. Werdykt H2

### 3.1. Struktura katalogu

```
tests/model-evaluation/
├── test-cases.json             # 25 przypadków
├── evaluate-model.js           # skrypt liczący macierz konfuzji
├── README.md                   # instrukcja
└── results/
    └── .gitkeep
```

### 3.2. Plik `tests/model-evaluation/test-cases.json`

**Rozkład klas (zgodny z planem rozdz. 3.6.2):**
- 10 przypadków z oczekiwaną decyzją `approve`
- 8 przypadków z oczekiwaną decyzją `reject`
- 7 przypadków z oczekiwaną decyzją `manual`

**Format pojedynczego case:**

```json
{
  "id": "TC-001",
  "description": "Idealny kandydat: UoP 10 lat, wysoki dochód, brak opóźnień",
  "expectedOutcome": "approve",
  "expectedRationale": "Stabilne zatrudnienie, niski DStI (~22%), brak opóźnień. Zgodnie z Rekomendacją S KNF i Matuszyk 2018 s.95.",
  "input": {
    "age": 35,
    "educationLevel": "higher",
    "maritalStatus": "married",
    "dependents": 1,
    "employmentType": "permanent",
    "employmentYears": 10,
    "monthlyIncome": 12000,
    "existingMonthlyDebt": 500,
    "livingCosts": 4000,
    "loanAmount": 50000,
    "loanTermMonths": 36,
    "loanPurpose": "consumer",
    "propertyValue": 0,
    "pastLoans": 2,
    "latePayments": 0,
    "creditHistoryMonths": 84
  }
}
```

**Przykładowy rozkład 25 przypadków:**

| ID | Profil | Oczekiwany |
|---|---|---|
| TC-001 | Idealny: UoP 10 lat, wysokie dochody | approve |
| TC-002 | Stabilny B2B, średni dochód, długa historia | approve |
| TC-003 | Emeryt z niską ratą | approve |
| TC-004 | Młody specjalista, wyższe wykształcenie, niski DStI | approve |
| TC-005 | Rodzina z 2 dziećmi, kredyt hipoteczny LtV 70% | approve |
| TC-006 | Dobry profil, kredyt na auto | approve |
| TC-007 | Konsolidacja małej kwoty | approve |
| TC-008 | Średni wiek, dobre wskaźniki | approve |
| TC-009 | UoP 5 lat, brak opóźnień | approve |
| TC-010 | Higher education, B2B, niski DStI | approve |
| TC-011 | Bezrobotny | reject |
| TC-012 | DStI 65%, override KNF | manual |
| TC-013 | 4+ opóźnienia, contract | reject |
| TC-014 | Bardzo młody (18-19), brak historii, duża kwota | reject |
| TC-015 | Dochód dyspozycyjny ujemny → manual | manual |
| TC-016 | Dochód niski + duża kwota + długi termin | reject |
| TC-017 | Wiele osób na utrzymaniu, niski dochód | reject |
| TC-018 | Bardzo zła historia (latePayments=5) | reject |
| TC-019 | DStI 35%, score graniczny → manual | manual |
| TC-020 | Średni wiek, hipoteka, LtV 95% → manual | manual |
| TC-021 | Niedoświadczony pracownik, contract krótki | reject |
| TC-022 | DStI 52%, override → manual | manual |
| TC-023 | Score graniczny 600-650 → manual | manual |
| TC-024 | Konsolidacja, przeciętny profil → manual | manual |
| TC-025 | Pension, niski DStI → reject (bo score ze względu na inne czynniki) lub manual | reject |

**Każdy case musi mieć w opisie odniesienie do literatury** (Matuszyk 2018,
strony) lub Rekomendacji S KNF — to jest dowód, że klasyfikacja nie była
"podgwizdana" do wyników.

### 3.3. Skrypt ewaluacji — `tests/model-evaluation/evaluate-model.js`

Node.js (CommonJS, bez TypeScript), uruchamiany przez `node evaluate-model.js`.

**Funkcjonalność:**

1. Wczytuje `test-cases.json`
2. URL scoring service z `--url=` lub `process.env.SCORING_URL` (domyślnie produkcyjny)
3. Dla każdego case wysyła `POST /api/score` (fetch / axios)
4. Buduje macierz konfuzji 3×3:
   ```
                       Predicted
                APPROVE  MANUAL  REJECT
   Actual APPROVE  TP_a    E_am    E_ar
          MANUAL   E_ma    TP_m    E_mr
          REJECT   E_ra    E_rm    TP_r
   ```
5. Liczy metryki per klasa:
   - precision_c = TP_c / (TP_c + suma kolumny c bez TP_c)
   - recall_c = TP_c / (TP_c + suma wiersza c bez TP_c)
   - F1_c = 2 × precision × recall / (precision + recall)
6. Liczy accuracy ogólne = suma diagonali / 25
7. Werdykt H2: jeśli accuracy ≥ 80% → POTWIERDZONA, w przeciwnym razie → analiza błędów
8. Eksport wyników do:
   - `results/confusion-matrix.json`
   - `results/metrics.csv` (do wykresu w pracy)
   - `results/report-for-thesis.md` (gotowe tabele do skopiowania jako Tab. 10 i Tab. 11)

**Szkielet:**

```javascript
const fs = require('fs');
const path = require('path');

const SCORING_URL = process.env.SCORING_URL ||
  'https://cloud-task-manager-scoring-pk.azurewebsites.net';

const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-cases.json'), 'utf-8')
);

const labels = ['approve', 'manual', 'reject'];
const matrix = { approve: { approve: 0, manual: 0, reject: 0 },
                 manual:  { approve: 0, manual: 0, reject: 0 },
                 reject:  { approve: 0, manual: 0, reject: 0 } };
const errors = [];

(async () => {
  for (const tc of cases) {
    const res = await fetch(`${SCORING_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tc.input),
    });
    if (!res.ok) {
      errors.push({ id: tc.id, status: res.status });
      continue;
    }
    const result = await res.json();
    const actual = tc.expectedOutcome;
    const predicted = result.outcome;
    matrix[actual][predicted]++;
    if (actual !== predicted) {
      errors.push({
        id: tc.id, description: tc.description,
        expected: actual, got: predicted, score: result.score,
        dsti: result.dstI, disposableIncome: result.disposableIncome
      });
    }
  }

  // Metryki
  const total = cases.length;
  let correct = 0;
  for (const l of labels) correct += matrix[l][l];
  const accuracy = correct / total;

  const metrics = {};
  for (const l of labels) {
    const tp = matrix[l][l];
    const fp = labels.reduce((s, ll) => s + (ll !== l ? matrix[ll][l] : 0), 0);
    const fn = labels.reduce((s, ll) => s + (ll !== l ? matrix[l][ll] : 0), 0);
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0
      ? 2 * precision * recall / (precision + recall)
      : 0;
    metrics[l] = { precision, recall, f1, support: tp + fn };
  }

  const verdict = accuracy >= 0.80
    ? '✅ HIPOTEZA H2 POTWIERDZONA'
    : '❌ HIPOTEZA H2 ODRZUCONA — wymaga analizy błędów';

  // ... zapis confusion-matrix.json, metrics.csv, report-for-thesis.md
  console.log({ accuracy, metrics, verdict, errors });
})();
```

### 3.4. Plik `tests/model-evaluation/README.md`

Krótka instrukcja uruchomienia:

```markdown
# Test poprawności modelu scoringowego

## Wymagania
- Node.js 20+
- Mikrousługa scoringowa działająca (lokalnie lub w Azure)

## Uruchomienie
\`\`\`bash
# Test na produkcji
node tests/model-evaluation/evaluate-model.js

# Test lokalny
SCORING_URL=http://localhost:3001 node tests/model-evaluation/evaluate-model.js
\`\`\`

## Wyniki
- `results/confusion-matrix.json` — macierz konfuzji
- `results/metrics.csv` — metryki do wykresu
- `results/report-for-thesis.md` — gotowe tabele do pracy (Tab. 10, Tab. 11)
```

### 3.5. Dodanie do CI (opcjonalnie)

Stwórz `.github/workflows/model-evaluation.yml` (workflow_dispatch):

```yaml
name: Model Evaluation (manual)
on:
  workflow_dispatch:

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node tests/model-evaluation/evaluate-model.js
      - uses: actions/upload-artifact@v4
        with:
          name: model-evaluation-results
          path: tests/model-evaluation/results/
```

### Kryterium ukończenia Zadania 3

- ✅ `tests/model-evaluation/test-cases.json` zawiera 25 przypadków (10 approve / 8 reject / 7 manual)
- ✅ Każdy case ma `expectedRationale` z odniesieniem do literatury
- ✅ `node evaluate-model.js` wykonuje się bez błędów na produkcji
- ✅ Wygenerowane: `confusion-matrix.json`, `metrics.csv`, `report-for-thesis.md`
- ✅ Accuracy ≥ 80% → H2 potwierdzona
   - Jeśli < 80% — **NIE ZMIENIAJ MODELU**, tylko opisz błędy w pracy uczciwie.
     Recenzent ceni uczciwość. W pracy wymień, na których case'ach model
     się pomylił i dlaczego (np. "model okazał się zbyt zachowawczy dla
     wnioskodawców na umowie zlecenie").

---

## 📌 ZADANIE 4 — UJEDNOLICENIE ROUTE'A API

**Priorytet:** 🟡 ŚREDNI (kosmetyka, ale ważna dla spójności pracy)
**Szacowany czas:** 30 minut

### Powód

Route w kodzie: `/api/loanapplication`. Dokumentacja `docs/api-documentation.md`
i CLAUDE.md mówią `/api/loan-applications`. **Wybierz jedną wersję** i
ujednolić wszędzie.

**Rekomendacja:** zostań przy obecnym `/api/loanapplication` (lowercase, bez myślnika)
— mniej zmian, mniej okazji do popsucia produkcyjnego deploymentu i istniejących
wywołań z frontu. Zaktualizuj dokumentację do faktycznego stanu.

### Pliki do zmiany

- `docs/api-documentation.md` — wszędzie `/loan-applications` → `/loanapplication`
- `README.md` — analogicznie, jeśli jest wzmianka
- `CLAUDE.md` (ten plik) — sekcja "SPECYFIKACJA API" już używa `/loanapplication`

### Kryterium ukończenia

- ✅ `grep -r "loan-applications" --include="*.md"` nie zwraca wyników
- ✅ Frontend nadal działa (route niezmieniony w `api.ts`)

---

## 📌 ZADANIE 5 — SYNCHRONIZACJA WAG SCORECARD Z PRACĄ

**Priorytet:** 🟡 ŚREDNI (do wykonania PRZED finalnym zapisem rozdziału 3.3 pracy)
**Szacowany czas:** 1 godzina

### Powód

Wagi w `scoring-service/src/models/scorecard.js` (max raw 450) różnią się od
wag deklarowanych w pierwotnym planie (CLAUDE.md, max raw 549). To **nie jest
błąd** — wagi w kodzie są spójne wewnętrznie i model działa poprawnie.

**Decyzja:** **kod jest źródłem prawdy**. Zaktualizuj tabelę wag w pracy
pisemnej (rozdział 3.3, Tab. 8) tak, aby zgadzała się z `scorecard.js`.

### Co zrobić

1. Wygeneruj plik `docs/scoring-model.md` zawierający:
   - Pełną tabelę wag z aktualnego `scorecard.js` (z konkretnymi wartościami)
   - Tabelę przedziałów punktowych dla każdej zmiennej
   - Wyjaśnienie mapowania raw → 300–850
   - Cytowania Matuszyk 2018 i Thomas/Crook/Edelman SIAM 2017 dla każdej kategorii

2. Ten plik posłuży jako **źródło Tab. 8 w pracy pisemnej**.

### Kryterium ukończenia

- ✅ `docs/scoring-model.md` istnieje
- ✅ Wszystkie wartości w nim zgadzają się z `grep -E "max:|points:" scoring-service/src/models/scorecard.js`
- ✅ Każda kategoria ma cytowanie literatury

---

## 📌 ZADANIE 6 (OPCJONALNE) — DOKUMENTACJA WYNIKÓW BADAŃ

**Priorytet:** 🟢 NISKI (po Zadaniach 2 i 3)
**Szacowany czas:** 1 godzina

Stwórz `docs/test-results.md` zbierający w jednym miejscu:

- Wyniki testu wydajnościowego (kopia z `tests/load/results/results-for-thesis.md`)
- Wyniki testu modelu (kopia z `tests/model-evaluation/results/report-for-thesis.md`)
- Werdykty obu hipotez
- Wnioski

Ten plik to **gotowa baza pod rozdział 3.6 i 3.7 pracy pisemnej**.

---

# 📊 PODSUMOWANIE — KOLEJNOŚĆ I KRYTERIA

## Wymagana kolejność

```
Zadanie 1 (model alignment)
    ↓
Zadanie 2 (k6) ──┐
                 ├──→ Zadanie 6 (dokumentacja wyników)
Zadanie 3 (modeleval) ──┘

Zadania 4 i 5 mogą być w dowolnym momencie.
```

## Co musi działać po wszystkich zadaniach

- ✅ Wszystkie testy jednostkowe i integracyjne zielone
- ✅ Aplikacja na Azure odpowiada na wszystkie endpointy
- ✅ Folder `tests/load/results/` zawiera wyniki testu wydajnościowego
- ✅ Folder `tests/model-evaluation/results/` zawiera wyniki testu modelu
- ✅ `docs/scoring-model.md` opisuje aktualny model
- ✅ `docs/test-results.md` zbiera wyniki obu badań
- ✅ Werdykty H1 i H2 są jednoznaczne (POTWIERDZONA / ODRZUCONA z analizą)

## Definicja "skończonej pracy"

Po wykonaniu zadań 1–3 masz **wszystko, czego potrzebujesz do napisania
rozdziału 3.6 (Badania własne) i 3.7 (Weryfikacja hipotez) pracy
licencjackiej**:

- Tab. 9 (wyniki testu obciążeniowego) — z `results-for-thesis.md`
- Rys. 3 (wykres czasu odpowiedzi) — wygeneruj w Excelu z `metrics.csv`
- Tab. 10 (macierz konfuzji) — z `report-for-thesis.md`
- Tab. 11 (precision/recall/F1) — z `report-for-thesis.md`
- Rys. 4 (wykres metryk) — wygeneruj w Excelu z `metrics.csv`
- Werdykty H1 i H2 — z plików werdyktów

---

# 🔒 BEZPIECZEŃSTWO (status, NIE ZMIENIAĆ)

### ✅ Już zaimplementowane
- Azure Key Vault dla sekretów (`DbConnectionString`, `ScoringServiceUrl`)
- Walidacja wejścia: Joi (Node), automatyczna walidacja modelu (.NET)
- HTTPS wymuszony przez Azure App Service
- Connection string poza repo
- Federated credentials (OIDC) w GitHub Actions — bez sekretów w workflowach

### ❌ Świadomie pominięte (poza zakresem pracy licencjackiej)
- Autoryzacja użytkowników (JWT/OAuth)
- Rate limiting
- HSTS (do dodania w `Program.cs`, jeśli będzie czas)
- CORS w prod ograniczony do domeny frontu (obecnie `AllowAnyOrigin`)

### ❌ Czego nie robić
- Nie commituj sekretów
- Nie loguj PII (dochody, dane osobowe)
- Nie używaj localStorage do tokenów

---

# 📚 ŹRÓDŁA AKADEMICKIE (do pracy pisemnej i komentarzy w kodzie)

1. Matuszyk A., *Credit Scoring*, wyd. II, Warszawa: CeDeWu, 2018
   — **główne źródło** modelu scoringowego, cytowane w `scorecard.js`
2. Thomas L.C., Crook J., Edelman D., *Credit Scoring and Its Applications*,
   2nd ed., SIAM, 2017
3. Iwanicz-Drozdowska M. (red.), *Zarządzanie ryzykiem bankowym*,
   Wolters Kluwer, 2024
4. Newman S., *Budowanie mikrousług*, wyd. II, Helion, 2022
5. Mell P., Grance T., *NIST Definition of Cloud Computing*, NIST SP 800-145, 2011
6. **Rekomendacja S KNF, uchwała nr 242/2023** — źródło reguły override DStI > 50%

---

# 🔗 LINKI

- Backend produkcyjny: https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/swagger
- Scoring service: https://cloud-task-manager-scoring-pk.azurewebsites.net/api/health
- Frontend: https://cloud-task-manager-frontend-pk.azurewebsites.net
- k6 docs: https://k6.io/docs
- Rekomendacja S KNF: https://www.knf.gov.pl

---

**Ostatnia aktualizacja:** 2026-05-08
**Stan implementacji:** ~75% (architektura ✅, model w ~85% ✅, badania ❌)
**Pozostało do oddania pracy:** Zadania 1, 2, 3 (krytyczne) + 4, 5, 6 (porządkowe)
```