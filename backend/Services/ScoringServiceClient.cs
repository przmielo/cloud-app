using System.Text.Json;
using System.Text.Json.Serialization;
using CloudBackend.Models;

namespace CloudBackend.Services;

public interface IScoringServiceClient
{
    Task<ScoringResult?> ScoreAsync(LoanApplication app);
}

public class ScoringServiceClient : IScoringServiceClient
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ScoringServiceClient(IHttpClientFactory factory, IConfiguration config)
    {
        _http = factory.CreateClient();
        _baseUrl = config["ScoringServiceUrl"] ?? "http://localhost:3001";
    }

    public async Task<ScoringResult?> ScoreAsync(LoanApplication app)
    {
        var payload = new ScoringRequest(app);
        try
        {
            var response = await _http.PostAsJsonAsync($"{_baseUrl}/api/score", payload);
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<ScoringResult>(json, _jsonOpts);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ScoringServiceClient] error: {ex.Message}");
            return null;
        }
    }

    private record ScoringRequest(
        [property: JsonPropertyName("age")] int Age,
        [property: JsonPropertyName("educationLevel")] string EducationLevel,
        [property: JsonPropertyName("maritalStatus")] string MaritalStatus,
        [property: JsonPropertyName("dependents")] int Dependents,
        [property: JsonPropertyName("employmentType")] string EmploymentType,
        [property: JsonPropertyName("employmentYears")] int EmploymentYears,
        [property: JsonPropertyName("monthlyIncome")] decimal MonthlyIncome,
        [property: JsonPropertyName("existingMonthlyDebt")] decimal ExistingMonthlyDebt,
        [property: JsonPropertyName("loanAmount")] decimal LoanAmount,
        [property: JsonPropertyName("loanTermMonths")] int LoanTermMonths,
        [property: JsonPropertyName("loanPurpose")] string LoanPurpose,
        [property: JsonPropertyName("propertyValue")] decimal PropertyValue,
        [property: JsonPropertyName("hasCreditHistory")] bool HasCreditHistory,
        [property: JsonPropertyName("pastDelays")] int PastDelays
    )
    {
        public ScoringRequest(LoanApplication a) : this(
            a.Age, a.EducationLevel, a.MaritalStatus, a.Dependents,
            a.EmploymentType, a.EmploymentYears, a.MonthlyIncome,
            a.ExistingMonthlyDebt, a.LoanAmount, a.LoanTermMonths,
            a.LoanPurpose, a.PropertyValue, a.HasCreditHistory, a.PastDelays) { }
    }
}

public class ScoringResult
{
    public int Score { get; set; }
    public decimal DstI { get; set; }
    public decimal? LtV { get; set; }
    public decimal MonthlyInstalment { get; set; }
    public string Outcome { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
