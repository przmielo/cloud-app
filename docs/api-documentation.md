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
| `id` | `int` | Identyfikator wniosku |
| `createdAt` | `DateTime` | Data złożenia wniosku |
| `age` | `int` | Wiek (18–80) |
| `educationLevel` | `string` | `basic` / `vocational` / `secondary` / `higher` |
| `maritalStatus` | `string` | `single` / `married` / `divorced` / `widowed` |
| `dependents` | `int` | Liczba osób na utrzymaniu (0–10) |
| `employmentType` | `string` | `permanent` / `b2b` / `contract` / `pension` / `unemployed` |
| `employmentYears` | `int` | Lata stażu pracy (0–50) |
| `monthlyIncome` | `decimal` | Dochód netto / mies. (PLN) |
| `existingMonthlyDebt` | `decimal` | Suma rat zobowiązań / mies. (PLN) |
| `livingCosts` | `decimal` | Koszty utrzymania / mies. (PLN) |
| `loanAmount` | `decimal` | Kwota kredytu (PLN, min 1000) |
| `loanTermMonths` | `int` | Okres kredytu (3–360 mies.) |
| `loanPurpose` | `string` | `housing` / `car` / `consumer` / `consolidation` / `other` |
| `propertyValue` | `decimal` | Wartość nieruchomości (PLN, 0 jeśli n/d) |
| `pastLoans` | `int` | Liczba poprzednich kredytów |
| `latePayments` | `int` | Opóźnienia >30 dni w ostatnich 24 miesiącach |
| `creditHistoryMonths` | `int` | Długość historii kredytowej (mies.) |
| `decision` | `CreditDecision` | Powiązana decyzja (po scoringu) |

### Model: CreditDecision

| Pole | Typ | Opis |
|---|---|---|
| `score` | `int` | Wynik scoringu (300–850) |
| `outcome` | `string` | `approve` / `manual` / `reject` |
| `dstI` | `decimal` | Debt Service to Income (wartość 0–1) |
| `pti` | `decimal` | Payment to Income — wskaźnik pomocniczy (wartość 0–1) |
| `disposableIncome` | `decimal` | Dochód dyspozycyjny (PLN) |
| `monthlyInstalment` | `decimal` | Rata miesięczna (PLN) |
| `reason` | `string` | Uzasadnienie decyzji |
| `decidedAt` | `DateTime` | Data wydania decyzji |

### Endpointy

#### POST `/api/loanapplication`

Złożenie wniosku. Backend waliduje dane, woła scoring service, zapisuje wniosek wraz z decyzją.
Jeśli scoring service jest niedostępny — stosowany jest fallback z uproszczoną logiką.

**Request body:** zob. model `LoanApplication` (bez `id`, `createdAt`, `decision`).

**Odpowiedzi:**

| Kod | Opis |
|---|---|
| `201 Created` | Wniosek + decyzja zwrócone w body |
| `400 Bad Request` | Walidacja nie powiodła się |

**Przykład request:**

```json
{
  "age": 35,
  "educationLevel": "higher",
  "maritalStatus": "married",
  "dependents": 1,
  "employmentType": "permanent",
  "employmentYears": 8,
  "monthlyIncome": 12000,
  "existingMonthlyDebt": 500,
  "livingCosts": 3500,
  "loanAmount": 50000,
  "loanTermMonths": 36,
  "loanPurpose": "consumer",
  "propertyValue": 0,
  "pastLoans": 2,
  "latePayments": 0,
  "creditHistoryMonths": 84
}
```

**Przykład response 201:**

```json
{
  "id": 42,
  "createdAt": "2026-05-09T10:00:00Z",
  "age": 35,
  "educationLevel": "higher",
  "maritalStatus": "married",
  "dependents": 1,
  "employmentType": "permanent",
  "employmentYears": 8,
  "monthlyIncome": 12000.00,
  "existingMonthlyDebt": 500.00,
  "livingCosts": 3500.00,
  "loanAmount": 50000.00,
  "loanTermMonths": 36,
  "loanPurpose": "consumer",
  "propertyValue": 0.00,
  "pastLoans": 2,
  "latePayments": 0,
  "creditHistoryMonths": 84,
  "decision": {
    "score": 742,
    "outcome": "approve",
    "dstI": 0.1285,
    "pti": 0.0824,
    "disposableIncome": 6511.92,
    "monthlyInstalment": 989.12,
    "reason": "Scoring powyżej 700 pkt – automatyczna akceptacja.",
    "decidedAt": "2026-05-09T10:00:00Z"
  }
}
```

#### GET `/api/loanapplication`

Lista wszystkich wniosków, posortowana od najnowszych.

| Kod | Opis |
|---|---|
| `200 OK` | Tablica wniosków z decyzjami |

#### GET `/api/loanapplication/{id}`

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

**Request body:**

```json
{
  "age": 35,
  "educationLevel": "higher",
  "maritalStatus": "married",
  "dependents": 1,
  "employmentType": "permanent",
  "employmentYears": 8,
  "monthlyIncome": 12000,
  "existingMonthlyDebt": 500,
  "livingCosts": 3500,
  "loanAmount": 50000,
  "loanTermMonths": 36,
  "loanPurpose": "consumer",
  "propertyValue": 0,
  "pastLoans": 2,
  "latePayments": 0,
  "creditHistoryMonths": 84
}
```

Pola opcjonalne (z wartością domyślną 0): `livingCosts`, `propertyValue`, `pastLoans`, `latePayments`, `creditHistoryMonths`.

**Response 200:**

```json
{
  "score": 742,
  "dstI": 0.1285,
  "pti": 0.0824,
  "ltV": null,
  "disposableIncome": 6511.92,
  "monthlyInstalment": 989.12,
  "outcome": "approve",
  "reason": "Scoring powyżej 700 pkt – automatyczna akceptacja."
}
```

**Reguły decyzyjne** (zgodne z Rekomendacją S KNF, uchwała 242/2023):

| Warunek | Decyzja | Priorytet |
|---|---|---|
| Dochód dyspozycyjny ≤ 0 | `manual` | 1 (nadrzędny) |
| DStI > 50% | `manual` | 2 (override KNF) |
| Score ≥ 700 | `approve` | 3 |
| Score 550–699 | `manual` | 4 |
| Score < 550 | `reject` | 5 |

| Kod | Opis |
|---|---|
| `200 OK` | Score + decyzja |
| `400 Bad Request` | Walidacja Joi nie powiodła się |

### GET `/api/health`

```json
{ "status": "ok", "version": "1.0.0", "uptime": 12345 }
```

---

## Wskaźniki finansowe

| Wskaźnik | Wzór | Próg / Interpretacja |
|---|---|---|
| **DStI** | (zobowiązania + rata) / dochód netto | < 40% bezpieczne, > 50% override → manual |
| **PTI** | rata / dochód netto | wskaźnik pomocniczy (Matuszyk 2018, s. 88) |
| **LtV** | kwota / wartość nieruchomości | tylko kredyty hipoteczne |
| **Dochód dyspozycyjny** | dochód − zobowiązania − koszty utrzymania − rata | musi być > 0 (Rekomendacja S KNF) |

---

## Przykłady użycia (curl)

```bash
# Scoring bezpośrednio do mikrousługi
curl -X POST https://cloud-task-manager-scoring-pk.azurewebsites.net/api/score \
  -H "Content-Type: application/json" \
  -d '{"age":35,"educationLevel":"higher","maritalStatus":"married","dependents":1,"employmentType":"permanent","employmentYears":8,"monthlyIncome":12000,"existingMonthlyDebt":500,"livingCosts":3500,"loanAmount":50000,"loanTermMonths":36,"loanPurpose":"consumer","propertyValue":0,"pastLoans":2,"latePayments":0,"creditHistoryMonths":84}'

# Złożenie wniosku przez backend
curl -X POST https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api/loanapplication \
  -H "Content-Type: application/json" \
  -d '{"age":35,"educationLevel":"higher","maritalStatus":"married","dependents":1,"employmentType":"permanent","employmentYears":8,"monthlyIncome":12000,"existingMonthlyDebt":500,"livingCosts":3500,"loanAmount":50000,"loanTermMonths":36,"loanPurpose":"consumer","propertyValue":0,"pastLoans":2,"latePayments":0,"creditHistoryMonths":84}'
```

Interaktywna dokumentacja Swagger: `/swagger` na backendzie.
