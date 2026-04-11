# Cloud Task Manager - Przemysław Kuś 98953
 
Projekt natywnej aplikacji chmurowej realizowany w architekturze 3-warstwowej.
 
## Deklaracja Architektury (Mapowanie Azure)
Ten projekt został zaplanowany z myślą o usługach PaaS (Platform as a Service) w chmurze Azure.
 
| Warstwa | Komponent Lokalny | Usługa Azure |
| :--- | :--- | :--- |
| **Presentation** | React 19 (Vite) | Azure Static Web Apps |
| **Application** | API (.NET 9 / Node 24) | Azure App Service |
| **Data** | SQL Server (Dev) | Azure SQL Database (Serverless) |
 
## 🏗 Status Projektu i Dokumentacja
* [x] **Artefakt 1:** Zaplanowano strukturę folderów i diagram C4 (dostępny w `/docs`).
* [x] **Artefakt 2:** Środowisko wielokontenerowe uruchomione lokalnie (Docker Compose).
* [x] **Artefakt 3:** Działająca warstwa prezentacji.
* [x] **Artefakt 4:** Działająca warstwa logiki backendu.
* [x] **Artefakt 5:** Stabilność API (DTO), trwałość danych (named volumes), migracje EF Core, formularz React.

## 🚀 Quick Start

```bash
# Zbuduj i uruchom wszystkie kontenery
docker compose up --build -d

# Frontend dostępny na:  http://localhost:8080
# Backend (Swagger) na:  http://localhost:8081
```

## 🔧 Zmienne środowiskowe

| Zmienna | Wartość domyślna | Opis |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8081/api` | Adres backendu widoczny z przeglądarki |
| `ConnectionStrings__DefaultConnection` | *(docker-compose.yml)* | Connection string do SQL Server |
| `SA_PASSWORD` | `StrongPassword123!` | Hasło SA do SQL Edge |

## 📦 Architektura – Named Volumes

Dane bazy SQL Server są przechowywane w named volume `cloud-app-sqlserver-data`.  
Volume przeżywa `docker compose down` (dane trwałe). Usunięcie: `docker compose down -v`.

## 📂 Migracje EF Core

Historia schematu bazy danych jest przechowywana w folderze `backend/Migrations/`.  
Backend automatycznie stosuje nowe migracje przy starcie (`context.Database.Migrate()`).

> **Informacja:** Ten plik będzie ewoluował. W kolejnych etapach dodamy instrukcję wdrożenia CI/CD na platformę Azure.