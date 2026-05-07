# CLAUDE.md

> **Cloud Credit Risk App** - projekt kierunkowy WSB Wrocław, kierunek Informatyka
> 
> Plik kontekstowy dla Claude Code. Automatycznie wczytywany przy każdym uruchomieniu.

---

## 📋 O PROJEKCIE

**Tytuł pracy:** Projekt i implementacja aplikacji chmurowej do oceny ryzyka kredytowego

**Autor:** Przemysław Kuś (album 98953)

**Uczelnia:** Wyższa Szkoła Bankowa we Wrocławiu, kierunek Informatyka

**Termin oddania:** kwiecień 2026

---

## 🚨 WAŻNE: OBECNY STAN PROJEKTU

Projekt obecnie nazywa się **Cloud Task Manager** (CRUD zadań) i tak działa technicznie, 
ALE temat pracy to **aplikacja oceny ryzyka kredytowego**.

**Plan: dostosowanie istniejącego projektu zamiast budowy od zera.**

Cała infrastruktura Azure i CI/CD już działają – nie zmieniamy ich. Modyfikujemy tylko 
warstwę aplikacji (modele, kontrolery, serwisy, frontend).

### Mapowanie zasobów Azure → nowy projekt

| Istniejący zasób Azure | Nowa rola w projekcie kredytowym |
|---|---|
| `cloud-task-manager-rg` | Resource Group (bez zmian) |
| `cloud-task-manager-api-pk` (App Service .NET) | Backend główny – obsługa wniosków kredytowych |
| `cloud-task-manager-scoring-pk` (App Service) | **Mikrousługa scoringowa Node.js (DO UZUPEŁNIENIA)** |
| `cloud-task-manager-frontend-pk` (Static Web Apps) | Frontend React – formularz wniosku kredytowego |
| `cloud-task-manager-kv-pk` (Key Vault) | Sekrety (connection strings, klucze) |
| `cloud-task-manager-sql` (SQL Server) | Serwer bazy danych |
| `CloudTaskDB` (SQL Database) | Baza danych – migracja schematu na nowy model |

---

## 🏗️ AKTUALNA STRUKTURA REPOZYTORIUM

```
cloud-app/
├── .github/workflows/
│   ├── azure-app-service-backend.yml          ✅ działa (.NET backend)
│   ├── azure-static-web-apps.yml              ✅ działa (frontend)
│   ├── main_cloud-task-manager-api-pk.yml     ✅ działa (alternatywny .NET)
│   └── main_cloud-task-manager-frontend-pk.yml ✅ działa (Node frontend)
├── backend/                                    ⚠️ DO PRZEROBIENIA
│   ├── Controllers/TasksController.cs          → LoanApplicationController + ScoringController
│   ├── Models/CloudTask.cs                     → LoanApplication, Decision, User
│   ├── DTOs/                                   → nowe DTO dla wniosków
│   ├── Data/AppDbContext.cs                    → nowe DbSets
│   ├── Migrations/                             → nowa migracja
│   ├── Services/                               → LoanApplicationService, ScoringClient
│   ├── Repositories/                           → wzorzec repository
│   ├── Program.cs                              ✅ podstawa OK (Key Vault, EF Core)
│   ├── appsettings.json                        ✅ OK
│   ├── Dockerfile                              ✅ OK
│   └── CloudBackend.csproj                     ✅ OK
├── frontend/                                   ⚠️ DO PRZEROBIENIA
│   ├── src/pages/Dashboard.tsx                 → LoanApplicationForm, ResultPage, History
│   ├── src/components/                         → DODAĆ formularzy + walidacji
│   ├── src/services/api.ts                     ✅ podstawa OK
│   ├── package.json                            ✅ React 19 + Vite + TypeScript
│   └── Dockerfile                              ✅ OK
├── scoring-service/                            ❌ DO ZAIMPLEMENTOWANIA OD ZERA
│   (Node.js Express - nie istnieje jeszcze)
├── tests/CloudBackend.Tests/                   ⚠️ tylko 1 dummy test
├── docs/
│   ├── api-documentation.md                    ⚠️ DO ZAKTUALIZOWANIA
│   └── architecture.mmd                        ⚠️ DO ZAKTUALIZOWANIA
├── docker-compose.yml                          ⚠️ dodać scoring-service
└── README.md                                   ⚠️ DO ZAKTUALIZOWANIA
```

---

## 🛠️ STACK TECHNOLOGICZNY (zachowujemy obecny)

### Frontend (React)
- **Framework:** React 19 + TypeScript ✅
- **Build:** Vite 7 ✅
- **HTTP:** Axios ✅
- **Routing:** ❌ DODAĆ React Router v6 (potrzebne do nawigacji formularz → wynik → historia)
- **Forms:** ❌ DODAĆ React Hook Form + Zod (walidacja formularza wniosku)
- **Stylizacja:** Inline style ⚠️ rozważyć dodanie Tailwind dla profesjonalnego wyglądu
- **Hosting:** Azure Static Web Apps ✅

### Backend główny (.NET)
- **Framework:** .NET 10 + ASP.NET Core Web API ✅
- **ORM:** Entity Framework Core 10 ✅
- **Walidacja:** ❌ DODAĆ FluentValidation
- **Autoryzacja:** ❌ DODAĆ Azure AD B2C (lub prostsze JWT, jeśli czas goni)
- **Dokumentacja API:** Swagger/OpenAPI ✅
- **Sekrety:** Azure Key Vault ✅
- **Hosting:** Azure App Service ✅

### Mikrousługa scoringowa (Node.js) - DO STWORZENIA
- **Runtime:** Node.js 20 LTS
- **Framework:** Express
- **Walidacja:** Joi
- **Testy:** Jest
- **Hosting:** `cloud-task-manager-scoring-pk` (zasób Azure już istnieje!)

### Baza danych
- **Lokalnie:** Azure SQL Edge (Docker) ✅
- **Produkcja:** Azure SQL Database `CloudTaskDB` ✅
- **Migracje:** EF Core ✅

---

## 🧮 MODEL OCENY RYZYKA KREDYTOWEGO

### Skala scoringu
300-850 punktów (wzorowane na FICO Score).

### Progi decyzyjne

| Zakres scoringu | Decyzja | Warunek dodatkowy |
|---|---|---|
| 750-850 | AKCEPTACJA | DStI ≤ 40% |
| 600-749 | ANALIZA MANUALNA | wniosek do analityka |
| 300-599 | ODRZUCENIE | automatyczne odrzucenie |

**Reguła nadrzędna:** Jeśli DStI > 50%, wniosek zawsze trafia do ANALIZY MANUALNEJ niezależnie od scoringu (zgodnie z Rekomendacją S KNF, uchwała 242/2023).

### Kluczowe wskaźniki

| Wskaźnik | Wzór | Próg |
|---|---|---|
| **DStI** | (12 × suma_miesięcznych_zobowiązań + 12 × rata_nowego_kredytu) / (12 × dochód_netto) × 100% | < 40% / 50% |
| **PTI** | rata_nowego_kredytu / dochód_netto × 100% | wskaźnik pomocniczy |
| **Dochód dyspozycyjny** | dochód_netto − zobowiązania − koszty_utrzymania | > 0 |

### Zmienne wejściowe modelu

```typescript
interface LoanApplicationData {
  // Dane demograficzne
  age: number;                    // 18-80
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dependents: number;             // 0-10
  education: 'primary' | 'vocational' | 'secondary' | 'higher';
  
  // Dane zawodowe i dochodowe
  employmentType: 'permanent' | 'b2b' | 'contract' | 'pension';
  employmentYears: number;        // 0-50
  monthlyNetIncome: number;       // PLN
  
  // Zobowiązania
  monthlyObligations: number;     // PLN
  livingCosts: number;            // PLN
  
  // Dane o kredycie
  loanAmount: number;             // PLN
  loanTermMonths: number;         // 6-360
  loanPurpose: 'consumer' | 'mortgage' | 'car' | 'consolidation';
  
  // Dane behawioralne
  pastLoans: number;              // 0+
  latePayments: number;           // 0+ (opóźnienia >30 dni w 24 mc)
  creditHistoryMonths: number;    // 0+
}
```

### Wagi w karcie punktowej (skala 300-850)

Bazowy scoring: **300 punktów**, do tego punkty z każdej kategorii (max +550):

| Kategoria | Max punkty |
|---|---|
| Historia płatności (35%) | +192 |
| Wskaźniki finansowe DStI (30%) | +165 |
| Długość historii kredytowej (15%) | +82 |
| Dane zawodowe (10%) | +55 |
| Dane demograficzne (10%) | +56 |

Logika obliczania (do implementacji w scoring-service):
- Brak opóźnień w spłatach: +192
- 1 opóźnienie: +120
- 2-3 opóźnienia: +60
- >3 opóźnień: +0

- DStI < 20%: +165
- DStI 20-30%: +130
- DStI 30-40%: +90
- DStI 40-50%: +50
- DStI > 50%: +0

(reszta według podobnego wzorca - pełna implementacja w scoring-service)

---

## 🗃️ NOWY SCHEMAT BAZY DANYCH

Migracja zastąpi istniejącą tabelę `Tasks`:

### Tabela Users
```csharp
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Role { get; set; }  // 'client', 'analyst', 'admin'
    public DateTime CreatedAt { get; set; }
}
```

### Tabela LoanApplications
```csharp
public class LoanApplication
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    
    // Dane demograficzne
    public int Age { get; set; }
    public string MaritalStatus { get; set; }
    public int Dependents { get; set; }
    public string Education { get; set; }
    
    // Dane zawodowe
    public string EmploymentType { get; set; }
    public int EmploymentYears { get; set; }
    public decimal MonthlyNetIncome { get; set; }
    
    // Zobowiązania
    public decimal MonthlyObligations { get; set; }
    public decimal LivingCosts { get; set; }
    
    // Kredyt
    public decimal LoanAmount { get; set; }
    public int LoanTermMonths { get; set; }
    public string LoanPurpose { get; set; }
    
    // Historia
    public int PastLoans { get; set; }
    public int LatePayments { get; set; }
    public int CreditHistoryMonths { get; set; }
    
    public string Status { get; set; }  // 'pending', 'completed', 'manual_review'
    public DateTime CreatedAt { get; set; }
    
    public Decision Decision { get; set; }
}
```

### Tabela Decisions
```csharp
public class Decision
{
    public Guid Id { get; set; }
    public Guid LoanApplicationId { get; set; }
    public LoanApplication LoanApplication { get; set; }
    
    public int Score { get; set; }                  // 300-850
    public string DecisionType { get; set; }        // 'ACCEPT', 'MANUAL_REVIEW', 'REJECT'
    public decimal DStI { get; set; }
    public decimal PTI { get; set; }
    public decimal DisposableIncome { get; set; }
    public string Reasoning { get; set; }           // JSON array
    public DateTime DecidedAt { get; set; }
}
```

---

## 🔌 NOWE API – SPECYFIKACJA

### Backend główny (.NET) - `cloud-task-manager-api-pk`

**Base URL produkcyjny:** 
`https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api`

#### Endpointy do zaimplementowania

| Metoda | Endpoint | Opis | Priorytet |
|---|---|---|---|
| POST | `/loan-applications` | Złożenie nowego wniosku | 🔴 NAJWYŻSZY |
| GET | `/loan-applications` | Lista wniosków klienta | 🔴 WYSOKI |
| GET | `/loan-applications/{id}` | Szczegóły wniosku z decyzją | 🔴 WYSOKI |
| GET | `/loan-applications/{id}/pdf` | Eksport decyzji do PDF | 🟡 ŚREDNI |
| GET | `/health` | Health check | 🟢 NISKI |

### Mikrousługa scoringowa (Node.js) - `cloud-task-manager-scoring-pk`

**Base URL produkcyjny:** 
`https://cloud-task-manager-scoring-pk.azurewebsites.net`

#### Endpoint scoringowy

**`POST /api/score`**

Request body:
```json
{
  "age": 35,
  "maritalStatus": "married",
  "dependents": 2,
  "education": "higher",
  "employmentType": "permanent",
  "employmentYears": 8,
  "monthlyNetIncome": 12000,
  "monthlyObligations": 800,
  "livingCosts": 4000,
  "loanAmount": 50000,
  "loanTermMonths": 36,
  "loanPurpose": "consumer",
  "pastLoans": 2,
  "latePayments": 0,
  "creditHistoryMonths": 60
}
```

Response:
```json
{
  "score": 742,
  "decision": "ACCEPT",
  "indicators": {
    "dsti": 22.5,
    "pti": 13.4,
    "disposableIncome": 7200,
    "monthlyInstallment": 1607.50
  },
  "reasoning": [
    "Stabilne zatrudnienie (UoP, 8 lat stażu)",
    "Niski wskaźnik DStI (22,5%)",
    "Brak opóźnień w spłatach"
  ],
  "calculatedAt": "2026-04-15T10:30:00Z",
  "version": "1.0.0"
}
```

Decision values: `"ACCEPT"`, `"MANUAL_REVIEW"`, `"REJECT"`

**`GET /api/health`**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345
}
```

---

## ✅ PLAN DZIAŁANIA – KOLEJNE KROKI

### FAZA 1: Mikrousługa scoringowa (Node.js) — PRIORYTET #1

To rdzeń całej pracy. Wykorzystuje istniejący zasób `cloud-task-manager-scoring-pk` 
w Azure, który jeszcze jest pusty.

#### Zadania:
- [ ] Stworzyć katalog `scoring-service/` w głównym katalogu projektu
- [ ] Setup Express + TypeScript (lub czysty JS, jak wolisz)
- [ ] `package.json` z dependencjami (express, joi, jest, supertest)
- [ ] Walidacja Joi dla request body
- [ ] Calculator: DStI (`src/calculators/dsti.js`)
- [ ] Calculator: PTI (`src/calculators/pti.js`)
- [ ] Calculator: Disposable Income (`src/calculators/disposable-income.js`)
- [ ] Calculator: Monthly Installment (`src/calculators/installment.js`)
- [ ] Scorecard model z wagami (`src/models/scorecard.js`)
- [ ] Reguły decyzyjne z override DStI > 50% (`src/models/decision-engine.js`)
- [ ] Generator reasoning (`src/services/reasoning.js`)
- [ ] Endpoint POST `/api/score` (`src/routes/score.js`)
- [ ] Endpoint GET `/api/health`
- [ ] `src/server.js` z Express setup, CORS, error handling
- [ ] Dockerfile dla Node.js
- [ ] Testy jednostkowe wszystkich kalkulatorów
- [ ] Testy integracyjne dla endpointu (Supertest)
- [ ] Plik `tests/test-cases.json` z 25 przypadkami testowymi
- [ ] Workflow GitHub Actions: `.github/workflows/azure-app-service-scoring.yml`
- [ ] Aktualizacja `docker-compose.yml` o scoring-service

### FAZA 2: Backend .NET — przerobienie istniejącego

#### Zadania:
- [ ] **Migracja bazy danych:**
  - [ ] Usunąć modele `CloudTask`, DTO `TaskCreate/Read`
  - [ ] Stworzyć modele `User`, `LoanApplication`, `Decision`
  - [ ] Stworzyć DTO: `LoanApplicationCreateDto`, `LoanApplicationReadDto`, `DecisionDto`
  - [ ] Aktualizacja `AppDbContext` (DbSets)
  - [ ] Wygenerować nową migrację: `dotnet ef migrations add CreditRiskSchema`
  - [ ] Skasować starą tabelę `Tasks` w `CloudTaskDB` (lub nowa baza)

- [ ] **Kontrolery:**
  - [ ] Usunąć `TasksController.cs`
  - [ ] Stworzyć `LoanApplicationsController.cs`:
    - POST /loan-applications (przyjmuje DTO, woła scoring service, zapisuje)
    - GET /loan-applications (lista użytkownika)
    - GET /loan-applications/{id} (szczegóły)
    - GET /loan-applications/{id}/pdf (eksport)

- [ ] **Serwisy:**
  - [ ] `Services/LoanApplicationService.cs` (logika biznesowa)
  - [ ] `Services/ScoringServiceClient.cs` (HttpClient do mikrousługi scoringowej)
  - [ ] `Services/PdfExportService.cs` (generowanie PDF)

- [ ] **Walidacja:**
  - [ ] Dodać NuGet `FluentValidation.AspNetCore`
  - [ ] `Validators/LoanApplicationCreateValidator.cs`

- [ ] **Konfiguracja:**
  - [ ] Dodać do `Program.cs`: rejestracja HttpClient dla scoring service
  - [ ] Dodać sekret `ScoringServiceUrl` do Key Vault
  - [ ] Dodać sekret `JwtSecret` do Key Vault (jeśli implementujesz auth)

- [ ] **Testy:**
  - [ ] Rozbudować `tests/CloudBackend.Tests/`
  - [ ] Test jednostkowy `LoanApplicationServiceTests`
  - [ ] Test integracyjny dla kontrolera (WebApplicationFactory)

### FAZA 3: Frontend React — przerobienie istniejącego

#### Zadania:
- [ ] **Setup nowych zależności:**
  - [ ] `npm install react-router-dom react-hook-form zod @hookform/resolvers`
  - [ ] Opcjonalnie: `npm install -D tailwindcss` (lepszy wygląd)

- [ ] **Routing:**
  - [ ] `src/App.tsx` → wprowadzić React Router
  - [ ] Routes: `/`, `/loan/new`, `/loan/result/:id`, `/loan/history`

- [ ] **Strony:**
  - [ ] Usunąć `src/pages/Dashboard.tsx`
  - [ ] `src/pages/HomePage.tsx` (landing page)
  - [ ] `src/pages/LoanApplicationForm.tsx` (4-krokowy formularz)
  - [ ] `src/pages/LoanResultPage.tsx` (wynik scoringu)
  - [ ] `src/pages/LoanHistoryPage.tsx` (historia wniosków)

- [ ] **Komponenty:**
  - [ ] `src/components/LoanForm/Step1Personal.tsx`
  - [ ] `src/components/LoanForm/Step2Employment.tsx`
  - [ ] `src/components/LoanForm/Step3Obligations.tsx`
  - [ ] `src/components/LoanForm/Step4Loan.tsx`
  - [ ] `src/components/LoanForm/StepIndicator.tsx`
  - [ ] `src/components/ScoreVisualization.tsx`
  - [ ] `src/components/DecisionCard.tsx`

- [ ] **Walidacja:**
  - [ ] `src/schemas/loanApplication.schema.ts` (Zod)

- [ ] **Service:**
  - [ ] `src/services/api.ts` ✅ zachować
  - [ ] Dodać typy TypeScript: `src/types/LoanApplication.ts`, `src/types/Decision.ts`

### FAZA 4: CI/CD i wdrożenie

#### Zadania:
- [ ] Stworzyć workflow `.github/workflows/azure-app-service-scoring.yml`
- [ ] Skonfigurować w Azure Portal credentials dla scoring-service (federated credentials w GitHub)
- [ ] Dodać sekret `VITE_API_URL` w GitHub Secrets (URL backendu)
- [ ] Aktualizacja sekretów Key Vault:
  - `DbConnectionString` (już jest)
  - `ScoringServiceUrl` (NOWY)
- [ ] Test deploymentu wszystkich trzech komponentów

### FAZA 5: Badania (do pracy pisemnej)

- [ ] **Test wydajnościowy (k6):**
  - [ ] Stworzyć `tests/load-test.js`
  - [ ] Scenariusz: 10 → 50 → 100 użytkowników
  - [ ] Eksport wyników do CSV
  - [ ] Wykres: średni czas + 95. percentyl

- [ ] **Test poprawności modelu:**
  - [ ] 25 przypadków testowych w `tests/test-cases.json`
  - [ ] Skrypt `tests/model-test.js` (Node.js)
  - [ ] Macierz konfuzji 3x3
  - [ ] Metryki: precision, recall, F1
  - [ ] Wykres metryk

### FAZA 6: Dokumentacja

- [ ] Aktualizacja `README.md`
- [ ] Aktualizacja `docs/api-documentation.md`
- [ ] Aktualizacja `docs/architecture.mmd` (diagram C4 z 3 mikrousługami)
- [ ] Stworzenie `docs/scoring-model.md` (szczegóły modelu)
- [ ] Stworzenie `docs/test-results.md` (wyniki badań)

---

## 🔒 BEZPIECZEŃSTWO

### Już zaimplementowane ✅
- Azure Key Vault dla sekretów
- HTTPS na App Service (domyślnie Azure)
- Connection string nie w kodzie

### Do zaimplementowania ⚠️
- [ ] Walidacja danych wejściowych (FluentValidation w .NET, Joi w Node.js)
- [ ] Argon2/bcrypt dla haseł użytkowników (jeśli implementujesz auth)
- [ ] CORS – obecnie `AllowAnyOrigin()` (OK na dev, w prod ograniczyć do domeny frontendu)
- [ ] Rate limiting na endpoint /api/score (np. AspNetCoreRateLimit)
- [ ] HSTS header

### NIE rób tego ❌
- ❌ Nie commituj sekretów do repo
- ❌ Nie loguj PII (dochody, hasła, dane osobowe)
- ❌ Nie używaj browser localStorage do tokenów (XSS risk)

---

## 📊 BADANIA DO PRACY PISEMNEJ

### Hipoteza H1: wydajność
> *"Aplikacja zapewnia średni czas odpowiedzi <2s dla pojedynczego wniosku."*

**Weryfikacja:** test obciążeniowy k6 w `tests/load-test.js`:
- 10 użytkowników × 3 min
- 50 użytkowników × 3 min
- 100 użytkowników × 3 min

**Metryki:** średni czas, 95. percentyl, % błędów, RPS

### Hipoteza H2: poprawność modelu
> *"Model scoringowy zgodny z Rekomendacją S KNF poprawnie ocenia ryzyko kredytowe."*

**Weryfikacja:** 25 przypadków testowych:
- 10 oczekiwanych AKCEPTACJI
- 8 oczekiwanych ODRZUCEŃ
- 7 oczekiwanych ANALIZ MANUALNYCH

**Metryki:** macierz konfuzji 3x3, precision, recall, F1, accuracy

---

## ⚙️ INSTRUKCJE DLA CLAUDE CODE

### Priorytety implementacji
1. **NAJWYŻSZY:** mikrousługa scoringowa Node.js (FAZA 1) – serce systemu
2. **WYSOKI:** przeróbka backendu .NET na model kredytowy (FAZA 2)
3. **WYSOKI:** przeróbka frontendu (FAZA 3)
4. **ŚREDNI:** workflow CI/CD dla scoring-service (FAZA 4)
5. **ŚREDNI:** badania k6 i test modelu (FAZA 5)
6. **NIŻSZY:** PDF export, panel analityka

### Kolejność prac (rekomendowana)
1. **Najpierw scoring-service** (FAZA 1) – uruchamiamy lokalnie
2. **Migracja bazy danych** (część FAZY 2) – nowe modele, migracja EF
3. **Backend kontroler + serwis** (FAZA 2) – integracja ze scoring service
4. **Frontend formularz wniosku** (FAZA 3) – minimalna wersja end-to-end
5. **Test integracji lokalnie** (Docker Compose)
6. **CI/CD** (FAZA 4) – deployment na Azure
7. **Badania** (FAZA 5) – kiedy aplikacja działa w produkcji
8. **Polishing** – PDF, panel analityka, testy

### Czego NIE robić
- ❌ Nie wymyślaj nowych funkcjonalności – trzymaj się specyfikacji w tym pliku
- ❌ Nie zmieniaj infrastruktury Azure – zasoby już są utworzone i działają
- ❌ Nie używaj eksperymentalnych wersji bibliotek – preferuj stabilne LTS
- ❌ Nie pomijaj testów dla logiki scoringowej – to kluczowe dla weryfikacji H2
- ❌ Nie commituj plików `node_modules`, `bin/`, `obj/`, `.zip` (są w .gitignore)
- ❌ Nie usuwaj istniejących workflow GitHub Actions – modyfikuj/dodawaj nowe

### Dobre praktyki
- ✅ Każdy commit atomowy z działającym kodem
- ✅ Testy jednostkowe od początku (TDD jeśli komfortowe)
- ✅ Konwencja nazewnictwa: PascalCase w .NET, camelCase w Node.js i React
- ✅ Komentarze po polsku w dokumentacji projektowej, po angielsku w kodzie
- ✅ Małe, czytelne funkcje (max 30-40 linii)
- ✅ Strong typing wszędzie (TypeScript w frontend, C# nullable refs)
- ✅ Logi: structured logging, kontekstowe ID, NIGDY PII

### Format odpowiedzi
- Plik po pliku, nie wszystko na raz
- Po implementacji większej funkcjonalności – proponuj test lokalny
- Po kompletnej fazie – aktualizuj sekcję STATUS w tym pliku

---

## 🔗 LINKI POMOCNICZE

- Repo: github.com/[twój-username]/cloud-app
- API w produkcji: https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/swagger
- Dokumentacja Azure: https://learn.microsoft.com/azure
- k6 docs: https://k6.io/docs
- Rekomendacja S KNF: https://www.knf.gov.pl

---

## 📚 ŹRÓDŁA AKADEMICKIE (do pracy pisemnej)

1. Matuszyk A., *Credit Scoring*, wyd. II, Warszawa: CeDeWu, 2018
2. Iwanicz-Drozdowska M. (red.), *Zarządzanie ryzykiem bankowym*, Wolters Kluwer, 2024
3. Newman S., *Budowanie mikrousług*, wyd. II, Helion, 2022
4. Mell P., Grance T., *NIST Definition of Cloud Computing*, NIST SP 800-145, 2011
5. Rekomendacja S KNF, uchwała nr 242/2023

---

**Ostatnia aktualizacja:** 2026-05-07
**Stan implementacji:** ~30% (infrastruktura ✅, podstawowy CRUD ✅, model kredytowy ❌)