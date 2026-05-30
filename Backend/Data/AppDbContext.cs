using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Profile> Profiles { get; set; }
        public DbSet<FoodItem> FoodItems { get; set; }
        public DbSet<MealLog> MealLogs { get; set; }
        public DbSet<MealLogDetail> MealLogDetails { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<WeightLog> WeightLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Profile>().ToTable("health_profiles");
            modelBuilder.Entity<FoodItem>().ToTable("foods");
            modelBuilder.Entity<MealLog>().ToTable("meal_logs");
            modelBuilder.Entity<MealLogDetail>().ToTable("meal_log_items");
            modelBuilder.Entity<RefreshToken>().ToTable("refresh_tokens");
            modelBuilder.Entity<WeightLog>().ToTable("weight_logs");

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Profile>()
                .HasOne(p => p.User)
                .WithMany(u => u.Profiles)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MealLog>()
                .HasOne(m => m.Profile)
                .WithMany(p => p.MealLogs)
                .HasForeignKey(m => m.UserId)
                .HasPrincipalKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MealLogDetail>()
                .HasOne(d => d.MealLog)
                .WithMany(m => m.MealLogDetails)
                .HasForeignKey(d => d.MealLogId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MealLogDetail>()
                .HasOne(d => d.FoodItem)
                .WithMany(f => f.MealLogDetails)
                .HasForeignKey(d => d.FoodItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Profile>()
                .HasIndex(p => p.UserId);

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(token => token.TokenHash)
                .IsUnique();

            modelBuilder.Entity<RefreshToken>()
                .HasOne(token => token.User)
                .WithMany(user => user.RefreshTokens)
                .HasForeignKey(token => token.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WeightLog>()
                .HasIndex(log => new { log.ProfileId, log.LoggedDate });

            modelBuilder.Entity<WeightLog>()
                .HasOne(log => log.Profile)
                .WithMany(profile => profile.WeightLogs)
                .HasForeignKey(log => log.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WeightLog>()
                .HasOne(log => log.User)
                .WithMany(user => user.WeightLogs)
                .HasForeignKey(log => log.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
