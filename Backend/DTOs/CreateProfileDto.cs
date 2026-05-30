using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class CreateProfileDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Nickname { get; set; } = string.Empty;

        [Range(0, 150)]
        public int Age { get; set; }

        public DateTime? BirthDate { get; set; }

        [MaxLength(20)]
        public string Gender { get; set; } = string.Empty;

        [Range(50, 250)]
        public double HeightCm { get; set; }

        [Range(8, 650)]
        public double WeightKg { get; set; }

        [Range(8, 650)]
        public double? TargetWeightKg { get; set; }

        [MaxLength(50)]
        public string Goal { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ActivityLevel { get; set; } = string.Empty;

        [MaxLength(50)]
        public string DietPlan { get; set; } = string.Empty;

        public int? TargetCalories { get; set; }

        public double? TargetProtein { get; set; }

        public double? TargetCarbs { get; set; }

        public double? TargetFat { get; set; }

        public int? WaterGoalMl { get; set; }

        [MaxLength(150)]
        public string HealthStatus { get; set; } = string.Empty;

        [MaxLength(500)]
        public string FoodAllergies { get; set; } = string.Empty;

        [MaxLength(500)]
        public string FavoriteFoods { get; set; } = string.Empty;

        [MaxLength(500)]
        public string DislikedFoods { get; set; } = string.Empty;

        [MaxLength(500)]
        public string NutritionConstraints { get; set; } = string.Empty;

        [MaxLength(500)]
        public string EatingHabits { get; set; } = string.Empty;

        [MaxLength(500)]
        public string WorkoutSchedule { get; set; } = string.Empty;

        [MaxLength(10)]
        public string SleepTime { get; set; } = string.Empty;

        [MaxLength(10)]
        public string WakeTime { get; set; } = string.Empty;

        [MaxLength(20)]
        public string MeasurementUnit { get; set; } = string.Empty;
    }
}
