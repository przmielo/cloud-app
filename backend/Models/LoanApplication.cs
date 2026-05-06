namespace CloudBackend.Models
{
    public class LoanApplication
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Dane demograficzne
        public int Age { get; set; }
        public string EducationLevel { get; set; } = string.Empty;   // basic/secondary/higher
        public string MaritalStatus { get; set; } = string.Empty;    // single/married/divorced
        public int Dependents { get; set; }

        // Dane zawodowe i dochodowe
        public string EmploymentType { get; set; } = string.Empty;   // permanent/contract/self/unemployed
        public int EmploymentYears { get; set; }
        public decimal MonthlyIncome { get; set; }

        // Zobowiązania finansowe
        public decimal ExistingMonthlyDebt { get; set; }

        // Dane kredytu
        public decimal LoanAmount { get; set; }
        public int LoanTermMonths { get; set; }
        public string LoanPurpose { get; set; } = string.Empty;      // housing/car/consumer/other
        public decimal PropertyValue { get; set; }                   // 0 if not applicable

        // Historia kredytowa
        public bool HasCreditHistory { get; set; }
        public int PastDelays { get; set; }                          // number of past late payments

        public CreditDecision? Decision { get; set; }
    }
}
