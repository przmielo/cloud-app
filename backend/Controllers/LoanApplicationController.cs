using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CloudBackend.Data;
using CloudBackend.Models;
using CloudBackend.DTOs;
using CloudBackend.Services;

namespace CloudBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoanApplicationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IScoringServiceClient _scoring;

    public LoanApplicationController(AppDbContext context, IScoringServiceClient scoring)
    {
        _context = context;
        _scoring = scoring;
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
            LivingCosts = dto.LivingCosts,
            LoanAmount = dto.LoanAmount,
            LoanTermMonths = dto.LoanTermMonths,
            LoanPurpose = dto.LoanPurpose,
            PropertyValue = dto.PropertyValue,
            PastLoans = dto.PastLoans,
            LatePayments = dto.LatePayments,
            CreditHistoryMonths = dto.CreditHistoryMonths
        };

        _context.LoanApplications.Add(application);
        await _context.SaveChangesAsync();

        var result = await _scoring.ScoreAsync(application);
        var decision = result != null
            ? new CreditDecision
            {
                Score = result.Score,
                DstI = result.DstI,
                Pti = result.Pti,
                MonthlyInstalment = result.MonthlyInstalment,
                DisposableIncome = result.DisposableIncome,
                Outcome = result.Outcome,
                Reason = result.Reason
            }
            : FallbackScoring(application);

        decision.LoanApplicationId = application.Id;
        _context.CreditDecisions.Add(decision);
        await _context.SaveChangesAsync();

        application.Decision = decision;

        return CreatedAtAction(nameof(GetById), new { id = application.Id }, MapToDto(application));
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
        var pti = app.MonthlyIncome > 0 ? instalment / app.MonthlyIncome : 1m;
        var disposableIncome = app.MonthlyIncome - app.ExistingMonthlyDebt - app.LivingCosts - instalment;

        string outcome;
        string reason;

        if (disposableIncome <= 0)
        {
            outcome = "manual";
            reason = "Dochód dyspozycyjny ≤ 0 — wymagana analiza manualna zgodnie z Rekomendacją S KNF.";
        }
        else if (dsti > 0.5m)
        {
            outcome = "manual";
            reason = "Wskaźnik DStI przekracza 50% – wymagana analiza manualna.";
        }
        else if (app.LatePayments > 2 || app.EmploymentType == "unemployed")
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
            Pti = pti,
            MonthlyInstalment = instalment,
            DisposableIncome = disposableIncome,
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
        LivingCosts = app.LivingCosts,
        LoanAmount = app.LoanAmount,
        LoanTermMonths = app.LoanTermMonths,
        LoanPurpose = app.LoanPurpose,
        PropertyValue = app.PropertyValue,
        PastLoans = app.PastLoans,
        LatePayments = app.LatePayments,
        CreditHistoryMonths = app.CreditHistoryMonths,
        Decision = app.Decision == null ? null : new CreditDecisionDto
        {
            Score = app.Decision.Score,
            DstI = app.Decision.DstI,
            Pti = app.Decision.Pti,
            MonthlyInstalment = app.Decision.MonthlyInstalment,
            DisposableIncome = app.Decision.DisposableIncome,
            Outcome = app.Decision.Outcome,
            Reason = app.Decision.Reason,
            DecidedAt = app.Decision.DecidedAt
        }
    };

}
