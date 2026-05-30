using Backend.DTOs;
using Backend.Models;

namespace Backend.Mappings
{
    public static class ProfileMappings
    {
        public static ProfileResponseDto ToResponseDto(this Profile profile)
        {
            var today = DateTime.Today;
            var age = 0;

            if (profile.User?.BirthDate is DateTime birthDate)
            {
                age = today.Year - birthDate.Year;
                if (birthDate.Date > today.AddYears(-age))
                {
                    age--;
                }
            }

            var specialStatusFlag = profile.SpecialStatusFlag ?? string.Empty;

            return new ProfileResponseDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                Name = profile.User?.FullName ?? string.Empty,
                Nickname = profile.Nickname ?? string.Empty,
                Age = age,
                BirthDate = profile.User?.BirthDate,
                Gender = MapGender(profile.User?.Gender),
                HeightCm = profile.HeightCm,
                WeightKg = profile.WeightKg,
                TargetWeightKg = profile.TargetWeightKg,
                Bmi = profile.Bmi ?? 0.0,
                Goal = MapGoal(profile.Goal),
                ActivityLevel = MapActivityLevel(profile.ActivityLevel),
                DietPlan = MapDietPlan(profile.DietPlan, profile.Goal),
                TargetCalories = profile.TargetCalories,
                TargetProtein = profile.TargetProtein,
                TargetCarbs = profile.TargetCarbs,
                TargetFat = profile.TargetFat,
                WaterGoalMl = profile.WaterGoalMl,
                HealthStatus = profile.HealthStatus ?? string.Empty,
                FoodAllergies = profile.FoodAllergies ?? string.Empty,
                FavoriteFoods = profile.FavoriteFoods ?? string.Empty,
                DislikedFoods = profile.DislikedFoods ?? string.Empty,
                NutritionConstraints = profile.NutritionConstraints ?? string.Empty,
                EatingHabits = profile.EatingHabits ?? string.Empty,
                WorkoutSchedule = profile.WorkoutSchedule ?? string.Empty,
                SleepTime = profile.SleepTime ?? string.Empty,
                WakeTime = profile.WakeTime ?? string.Empty,
                MeasurementUnit = string.IsNullOrWhiteSpace(profile.MeasurementUnit) ? "metric" : profile.MeasurementUnit,
                SpecialStatusFlag = specialStatusFlag,
                BmiWarning = specialStatusFlag == "short_stature_adult"
                    ? "BMI is calculated using adult standards. For individuals with very small body size, BMI may not fully reflect health status!"
                    : string.Empty
            };
        }

        private static string MapGender(string? value)
        {
            return value?.Trim().ToLowerInvariant() switch
            {
                "female" or "nữ" => "Female",
                "male" or "nam" => "Male",
                _ => "Male"
            };
        }

        private static string MapGoal(string? value)
        {
            return value?.Trim().ToLowerInvariant() switch
            {
                "lose_weight" or "giảm cân" => "Lose weight",
                "gain_weight" or "tăng cân" => "Gain weight",
                "build_muscle" or "tăng cơ" => "Build muscle",
                "maintain" or "giữ dáng" => "Maintain",
                _ => "Maintain"
            };
        }

        private static string MapActivityLevel(string? value)
        {
            return value?.Trim().ToLowerInvariant() switch
            {
                "sedentary" or "ít vận động" => "Sedentary",
                "light" or "vận động nhẹ" => "Lightly active",
                "moderate" or "vận động vừa" => "Moderately active",
                "active" or "vận động nhiều" => "Very active",
                "very_active" or "rất năng động" => "Extra active",
                _ => "Moderately active"
            };
        }

        private static string MapDietPlan(string? value, string? goal)
        {
            var normalized = value?.Trim().ToLowerInvariant();

            return normalized switch
            {
                "high-protein-cut" => "high-protein-cut",
                "balanced-cut" => "balanced-cut",
                "mediterranean" => "mediterranean",
                "balanced-maintain" => "balanced-maintain",
                "lower-carb" => "lower-carb",
                "clean-bulk" => "clean-bulk",
                "lean-bulk" => "lean-bulk",
                "performance" => "performance",
                "plant-forward" => "plant-forward",
                var custom when !string.IsNullOrWhiteSpace(custom) && custom.StartsWith("custom:p", StringComparison.Ordinal) => custom,
                _ => goal?.Trim().ToLowerInvariant() switch
                {
                    "lose_weight" => "high-protein-cut",
                    "gain_weight" => "clean-bulk",
                    "build_muscle" => "lean-bulk",
                    _ => "balanced-maintain"
                }
            };
        }
    }
}
