namespace CloudBackend.DTOs
{
    public class LoanApplicationReadDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }

        public int Age { get; set; }
        public string EducationLevel { get; set; } = string.Empty;
        public string MaritalStatus { get; set; } = string.Empty;
        public int Dependents { get; set; }

        public string EmploymentType { get; set; } = string.Empty;
        public int EmploymentYears { get; set; }
        public decimal MonthlyIncome { get; set; }

        public decimal ExistingMonthlyDebt { get; set; }

        public decimal LoanAmount { get; set; }
        public int LoanTermMonths { get; set; }
        public string LoanPurpose { get; set; } = string.Empty;
        public decimal PropertyValue { get; set; }

        public bool HasCreditHistory { get; set; }
        public int PastDelays { get; set; }

        public CreditDecisionDto? Decision { get; set; }
    }

    public class CreditDecisionDto
    {
        public int Score { get; set; }
        public decimal DstI { get; set; }
        public decimal MonthlyInstalment { get; set; }
        public string Outcome { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public DateTime DecidedAt { get; set; }
    }
}
