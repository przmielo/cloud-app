using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudBackend.Migrations
{
    /// <inheritdoc />
    public partial class ExtendCreditRiskSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stara kolumna PastDelays staje się LatePayments (ta sama semantyka)
            migrationBuilder.RenameColumn(
                name: "PastDelays",
                table: "LoanApplications",
                newName: "LatePayments");

            migrationBuilder.DropColumn(
                name: "HasCreditHistory",
                table: "LoanApplications");

            migrationBuilder.AddColumn<int>(
                name: "CreditHistoryMonths",
                table: "LoanApplications",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "LivingCosts",
                table: "LoanApplications",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PastLoans",
                table: "LoanApplications",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DisposableIncome",
                table: "CreditDecisions",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Pti",
                table: "CreditDecisions",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreditHistoryMonths",
                table: "LoanApplications");

            migrationBuilder.DropColumn(
                name: "LivingCosts",
                table: "LoanApplications");

            migrationBuilder.DropColumn(
                name: "PastLoans",
                table: "LoanApplications");

            migrationBuilder.DropColumn(
                name: "DisposableIncome",
                table: "CreditDecisions");

            migrationBuilder.DropColumn(
                name: "Pti",
                table: "CreditDecisions");

            migrationBuilder.RenameColumn(
                name: "LatePayments",
                table: "LoanApplications",
                newName: "PastDelays");

            migrationBuilder.AddColumn<bool>(
                name: "HasCreditHistory",
                table: "LoanApplications",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
