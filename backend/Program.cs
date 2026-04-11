using CloudBackend.Data;
using Microsoft.EntityFrameworkCore;
using CloudBackend.Models;

var builder = WebApplication.CreateBuilder(args);

// --- SEKCJA USŁUG (Dependency Injection) ---

// 1. Rejestracja Kontrolerów (potrzebne, aby nasze API działało)
builder.Services.AddControllers();

// 2. Dokumentacja API (Swagger/OpenAPI)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. Pobranie Connection Stringa (zmiennej środowiskowej z Dockera)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 4. Rejestracja bazy danych MS SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// 5. Konfiguracja CORS - pozwala Reactowi (port 8080) na dostęp do API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// --- AUTOMATYCZNE TWORZENIE BAZY I SEED DANYCH ---

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // Strategia hybrydowa:
        // 1. Próbuje zastosować migracje EF Core (jeśli istnieją w assembly).
        //    Folder backend/Migrations/ zawiera historię zmian schematu (5.3).
        // 2. Jeśli migracje nie są dostępne w runtime, cofa się do EnsureCreated()
        //    – tworzy bazę i tabele na podstawie aktualnego modelu.
        var pendingMigrations = context.Database.GetPendingMigrations().ToList();
        if (pendingMigrations.Any())
        {
            Console.WriteLine($"Stosowanie {pendingMigrations.Count} migracji EF Core...");
            context.Database.Migrate();
        }
        else
        {
            // EnsureCreated jest idempotentne: tworzy schemat jeśli nie istnieje,
            // nie nadpisuje istniejących danych.
            context.Database.EnsureCreated();
        }

        // Seed: dodaje startowe dane, jeśli tabela jest pusta
        if (!context.Tasks.Any())
        {
            context.Tasks.AddRange(
                new CloudTask { Name = "Zrobić kawę", IsCompleted = true },
                new CloudTask { Name = "Uruchomić projekt w Dockerze", IsCompleted = false }
            );

            context.SaveChanges();
            Console.WriteLine("Seed danych dodany pomyślnie.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Błąd podczas inicjalizacji bazy: {ex.Message}");
    }
}

// --- SEKCJA POTOKU HTTP (Middleware) ---

// Uruchamiamy Swaggera zawsze w fazie deweloperskiej i testowej
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Cloud API V1");
    c.RoutePrefix = string.Empty;
});

// Ważne: W Dockerze często używamy HTTP wewnątrz sieci,
// więc wyłączamy wymuszone przekierowanie na HTTPS dla uproszczenia nauki
// app.UseHttpsRedirection();

app.UseCors();

// Mapowanie kontrolerów (to sprawi, że TasksController zacznie działać)
app.MapControllers();

app.Run();