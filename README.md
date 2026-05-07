# Cloud Credit Risk App — Przemysław Kuś (98953)

Aplikacja chmurowa do oceny ryzyka kredytowego, zrealizowana jako praca kierunkowa
na WSB Wrocław (Informatyka). Architektura mikroserwisowa w 3 warstwach,
hostowana w Microsoft Azure.

## Architektura

| Warstwa | Komponent | Stack | Hosting Azure |
| :-- | :-- | :-- | :-- |
| Presentation | `frontend/` | React 19 + Vite + TypeScript | App Service `cloud-task-manager-frontend-pk` |
| Application (API) | `backend/` | .NET 10 + EF Core | App Service `cloud-task-manager-api-pk` |
| Application (scoring) | `scoring-service/` | Node.js 20 + Express + Joi | App Service `cloud-task-manager-scoring-pk` |
| Data | — | Azure SQL `CloudTaskDB` | Azure SQL Database |
| Sekrety | — | Azure Key Vault | `cloud-task-manager-kv-pk` |

Backend `.NET` przyjmuje wniosek kredytowy, przekazuje dane do mikrousługi scoringowej
(Node.js), zapisuje wniosek wraz z decyzją w SQL Database i udostępnia historię klientowi.

## Model scoringowy

- Skala 300–850 (wzorowana na FICO).
- Reguły decyzyjne zgodne z Rekomendacją S KNF (uchwała 242/2023).
- Progi: `750–850` ACCEPT (przy DStI ≤ 40%), `600–749` MANUAL_REVIEW, `300–599` REJECT.
- Override: `DStI > 50%` zawsze MANUAL_REVIEW.
- Szczegóły wag i wzory: `CLAUDE.md` oraz `scoring-service/src/models/scorecard.js`.

## Struktura repozytorium

```
cloud-app/
├── backend/             .NET 10 Web API (LoanApplicationController, ScoringServiceClient, EF migrations)
├── frontend/            React 19 + Vite (formularz wniosku, historia, wynik)
├── scoring-service/     Node.js Express (kalkulatory DStI/PTI, scorecard, /api/score)
├── tests/               xUnit testy backendu (.NET)
├── docs/                api-documentation.md, architecture.mmd
├── .github/workflows/   CI/CD: backend, frontend, scoring-service
├── docker-compose.yml   lokalne uruchomienie (frontend + backend + scoring + SQL Edge)
└── CLAUDE.md            kontekst projektu, plan implementacji, model scoringowy
```

## Uruchomienie lokalne

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend API + Swagger: `http://localhost:8081/swagger`
- Scoring service: `http://localhost:3001/api/health`
- SQL Edge: `localhost:1433` (sa / StrongPassword123!)

### Bez Dockera

```bash
# Scoring service
cd scoring-service && npm install && npm test && npm start

# Backend (.NET 10)
cd backend && dotnet run

# Frontend
cd frontend && npm install && npm run dev
```

## API

### Backend `.NET` — `cloud-task-manager-api-pk`
Produkcja: `https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/swagger`

| Metoda | Endpoint | Opis |
| :-- | :-- | :-- |
| POST | `/api/loan-applications` | Złożenie wniosku, scoring, zapis decyzji |
| GET | `/api/loan-applications` | Lista wniosków |
| GET | `/api/loan-applications/{id}` | Szczegóły wniosku z decyzją |

### Scoring service — `cloud-task-manager-scoring-pk`
Produkcja: `https://cloud-task-manager-scoring-pk.azurewebsites.net`

| Metoda | Endpoint | Opis |
| :-- | :-- | :-- |
| POST | `/api/score` | Walidacja Joi → kalkulacja DStI/PTI → scorecard → decyzja |
| GET | `/api/health` | Healthcheck |

Pełna specyfikacja: [`docs/api-documentation.md`](docs/api-documentation.md).

## Testy

| Komponent | Framework | Lokalizacja |
| :-- | :-- | :-- |
| Scoring service | Jest + Supertest | `scoring-service/src/__tests__/` |
| Backend .NET | xUnit | `tests/CloudBackend.Tests/` |

```bash
cd scoring-service && npm test
dotnet test tests/CloudBackend.Tests/CloudBackend.Tests.csproj
```

## CI/CD

| Workflow | Cel |
| :-- | :-- |
| `azure-app-service-backend.yml` | Build & deploy backendu .NET |
| `main_cloud-task-manager-api-pk.yml` | Auto-generated workflow Azure dla backendu |
| `main_cloud-task-manager-frontend-pk.yml` | Build & deploy frontendu |
| `scoring-deploy.yml` | Build & deploy mikrousługi scoringowej |

Sekrety w Key Vault: `DbConnectionString`, `ScoringServiceUrl`.

Plan dalszych prac, model scoringowy i hipotezy badawcze: [`CLAUDE.md`](CLAUDE.md).
