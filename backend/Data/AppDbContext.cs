using Microsoft.EntityFrameworkCore;
using CloudBackend.Models;

namespace CloudBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<LoanApplication> LoanApplications { get; set; }
        public DbSet<CreditDecision> CreditDecisions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<LoanApplication>()
                .HasOne(a => a.Decision)
                .WithOne(d => d.Application)
                .HasForeignKey<CreditDecision>(d => d.LoanApplicationId);

            modelBuilder.Entity<LoanApplication>()
                .Property(a => a.MonthlyIncome)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<LoanApplication>()
                .Property(a => a.ExistingMonthlyDebt)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<LoanApplication>()
                .Property(a => a.LivingCosts)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<LoanApplication>()
                .Property(a => a.LoanAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<LoanApplication>()
                .Property(a => a.PropertyValue)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<CreditDecision>()
                .Property(d => d.DstI)
                .HasColumnType("decimal(18,4)");

            modelBuilder.Entity<CreditDecision>()
                .Property(d => d.Pti)
                .HasColumnType("decimal(18,4)");

            modelBuilder.Entity<CreditDecision>()
                .Property(d => d.MonthlyInstalment)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<CreditDecision>()
                .Property(d => d.DisposableIncome)
                .HasColumnType("decimal(18,2)");
        }
    }
}
