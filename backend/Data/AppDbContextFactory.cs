using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CloudBackend.Data;

// Used by 'dotnet ef migrations' at design time (no Azure Key Vault needed)
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(
                "Server=localhost;Database=CreditRiskDb;User Id=sa;Password=StrongPassword123!;TrustServerCertificate=True",
                sql => sql.EnableRetryOnFailure())
            .Options;
        return new AppDbContext(options);
    }
}
