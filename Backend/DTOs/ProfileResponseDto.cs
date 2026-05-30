using Backend.Models;

namespace Backend.DTOs
{
    public class ProfileResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Nickname { get; set; } = string.Empty;
        public int Age { get; set; }
        public DateTime? BirthDate { get; set; }
        public string Gender { get; set; } = string.Empty;
        public double HeightCm { get; set; }
        public double WeightKg { get; set; }
        public double? TargetWeightKg { get; set; }
        public double Bmi { get; set; }
        public string Goal { get; set; } = string.Empty;
        public string ActivityLevel { get; set; } = string.Empty;
        public string DietPlan { get; set; } = string.Empty;
        public int? TargetCalories { get; set; }
        public double? TargetProtein { get; set; }
        public double? TargetCarbs { get; set; }
        public double? TargetFat { get; set; }
        public int? WaterGoalMl { get; set; }
        public string HealthStatus { get; set; } = string.Empty;
        public string FoodAllergies { get; set; } = string.Empty;
        public string FavoriteFoods { get; set; } = string.Empty;
        public string DislikedFoods { get; set; } = string.Empty;
        public string NutritionConstraints { get; set; } = string.Empty;
        public string EatingHabits { get; set; } = string.Empty;
        public string WorkoutSchedule { get; set; } = string.Empty;
        public string SleepTime { get; set; } = string.Empty;
        public string WakeTime { get; set; } = string.Empty;
        public string MeasurementUnit { get; set; } = string.Empty;
        public string SpecialStatusFlag { get; set; } = string.Empty;
        public string BmiWarning { get; set; } = string.Empty;
    }
}
