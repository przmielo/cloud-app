namespace CloudBackend.Models
{
    public class CreditDecision
    {
        public int Id { get; set; }
        public int LoanApplicationId { get; set; }
        public DateTime DecidedAt { get; set; } = DateTime.UtcNow;

        public int Score { get; set; }              // 300-850
        public decimal DstI { get; set; }           // Debt Service to Income ratio
        public decimal MonthlyInstalment { get; set; }

        // approve / manual / reject
        public string Outcome { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;

        public LoanApplication? Application { get; set; }
    }
}
