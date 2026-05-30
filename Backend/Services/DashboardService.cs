using Backend.Common;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class DashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<DashboardTodayResponseDto>> GetTodayAsync(int userId, int? profileId, DateTime? date)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(entry => entry.Id == userId);
            if (user == null)
            {
                return ServiceResult<DashboardTodayResponseDto>.BadRequest(AppMessages.UserNotFound);
            }

            Profile? profile;
            if (profileId.HasValue)
            {
                profile = await _context.Profiles
                    .AsNoTracking()
                    .Include(entry => entry.User)
                    .FirstOrDefaultAsync(entry => entry.Id == profileId.Value);

                if (profile == null)
                {
                    return ServiceResult<DashboardTodayResponseDto>.NotFound(AppMessages.ProfileNotFound);
                }

                if (profile.UserId != userId)
                {
                    return ServiceResult<DashboardTodayResponseDto>.Forbidden(AppMessages.Forbidden);
                }
            }
            else
            {
                profile = await _context.Profiles
                    .AsNoTracking()
                    .Include(entry => entry.User)
                    .Where(entry => entry.UserId == userId)
                    .OrderBy(entry => entry.Id)
                    .FirstOrDefaultAsync();
            }

            if (profile == null)
            {
                return ServiceResult<DashboardTodayResponseDto>.NotFound(AppMessages.ProfileNotFound);
            }

            var targetDate = (date ?? DateTime.Today).Date;
            var nextDate = targetDate.AddDays(1);
            var sevenDaysStart = targetDate.AddDays(-6);
            var thirtyDaysStart = targetDate.AddDays(-29);

            var mealLogs = await _context.MealLogs
                .AsNoTracking()
                .Where(entry => entry.UserId == profile.UserId && entry.MealDate >= targetDate && entry.MealDate < nextDate)
                .Include(entry => entry.MealLogDetails)
                .OrderBy(entry => entry.MealDate)
                .ToListAsync();

            var recentMealLogs = await _context.MealLogs
                .AsNoTracking()
                .Where(entry => entry.UserId == profile.UserId && entry.MealDate >= sevenDaysStart && entry.MealDate < nextDate)
                .Include(entry => entry.MealLogDetails)
                .OrderBy(entry => entry.MealDate)
                .ToListAsync();

            var recentLogDates = await _context.MealLogs
                .AsNoTracking()
                .Where(entry => entry.UserId == profile.UserId && entry.MealDate >= thirtyDaysStart && entry.MealDate < nextDate)
                .Select(entry => entry.MealDate.Date)
                .Distinct()
                .ToListAsync();

            var caloriesConsumed = mealLogs.Sum(entry => entry.TotalCalories);
            var proteinConsumed = mealLogs.Sum(entry => entry.MealLogDetails.Sum(detail => detail.Protein));
            var carbsConsumed = mealLogs.Sum(entry => entry.MealLogDetails.Sum(detail => detail.Carbs));
            var fatConsumed = mealLogs.Sum(entry => entry.MealLogDetails.Sum(detail => detail.Fat));
            var caloriesTarget = CalculateCaloriesTarget(profile);
            var proteinTarget = Math.Round(profile.TargetProtein ?? 120);
            var carbsTarget = Math.Round(profile.TargetCarbs ?? 250);
            var fatTarget = Math.Round(profile.TargetFat ?? 65);
            var waterGoalMl = profile.WaterGoalMl.GetValueOrDefault(2000);
            var waterConsumedMl = EstimateWaterIntakeMl(mealLogs);
            var calorieBalance = Math.Round(caloriesTarget - caloriesConsumed);
            var bmiValue = profile.HeightCm > 0
                ? Math.Round(profile.WeightKg / Math.Pow(profile.HeightCm / 100d, 2), 1)
                : (double?)null;

            var caloriesSeries = BuildCaloriesSeries(recentMealLogs, sevenDaysStart, caloriesTarget);
            var weightTrend = BuildWeightTrend(profile, sevenDaysStart, targetDate);
            var calorieAdherencePercent = CalculateCalorieAdherencePercent(caloriesSeries);
            var proteinTargetPercent = CalculateProteinTargetPercent(recentMealLogs, sevenDaysStart, targetDate, proteinTarget);
            var daysOnPlan = profile.CreatedAt.HasValue
                ? Math.Max(1, (targetDate - profile.CreatedAt.Value.Date).Days + 1)
                : 1;
            var remainingKg = CalculateRemainingKg(profile);
            var completionPercent = CalculateCompletionPercent(profile);
            var missedLogDays = CalculateMissedLogStreak(recentLogDates, targetDate);
            var alerts = BuildAlerts(
                caloriesConsumed,
                caloriesTarget,
                waterConsumedMl,
                waterGoalMl,
                mealLogs.Count,
                missedLogDays);

            var response = new DashboardTodayResponseDto
            {
                GreetingName = user.FullName ?? string.Empty,
                SummaryDateLabel = targetDate.ToString("dddd, MMM d, yyyy"),
                CaloriesConsumed = Math.Round(caloriesConsumed),
                CaloriesTarget = caloriesTarget,
                CaloriesRemaining = Math.Max(0, calorieBalance),
                CaloriesBalance = Math.Abs(calorieBalance),
                IsOverCalories = calorieBalance < 0,
                BmiValue = bmiValue,
                BmiLabel = GetBmiLabel(bmiValue),
                WeightKg = profile.WeightKg,
                HeightCm = profile.HeightCm,
                GoalLabel = MapGoalLabel(profile.Goal),
                WaterConsumedMl = waterConsumedMl,
                WaterGoalMl = waterGoalMl,
                MealsLoggedCount = mealLogs.Count,
                ExerciseMinutes = null,
                HasSyncedActivity = false,
                GoalProgress = new DashboardGoalProgressDto
                {
                    GoalLabel = MapGoalLabel(profile.Goal),
                    CurrentWeightKg = Math.Round(profile.WeightKg, 1),
                    TargetWeightKg = profile.TargetWeightKg.HasValue ? Math.Round(profile.TargetWeightKg.Value, 1) : null,
                    RemainingKg = remainingKg,
                    DaysOnPlan = daysOnPlan,
                    CompletionPercent = completionPercent
                },
                QuickCharts = new DashboardQuickChartsDto
                {
                    WeightTrend = weightTrend,
                    Calories7Days = caloriesSeries,
                    CalorieAdherencePercent = calorieAdherencePercent,
                    ProteinTargetPercent = proteinTargetPercent,
                    HasWeightHistory = false
                },
                Alerts = alerts,
                MacroProgress = new List<DashboardMacroProgressDto>
                {
                    new() { Label = "Protein", Consumed = Math.Round(proteinConsumed), Target = proteinTarget, Accent = "blue" },
                    new() { Label = "Carbs", Consumed = Math.Round(carbsConsumed), Target = carbsTarget, Accent = "amber" },
                    new() { Label = "Fat", Consumed = Math.Round(fatConsumed), Target = fatTarget, Accent = "rose" }
                },
                Meals = mealLogs.Take(3).Select(entry => new DashboardMealSummaryDto
                {
                    Title = MapMealTitle(entry.MealType),
                    Name = $"{entry.MealLogDetails.Count} items",
                    Calories = Math.Round(entry.TotalCalories)
                }).ToList()
            };

            return ServiceResult<DashboardTodayResponseDto>.Ok(response, AppMessages.GetDashboardSuccess);
        }

        private static List<DashboardChartPointDto> BuildCaloriesSeries(List<Models.MealLog> recentMealLogs, DateTime startDate, double caloriesTarget)
        {
            var grouped = recentMealLogs
                .GroupBy(entry => entry.MealDate.Date)
                .ToDictionary(group => group.Key, group => group.Sum(entry => entry.TotalCalories));

            var series = new List<DashboardChartPointDto>();

            for (var date = startDate.Date; date <= startDate.Date.AddDays(6); date = date.AddDays(1))
            {
                grouped.TryGetValue(date, out var consumed);
                series.Add(new DashboardChartPointDto
                {
                    Label = date.ToString("ddd"),
                    Value = Math.Round(consumed),
                    Target = caloriesTarget
                });
            }

            return series;
        }

        private static List<DashboardChartPointDto> BuildWeightTrend(Models.Profile profile, DateTime startDate, DateTime targetDate)
        {
            var series = new List<DashboardChartPointDto>();

            for (var date = startDate.Date; date <= targetDate.Date; date = date.AddDays(1))
            {
                series.Add(new DashboardChartPointDto
                {
                    Label = date.ToString("ddd"),
                    Value = date == targetDate.Date ? Math.Round(profile.WeightKg, 1) : null
                });
            }

            return series;
        }

        private static int CalculateCalorieAdherencePercent(List<DashboardChartPointDto> caloriesSeries)
        {
            var eligibleDays = caloriesSeries.Where(point => point.Target.HasValue && point.Target > 0).ToList();
            if (eligibleDays.Count == 0)
            {
                return 0;
            }

            var average = eligibleDays.Average(point =>
            {
                var consumed = point.Value ?? 0;
                var target = point.Target ?? 0;
                if (target <= 0)
                {
                    return 0;
                }

                var score = 100 - (Math.Abs(consumed - target) / target * 100);
                return Math.Max(0, Math.Min(100, score));
            });

            return (int)Math.Round(average);
        }

        private static int CalculateProteinTargetPercent(List<Models.MealLog> recentMealLogs, DateTime startDate, DateTime targetDate, double proteinTarget)
        {
            if (proteinTarget <= 0)
            {
                return 0;
            }

            var grouped = recentMealLogs
                .GroupBy(entry => entry.MealDate.Date)
                .ToDictionary(group => group.Key, group => group.Sum(entry => entry.MealLogDetails.Sum(detail => detail.Protein)));

            var scores = new List<double>();
            for (var date = startDate.Date; date <= targetDate.Date; date = date.AddDays(1))
            {
                grouped.TryGetValue(date, out var consumed);
                scores.Add(Math.Max(0, Math.Min(100, consumed / proteinTarget * 100)));
            }

            return scores.Count == 0 ? 0 : (int)Math.Round(scores.Average());
        }

        private static double EstimateWaterIntakeMl(List<Models.MealLog> mealLogs)
        {
            var beverageItems = mealLogs
                .SelectMany(entry => entry.MealLogDetails)
                .Where(detail =>
                    detail.ItemType.Equals("drink", StringComparison.OrdinalIgnoreCase)
                    || detail.ItemName.Contains("water", StringComparison.OrdinalIgnoreCase)
                    || detail.ItemName.Contains("nuoc", StringComparison.OrdinalIgnoreCase))
                .Sum(detail => detail.Quantity);

            if (beverageItems > 0)
            {
                return Math.Round(beverageItems);
            }

            return mealLogs.Count * 250;
        }

        private static double CalculateRemainingKg(Models.Profile profile)
        {
            if (!profile.TargetWeightKg.HasValue)
            {
                return 0;
            }

            return Math.Round(Math.Abs(profile.WeightKg - profile.TargetWeightKg.Value), 1);
        }

        private static int CalculateCompletionPercent(Models.Profile profile)
        {
            if (!profile.TargetWeightKg.HasValue || profile.WeightKg <= 0)
            {
                return 0;
            }

            var target = profile.TargetWeightKg.Value;
            var current = profile.WeightKg;

            double completion = profile.Goal switch
            {
                "lose_weight" => target >= current ? 100 : (target / current) * 100,
                "gain_weight" => current >= target ? 100 : (current / target) * 100,
                "build_muscle" => current >= target ? 100 : (current / target) * 100,
                _ => current == 0 ? 0 : 100 - (Math.Abs(current - target) / current * 100)
            };

            return (int)Math.Round(Math.Max(0, Math.Min(100, completion)));
        }

        private static int CalculateMissedLogStreak(List<DateTime> recentLogDates, DateTime targetDate)
        {
            var distinctDates = recentLogDates.Select(entry => entry.Date).ToHashSet();
            var streak = 0;

            for (var date = targetDate.Date.AddDays(-1); date >= targetDate.Date.AddDays(-30); date = date.AddDays(-1))
            {
                if (distinctDates.Contains(date))
                {
                    break;
                }

                streak++;
            }

            return streak;
        }

        private static List<DashboardAlertDto> BuildAlerts(
            double caloriesConsumed,
            double caloriesTarget,
            double waterConsumedMl,
            double waterGoalMl,
            int mealsLoggedCount,
            int missedLogDays)
        {
            var alerts = new List<DashboardAlertDto>();

            if (mealsLoggedCount == 0)
            {
                alerts.Add(new DashboardAlertDto
                {
                    Level = "warning",
                    Title = "No meals logged today",
                    Message = "Log at least one meal today so the dashboard can track intake and progress."
                });
            }

            if (waterGoalMl > 0 && waterConsumedMl < waterGoalMl)
            {
                alerts.Add(new DashboardAlertDto
                {
                    Level = "info",
                    Title = "Water intake is still low",
                    Message = $"{Math.Round(waterGoalMl - waterConsumedMl)} ml remaining to reach today's water goal."
                });
            }

            if (caloriesTarget > 0 && caloriesConsumed > caloriesTarget)
            {
                alerts.Add(new DashboardAlertDto
                {
                    Level = "warning",
                    Title = "Calories exceeded",
                    Message = $"You are {Math.Round(caloriesConsumed - caloriesTarget)} kcal above today's target."
                });
            }

            if (caloriesTarget > 0 && caloriesConsumed > 0 && caloriesConsumed < caloriesTarget * 0.5)
            {
                alerts.Add(new DashboardAlertDto
                {
                    Level = "danger",
                    Title = "Calorie intake looks too low",
                    Message = "Today's intake is below 50% of target. Review whether this is intentional and safe."
                });
            }

            if (missedLogDays >= 3)
            {
                alerts.Add(new DashboardAlertDto
                {
                    Level = "warning",
                    Title = "Logging streak was interrupted",
                    Message = $"No meal logs were found for the last {missedLogDays} day(s) before today."
                });
            }

            return alerts;
        }

        private static double CalculateCaloriesTarget(Models.Profile profile)
        {
            if (profile.Age <= 0 || profile.HeightCm <= 0 || profile.WeightKg <= 0)
            {
                if (profile.TargetCalories.HasValue && profile.TargetCalories.Value > 0)
                {
                    return profile.TargetCalories.Value;
                }

                return 2000;
            }

            var bmr = profile.Gender == "female"
                ? 10 * profile.WeightKg + 6.25 * profile.HeightCm - 5 * profile.Age - 161
                : 10 * profile.WeightKg + 6.25 * profile.HeightCm - 5 * profile.Age + 5;

            var activityFactor = profile.ActivityLevel switch
            {
                "sedentary" => 1.2,
                "light" => 1.375,
                "active" => 1.725,
                "very_active" => 1.9,
                _ => 1.55
            };

            var adjustment = profile.Goal switch
            {
                "lose_weight" => -500,
                "gain_weight" => 350,
                "build_muscle" => 250,
                _ => 0
            };

            return Math.Max(0, Math.Round(bmr * activityFactor + adjustment));
        }

        private static string GetBmiLabel(double? bmiValue)
        {
            if (!bmiValue.HasValue)
            {
                return "No data";
            }

            if (bmiValue < 18.5) return "Underweight";
            if (bmiValue < 25) return "Normal";
            if (bmiValue < 30) return "Overweight";
            return "Obese";
        }

        private static string MapGoalLabel(string? goal)
        {
            return goal switch
            {
                "lose_weight" => "Lose weight",
                "gain_weight" => "Gain weight",
                "build_muscle" => "Build muscle",
                _ => "Maintain"
            };
        }

        private static string MapMealTitle(string mealType)
        {
            return mealType.ToLowerInvariant() switch
            {
                "breakfast" => "Breakfast",
                "lunch" => "Lunch",
                "dinner" => "Dinner",
                _ => "Snack"
            };
        }
    }
}
