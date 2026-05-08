namespace CloudBackend.Models
{
    public class LoanApplication
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Dane demograficzne
        public int Age { get; set; }
        public string EducationLevel { get; set; } = string.Empty;   // basic/vocational/secondary/higher
        public string MaritalStatus { get; set; } = string.Empty;    // single/married/divorced/widowed
        public int Dependents { get; set; }

        // Dane zawodowe i dochodowe
        public string EmploymentType { get; set; } = string.Empty;   // permanent/b2b/contract/pension/unemployed
        public int EmploymentYears { get; set; }
        public decimal MonthlyIncome { get; set; }

        // Zobowiązania finansowe
        public decimal ExistingMonthlyDebt { get; set; }
        public decimal LivingCosts { get; set; }

        // Dane kredytu
        public decimal LoanAmount { get; set; }
        public int LoanTermMonths { get; set; }
        public string LoanPurpose { get; set; } = string.Empty;      // housing/car/consumer/consolidation/other
        public decimal PropertyValue { get; set; }                   // 0 if not applicable

        // Historia kredytowa
        public int PastLoans { get; set; }
        public int LatePayments { get; set; }                        // number of late payments >30 days in last 24 months
        public int CreditHistoryMonths { get; set; }                 // length of credit history in months

        public CreditDecision? Decision { get; set; }
    }
}
