using Microsoft.EntityFrameworkCore;
using CloudBackend.Models;

namespace CloudBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<CloudTask> Tasks { get; set; }
    }
}