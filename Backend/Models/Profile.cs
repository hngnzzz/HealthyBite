using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Profile
    {
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("height_cm")]
        public double HeightCm { get; set; }

        [Column("weight_kg")]
        public double WeightKg { get; set; }

        [Column("target_weight_kg")]
        public double? TargetWeightKg { get; set; }

        [MaxLength(50)]
        [Column("goal")]
        public string? Goal { get; set; }

        [MaxLength(50)]
        [Column("activity_level")]
        public string? ActivityLevel { get; set; }

        [MaxLength(50)]
        [Column("diet_plan")]
        public string? DietPlan { get; set; }

        [Column("target_calories")]
        public int? TargetCalories { get; set; }

        [Column("target_protein")]
        public double? TargetProtein { get; set; }

        [Column("target_fat")]
        public double? TargetFat { get; set; }

        [Column("target_carbs")]
        public double? TargetCarbs { get; set; }

        [Column("water_goal_ml")]
        public int? WaterGoalMl { get; set; }

        [MaxLength(150)]
        [Column("health_status")]
        public string? HealthStatus { get; set; }

        [MaxLength(100)]
        [Column("nickname")]
        public string? Nickname { get; set; }

        [MaxLength(500)]
        [Column("food_allergies")]
        public string? FoodAllergies { get; set; }

        [MaxLength(500)]
        [Column("favorite_foods")]
        public string? FavoriteFoods { get; set; }

        [MaxLength(500)]
        [Column("disliked_foods")]
        public string? DislikedFoods { get; set; }

        [MaxLength(500)]
        [Column("nutrition_constraints")]
        public string? NutritionConstraints { get; set; }

        [MaxLength(500)]
        [Column("eating_habits")]
        public string? EatingHabits { get; set; }

        [MaxLength(500)]
        [Column("workout_schedule")]
        public string? WorkoutSchedule { get; set; }

        [MaxLength(10)]
        [Column("sleep_time")]
        public string? SleepTime { get; set; }

        [MaxLength(10)]
        [Column("wake_time")]
        public string? WakeTime { get; set; }

        [MaxLength(20)]
        [Column("measurement_unit")]
        public string? MeasurementUnit { get; set; }

        [Column("bmi")]
        public double? Bmi { get; set; }

        [Column("special_status_flag")]
        [MaxLength(100)]
        public string? SpecialStatusFlag { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [NotMapped]
        public string Name => User?.FullName ?? string.Empty;

        [NotMapped]
        public int Age
        {
            get
            {
                if (User?.BirthDate is not DateTime birthDate)
                {
                    return 0;
                }

                var today = DateTime.Today;
                var age = today.Year - birthDate.Year;
                if (birthDate.Date > today.AddYears(-age))
                {
                    age--;
                }

                return age;
            }
        }

        [NotMapped]
        public string Gender => User?.Gender ?? string.Empty;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        public ICollection<MealLog> MealLogs { get; set; } = new List<MealLog>();
        public ICollection<WeightLog> WeightLogs { get; set; } = new List<WeightLog>();
    }
}
