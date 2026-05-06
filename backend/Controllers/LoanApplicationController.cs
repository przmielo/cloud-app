using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CloudBackend.Data;
using CloudBackend.Models;
using CloudBackend.DTOs;
using System.Text.Json;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoanApplicationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public LoanApplicationController(
        AppDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LoanApplicationReadDto>>> GetAll()
    {
        var applications = await _context.LoanApplications
            .Include(a => a.Decision)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(applications.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LoanApplicationReadDto>> GetById(int id)
    {
        var app = await _context.LoanApplications
            .Include(a => a.Decision)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return NotFound();

        return Ok(MapToDto(app));
    }

    [HttpPost]
    public async Task<ActionResult<LoanApplicationReadDto>> Create(LoanApplicationCreateDto dto)
    {
        var application = new LoanApplication
        {
            Age = dto.Age,
            EducationLevel = dto.EducationLevel,
            MaritalStatus = dto.MaritalStatus,
            Dependents = dto.Dependents,
            EmploymentType = dto.EmploymentType,
            EmploymentYears = dto.EmploymentYears,
            MonthlyIncome = dto.MonthlyIncome,
            ExistingMonthlyDebt = dto.ExistingMonthlyDebt,
            LoanAmount = dto.LoanAmount,
            LoanTermMonths = dto.LoanTermMonths,
            LoanPurpose = dto.LoanPurpose,
            PropertyValue = dto.PropertyValue,
            HasCreditHistory = dto.HasCreditHistory,
            PastDelays = dto.PastDelays
        };

        _context.LoanApplications.Add(application);
        await _context.SaveChangesAsync();

        // Call scoring microservice
        var decision = await CallScoringService(application);
        decision.LoanApplicationId = application.Id;
        _context.CreditDecisions.Add(decision);
        await _context.SaveChangesAsync();

        application.Decision = decision;

        return CreatedAtAction(nameof(GetById), new { id = application.Id }, MapToDto(application));
    }

    private async Task<CreditDecision> CallScoringService(LoanApplication app)
    {
        try
        {
            var scoringUrl = _configuration["ScoringServiceUrl"] ?? "http://localhost:3001";
            var client = _httpClientFactory.CreateClient();

            var payload = new
            {
                age = app.Age,
                educationLevel = app.EducationLevel,
                maritalStatus = app.MaritalStatus,
                dependents = app.Dependents,
                employmentType = app.EmploymentType,
                employmentYears = app.EmploymentYears,
                monthlyIncome = app.MonthlyIncome,
                existingMonthlyDebt = app.ExistingMonthlyDebt,
                loanAmount = app.LoanAmount,
                loanTermMonths = app.LoanTermMonths,
                loanPurpose = app.LoanPurpose,
                propertyValue = app.PropertyValue,
                hasCreditHistory = app.HasCreditHistory,
                pastDelays = app.PastDelays
            };

            var response = await client.PostAsJsonAsync($"{scoringUrl}/api/score", payload);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ScoringResult>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result != null)
                {
                    return new CreditDecision
                    {
                        Score = result.Score,
                        DstI = result.DstI,
                        MonthlyInstalment = result.MonthlyInstalment,
                        Outcome = result.Outcome,
                        Reason = result.Reason
                    };
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Scoring service error: {ex.Message}");
        }

        // Fallback: basic local calculation if scoring service unavailable
        return FallbackScoring(app);
    }

    private static CreditDecision FallbackScoring(LoanApplication app)
    {
        var monthlyRate = 0.07m / 12;
        var n = app.LoanTermMonths;
        var instalment = n > 0 && monthlyRate > 0
            ? app.LoanAmount * monthlyRate * (decimal)Math.Pow((double)(1 + monthlyRate), n)
              / ((decimal)Math.Pow((double)(1 + monthlyRate), n) - 1)
            : app.LoanAmount / Math.Max(n, 1);

        var totalDebt = app.ExistingMonthlyDebt + instalment;
        var dsti = app.MonthlyIncome > 0 ? totalDebt / app.MonthlyIncome : 1m;

        string outcome;
        string reason;

        if (dsti > 0.5m)
        {
            outcome = "manual";
            reason = "Wskaźnik DStI przekracza 50% – wymagana analiza manualna.";
        }
        else if (app.PastDelays > 2 || app.EmploymentType == "unemployed")
        {
            outcome = "reject";
            reason = "Negatywna historia kredytowa lub brak zatrudnienia.";
        }
        else
        {
            outcome = "approve";
            reason = "Wniosek spełnia podstawowe kryteria scoringowe.";
        }

        return new CreditDecision
        {
            Score = 600,
            DstI = dsti,
            MonthlyInstalment = instalment,
            Outcome = outcome,
            Reason = reason
        };
    }

    private static LoanApplicationReadDto MapToDto(LoanApplication app) => new()
    {
        Id = app.Id,
        CreatedAt = app.CreatedAt,
        Age = app.Age,
        EducationLevel = app.EducationLevel,
        MaritalStatus = app.MaritalStatus,
        Dependents = app.Dependents,
        EmploymentType = app.EmploymentType,
        EmploymentYears = app.EmploymentYears,
        MonthlyIncome = app.MonthlyIncome,
        ExistingMonthlyDebt = app.ExistingMonthlyDebt,
        LoanAmount = app.LoanAmount,
        LoanTermMonths = app.LoanTermMonths,
        LoanPurpose = app.LoanPurpose,
        PropertyValue = app.PropertyValue,
        HasCreditHistory = app.HasCreditHistory,
        PastDelays = app.PastDelays,
        Decision = app.Decision == null ? null : new CreditDecisionDto
        {
            Score = app.Decision.Score,
            DstI = app.Decision.DstI,
            MonthlyInstalment = app.Decision.MonthlyInstalment,
            Outcome = app.Decision.Outcome,
            Reason = app.Decision.Reason,
            DecidedAt = app.Decision.DecidedAt
        }
    };

    private class ScoringResult
    {
        public int Score { get; set; }
        public decimal DstI { get; set; }
        public decimal MonthlyInstalment { get; set; }
        public string Outcome { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }
}
