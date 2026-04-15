# Cloud Task Manager – Dokumentacja API

**Base URL:** `https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api`  
**Swagger UI:** `/swagger`  
**Format:** JSON  
**Autor:** Przemysław Kuś (98953)

---

## Model danych

### CloudTask

| Pole | Typ | Opis |
|------|-----|------|
| `id` | `int` | Unikalny identyfikator zadania (generowany przez bazę) |
| `name` | `string` | Nazwa zadania (wymagana) |
| `isCompleted` | `bool` | Status ukończenia zadania (domyślnie `false`) |

**Przykład obiektu:**
```json
{
  "id": 1,
  "name": "Uruchomić projekt w Dockerze",
  "isCompleted": false
}
```

---

## Endpointy

### 1. Pobierz wszystkie zadania

```
GET /api/tasks
```

**Opis:** Zwraca listę wszystkich zadań z bazy danych.

**Parametry:** brak

**Odpowiedzi:**

| Kod | Opis | Przykład |
|-----|------|---------|
| `200 OK` | Lista zadań | `[{ "id": 1, "name": "Zrobić kawę", "isCompleted": true }]` |

---

### 2. Pobierz zadanie po ID

```
GET /api/tasks/{id}
```

**Opis:** Zwraca pojedyncze zadanie o podanym identyfikatorze.

**Parametry:**

| Nazwa | Typ | Miejsce | Opis |
|-------|-----|---------|------|
| `id` | `int` | ścieżka (path) | ID zadania do pobrania |

**Odpowiedzi:**

| Kod | Opis | Przykład |
|-----|------|---------|
| `200 OK` | Znalezione zadanie | `{ "id": 1, "name": "Zrobić kawę", "isCompleted": true }` |
| `404 Not Found` | Zadanie o podanym ID nie istnieje | `""` |

---

### 3. Utwórz nowe zadanie

```
POST /api/tasks
```

**Opis:** Tworzy nowe zadanie i zapisuje je w bazie danych.

**Nagłówki:**
```
Content-Type: application/json
```

**Body (wymagane):**
```json
{
  "name": "Napisać dokumentację",
  "isCompleted": false
}
```

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `name` | `string` | tak | Nazwa zadania |
| `isCompleted` | `bool` | nie | Status ukończenia (domyślnie `false`) |

**Odpowiedzi:**

| Kod | Opis | Przykład |
|-----|------|---------|
| `201 Created` | Zadanie zostało utworzone | `{ "id": 3, "name": "Napisać dokumentację", "isCompleted": false }` |
| `400 Bad Request` | Nieprawidłowe dane wejściowe | `""` |

---

### 4. Zaktualizuj zadanie

```
PUT /api/tasks/{id}
```

**Opis:** Aktualizuje istniejące zadanie (nazwę i/lub status).

**Parametry:**

| Nazwa | Typ | Miejsce | Opis |
|-------|-----|---------|------|
| `id` | `int` | ścieżka (path) | ID zadania do zaktualizowania |

**Nagłówki:**
```
Content-Type: application/json
```

**Body (wymagane):**
```json
{
  "name": "Napisać dokumentację (zaktualizowana)",
  "isCompleted": true
}
```

**Odpowiedzi:**

| Kod | Opis |
|-----|------|
| `204 No Content` | Zadanie zostało zaktualizowane |
| `404 Not Found` | Zadanie o podanym ID nie istnieje |
| `400 Bad Request` | Nieprawidłowe dane wejściowe |

---

### 5. Usuń zadanie

```
DELETE /api/tasks/{id}
```

**Opis:** Trwale usuwa zadanie z bazy danych.

**Parametry:**

| Nazwa | Typ | Miejsce | Opis |
|-------|-----|---------|------|
| `id` | `int` | ścieżka (path) | ID zadania do usunięcia |

**Odpowiedzi:**

| Kod | Opis |
|-----|------|
| `204 No Content` | Zadanie zostało usunięte |
| `404 Not Found` | Zadanie o podanym ID nie istnieje |

---

## Przykładowe użycie (curl)

```bash
# Pobierz wszystkie zadania
curl -X GET https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api/tasks

# Utwórz nowe zadanie
curl -X POST https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name": "Nowe zadanie", "isCompleted": false}'

# Usuń zadanie o ID 1
curl -X DELETE https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/api/tasks/1
```

---

## Interaktywna dokumentacja (Swagger UI)

Projekt zawiera automatycznie generowaną dokumentację Swagger dostępną pod adresem:

```
https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net/swagger
```

Swagger UI pozwala na przeglądanie i testowanie wszystkich endpointów bezpośrednio w przeglądarce bez potrzeby użycia dodatkowych narzędzi.
