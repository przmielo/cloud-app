namespace CloudBackend.DTOs
{
    public class LoanApplicationCreateDto
    {
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
    }
}
