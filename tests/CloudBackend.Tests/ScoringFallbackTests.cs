using CloudBackend.Models;
using Xunit;

namespace CloudBackend.Tests;

public class ScoringFallbackTests
{
    [Theory]
    [InlineData(5000, 0, 0, 50000, 60, "approve")]
    [InlineData(3000, 1500, 0, 80000, 120, "manual")]
    [InlineData(2000, 0, 0, 30000, 24, "manual")]
    public void FallbackScoring_DstI_DrivesOutcome(
        decimal income, decimal existingDebt, decimal livingCosts,
        decimal loanAmount, int termMonths, string expectedOutcome)
    {
        var app = new LoanApplication
        {
            MonthlyIncome = income,
            ExistingMonthlyDebt = existingDebt,
            LivingCosts = livingCosts,
            LoanAmount = loanAmount,
            LoanTermMonths = termMonths,
            EmploymentType = "permanent",
            LatePayments = 0
        };

        var (actualDsti, outcome) = ComputeFallback(app);

        Assert.InRange(actualDsti, 0m, 2m);
        Assert.Equal(expectedOutcome, outcome);
    }

    [Fact]
    public void FallbackScoring_HighPastLatePayments_Rejects()
    {
        var app = new LoanApplication
        {
            MonthlyIncome = 8000,
            ExistingMonthlyDebt = 0,
            LivingCosts = 0,
            LoanAmount = 20000,
            LoanTermMonths = 24,
            EmploymentType = "permanent",
            LatePayments = 3
        };

        var (_, outcome) = ComputeFallback(app);
        Assert.Equal("reject", outcome);
    }

    [Fact]
    public void FallbackScoring_Unemployed_Rejects()
    {
        var app = new LoanApplication
        {
            MonthlyIncome = 5000,
            ExistingMonthlyDebt = 0,
            LivingCosts = 0,
            LoanAmount = 10000,
            LoanTermMonths = 12,
            EmploymentType = "unemployed",
            LatePayments = 0
        };

        var (_, outcome) = ComputeFallback(app);
        Assert.Equal("reject", outcome);
    }

    [Fact]
    public void FallbackScoring_LivingCostsExceedIncome_ManualReview()
    {
        var app = new LoanApplication
        {
            MonthlyIncome = 3000,
            ExistingMonthlyDebt = 500,
            LivingCosts = 2800,
            LoanAmount = 10000,
            LoanTermMonths = 12,
            EmploymentType = "permanent",
            LatePayments = 0
        };

        var (_, outcome) = ComputeFallback(app);
        Assert.Equal("manual", outcome);
    }

    [Fact]
    public void LoanApplication_DefaultCreatedAt_IsUtc()
    {
        var before = DateTime.UtcNow;
        var app = new LoanApplication();
        var after = DateTime.UtcNow;

        Assert.InRange(app.CreatedAt, before, after);
        Assert.Equal(DateTimeKind.Utc, app.CreatedAt.Kind);
    }

    private static (decimal dsti, string outcome) ComputeFallback(LoanApplication app)
    {
        var monthlyRate = 0.07m / 12;
        var n = app.LoanTermMonths;
        var instalment = n > 0 && monthlyRate > 0
            ? app.LoanAmount * monthlyRate * (decimal)Math.Pow((double)(1 + monthlyRate), n)
              / ((decimal)Math.Pow((double)(1 + monthlyRate), n) - 1)
            : app.LoanAmount / Math.Max(n, 1);

        var totalDebt = app.ExistingMonthlyDebt + instalment;
        var dsti = app.MonthlyIncome > 0 ? totalDebt / app.MonthlyIncome : 1m;
        var disposableIncome = app.MonthlyIncome - app.ExistingMonthlyDebt - app.LivingCosts - instalment;

        string outcome;
        if (disposableIncome <= 0)
            outcome = "manual";
        else if (dsti > 0.5m)
            outcome = "manual";
        else if (app.LatePayments > 2 || app.EmploymentType == "unemployed")
            outcome = "reject";
        else
            outcome = "approve";

        return (dsti, outcome);
    }
}
