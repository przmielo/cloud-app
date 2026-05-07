# Cloud Credit Risk App – Dokumentacja API

**Autor:** Przemysław Kuś (98953)
**Format:** JSON

System składa się z dwóch publicznych API:

1. **Backend API (.NET)** — przyjmuje wnioski kredytowe, orkiestruje scoring, zapisuje decyzje.
2. **Scoring Service (Node.js)** — czysta funkcja: dane wniosku → score + decyzja.

---

## 1. Backend API (.NET)

**Base URL (prod):** `https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api`
**Swagger:** `/swagger`

### Model: LoanApplication

| Pole | Typ | Opis |
|---|---|---|
| `id` | `Guid` | Identyfikator wniosku |
| `userId` | `Guid` | Identyfikator klienta |
| `age` | `int` | Wiek (18–80) |
| `maritalStatus` | `string` | `single` / `married` / `divorced` / `widowed` |
| `dependents` | `int` | Liczba osób na utrzymaniu (0–10) |
| `education` | `string` | `primary` / `vocational` / `secondary` / `higher` |
| `employmentType` | `string` | `permanent` / `b2b` / `contract` / `pension` |
| `employmentYears` | `int` | Lata stażu pracy |
| `monthlyNetIncome` | `decimal` | Dochód netto / mies. (PLN) |
| `monthlyObligations` | `decimal` | Suma rat zobowiązań / mies. (PLN) |
| `livingCosts` | `decimal` | Koszty utrzymania / mies. (PLN) |
| `loanAmount` | `decimal` | Kwota kredytu (PLN) |
| `loanTermMonths` | `int` | Okres kredytu (6–360) |
| `loanPurpose` | `string` | `consumer` / `mortgage` / `car` / `consolidation` |
| `pastLoans` | `int` | Liczba poprzednich kredytów |
| `latePayments` | `int` | Opóźnienia >30 dni w 24 mc |
| `creditHistoryMonths` | `int` | Długość historii kredytowej (mies.) |
| `status` | `string` | `pending` / `completed` / `manual_review` |
| `createdAt` | `DateTime` | Data złożenia wniosku |
| `decision` | `Decision` | Powiązana decyzja (po scoringu) |

### Model: Decision

| Pole | Typ | Opis |
|---|---|---|
| `score` | `int` | Wynik scoringu (300–850) |
| `decisionType` | `string` | `ACCEPT` / `MANUAL_REVIEW` / `REJECT` |
| `dsti` | `decimal` | Debt Service to Income (%) |
| `pti` | `decimal` | Payment to Income (%) |
| `disposableIncome` | `decimal` | Dochód dyspozycyjny (PLN) |
| `reasoning` | `string` | JSON array z uzasadnieniem |
| `decidedAt` | `DateTime` | Data wydania decyzji |

### Endpointy

#### POST `/api/loan-applications`

Złożenie wniosku. Backend waliduje dane, woła scoring service, zapisuje wniosek wraz z decyzją.

**Request body:** zob. model `LoanApplication` (bez `id`, `status`, `createdAt`, `decision`).

**Odpowiedzi:**
| Kod | Opis |
|---|---|
| `201 Created` | Wniosek + decyzja zwrócone w body |
| `400 Bad Request` | Walidacja nie powiodła się |
| `502 Bad Gateway` | Scoring service nieosiągalny (decyzja fallback `MANUAL_REVIEW`) |

#### GET `/api/loan-applications`

Lista wszystkich wniosków klienta.

| Kod | Opis |
|---|---|
| `200 OK` | Tablica wniosków |

#### GET `/api/loan-applications/{id}`

Szczegóły pojedynczego wniosku wraz z decyzją.

| Kod | Opis |
|---|---|
| `200 OK` | Wniosek z decyzją |
| `404 Not Found` | Wniosek nie istnieje |

---

## 2. Scoring Service (Node.js)

**Base URL (prod):** `https://cloud-task-manager-scoring-pk.azurewebsites.net`

### POST `/api/score`

Czysta funkcja: walidacja Joi → kalkulacja DStI / PTI / dochodu dyspozycyjnego → scorecard 300–850 → decyzja.

**Request body** (wszystkie pola wymagane):

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

**Response 200:**

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
  "calculatedAt": "2026-05-07T10:30:00Z",
  "version": "1.0.0"
}
```

**Reguły decyzyjne** (zgodne z Rekomendacją S KNF, uchwała 242/2023):

| Score | Decyzja | Warunek |
|---|---|---|
| 750–850 | `ACCEPT` | DStI ≤ 40% |
| 600–749 | `MANUAL_REVIEW` | — |
| 300–599 | `REJECT` | — |

Override: gdy `DStI > 50%`, decyzja zawsze `MANUAL_REVIEW`.

| Kod | Opis |
|---|---|
| `200 OK` | Score + decyzja |
| `400 Bad Request` | Walidacja Joi nie powiodła się |

### GET `/api/health`

```json
{ "status": "ok", "version": "1.0.0", "uptime": 12345 }
```

---

## Przykłady użycia (curl)

```bash
# Scoring (bezpośrednio do mikrousługi)
curl -X POST https://cloud-task-manager-scoring-pk.azurewebsites.net/api/score \
  -H "Content-Type: application/json" \
  -d @scoring-service/src/__tests__/sample-request.json

# Złożenie wniosku przez backend
curl -X POST https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api/loan-applications \
  -H "Content-Type: application/json" \
  -d '{ "age": 35, "monthlyNetIncome": 12000, ... }'
```

Interaktywna dokumentacja Swagger: `/swagger` na backendzie.
