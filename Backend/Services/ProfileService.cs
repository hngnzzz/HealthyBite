using Backend.Common;
using Backend.Data;
using Backend.DTOs;
using Backend.Helpers;
using Backend.Mappings;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace Backend.Services
{
    public class ProfileService
    {
        private readonly AppDbContext _context;

        public ProfileService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<ProfileResponseDto>> CreateProfileAsync(int userId, CreateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ServiceResult<ProfileResponseDto>.BadRequest(AppMessages.UserNotFound);
            }

            // Validate inputs
            var (isValid, errorMsg, specialFlag, warning) = ValidateProfileInputs(dto.Name, dto.Age, dto.HeightCm, dto.WeightKg, dto.TargetWeightKg);
            if (!isValid)
            {
                return ServiceResult<ProfileResponseDto>.BadRequest(errorMsg!);
            }

            ApplyUserProfileFields(user, dto.Name, dto.Gender, dto.Age, dto.BirthDate);

            var existingProfile = await _context.Profiles.FirstOrDefaultAsync(entry => entry.UserId == userId);
            if (existingProfile != null)
            {
                ApplyProfileFields(existingProfile, dto, specialFlag);
                await _context.SaveChangesAsync();

                return ServiceResult<ProfileResponseDto>.Ok(
                    await GetProfileResponseAsync(existingProfile.Id),
                    warning ?? AppMessages.UpdateProfileSuccess);
            }

            var profile = new Profile
            {
                UserId = userId
            };

            ApplyProfileFields(profile, dto, specialFlag);
            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();

            return ServiceResult<ProfileResponseDto>.Ok(
                await GetProfileResponseAsync(profile.Id),
                warning ?? AppMessages.CreateProfileSuccess);
        }

        public async Task<ServiceResult<List<ProfileResponseDto>>> GetProfilesByUserIdAsync(int userId)
        {
            var profiles = await _context.Profiles
                .Include(entry => entry.User)
                .Where(entry => entry.UserId == userId)
                .OrderBy(entry => entry.Id)
                .ToListAsync();

            return ServiceResult<List<ProfileResponseDto>>.Ok(
                profiles.Select(entry => entry.ToResponseDto()).ToList(),
                AppMessages.GetProfilesSuccess);
        }

        public async Task<ServiceResult<ProfileResponseDto>> GetProfileByIdAsync(int userId, int id)
        {
            var profile = await _context.Profiles
                .Include(entry => entry.User)
                .FirstOrDefaultAsync(entry => entry.Id == id);

            return profile == null
                ? ServiceResult<ProfileResponseDto>.NotFound(AppMessages.ProfileNotFound)
                : profile.UserId != userId
                    ? ServiceResult<ProfileResponseDto>.Forbidden(AppMessages.Forbidden)
                : ServiceResult<ProfileResponseDto>.Ok(profile.ToResponseDto(), AppMessages.GetProfileSuccess);
        }

        public async Task<ServiceResult> UpdateProfileAsync(int userId, int id, UpdateProfileDto dto)
        {
            var profile = await _context.Profiles
                .Include(entry => entry.User)
                .FirstOrDefaultAsync(entry => entry.Id == id);

            if (profile == null)
            {
                return ServiceResult.NotFound(AppMessages.ProfileNotFound);
            }

            if (profile.UserId != userId)
            {
                return ServiceResult.Forbidden(AppMessages.Forbidden);
            }

            // Validate inputs
            var age = dto.Age;
            var (isValid, errorMsg, specialFlag, warning) = ValidateProfileInputs(dto.Name, age, dto.HeightCm, dto.WeightKg, dto.TargetWeightKg);
            if (!isValid)
            {
                return ServiceResult.BadRequest(errorMsg!);
            }

            if (profile.User != null)
            {
                ApplyUserProfileFields(profile.User, dto.Name, dto.Gender, age, dto.BirthDate);
            }

            ApplyProfileFields(profile, dto, specialFlag);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(warning ?? AppMessages.UpdateProfileSuccess);
        }

        public async Task<ServiceResult> DeleteProfileAsync(int userId, int id)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(entry => entry.Id == id);
            if (profile == null)
            {
                return ServiceResult.NotFound(AppMessages.ProfileNotFound);
            }

            if (profile.UserId != userId)
            {
                return ServiceResult.Forbidden(AppMessages.Forbidden);
            }

            _context.Profiles.Remove(profile);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(AppMessages.DeleteProfileSuccess);
        }

        private async Task<ProfileResponseDto> GetProfileResponseAsync(int profileId)
        {
            var profile = await _context.Profiles
                .Include(entry => entry.User)
                .FirstOrDefaultAsync(entry => entry.Id == profileId);

            if (profile == null)
            {
                throw new InvalidOperationException($"Profile with ID {profileId} not found after creation");
            }

            return profile.ToResponseDto();
        }

        private static (bool isValid, string? error, string? flag, string? warning) ValidateProfileInputs(
            string name,
            int age,
            double heightCm,
            double weightKg,
            double? targetWeightKg)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return (false, "Profile name is required.", null, null);
            }
            if (age <= 0)
            {
                return (false, "Age must be greater than 0.", null, null);
            }
            if (heightCm <= 0)
            {
                return (false, "Height must be greater than 0.", null, null);
            }
            if (weightKg <= 0)
            {
                return (false, "Weight must be greater than 0.", null, null);
            }
            if (heightCm < 50 || heightCm > 250)
            {
                return (false, "Invalid height: must be between 0.5m and 2.5m (50-250cm).", null, null);
            }
            if (weightKg < 8 || weightKg > 650)
            {
                return (false, "Invalid weight: must be between 8kg and 650kg.", null, null);
            }
            if (!targetWeightKg.HasValue || targetWeightKg.Value <= 0)
            {
                return (false, "Target weight is required.", null, null);
            }
            if (targetWeightKg.Value < 8 || targetWeightKg.Value > 650)
            {
                return (false, "Target weight must be between 8kg and 650kg.", null, null);
            }
            if (targetWeightKg.Value < weightKg * 0.5 || targetWeightKg.Value > weightKg * 1.5)
            {
                return (false, "Target weight is not reasonable for the current weight.", null, null);
            }

            // Special case for adults
            if (age >= 18 && (heightCm < 130 || weightKg < 35))
            {
                var flag = "short_stature_adult";
                var warning = "BMI is calculated using adult standards. For individuals with very small body size, BMI may not fully reflect health status!";
                return (true, null, flag, warning);
            }

            return (true, null, null, null);
        }

        private static void ApplyUserProfileFields(User user, string name, string gender, int age, DateTime? birthDate)
        {
            user.FullName = name.Trim();
            user.Gender = DomainValueNormalizer.NormalizeGender(gender);
            user.BirthDate = birthDate?.Date ?? CalculateBirthDate(age);
            user.UpdatedAt = DateTime.Now;
        }

        private static void ApplyProfileFields(Profile profile, CreateProfileDto dto, string? specialFlag)
        {
            profile.HeightCm = dto.HeightCm;
            profile.WeightKg = dto.WeightKg;
            profile.TargetWeightKg = dto.TargetWeightKg;
            profile.Goal = DomainValueNormalizer.NormalizeGoal(dto.Goal);
            profile.ActivityLevel = DomainValueNormalizer.NormalizeActivityLevel(dto.ActivityLevel);
            profile.DietPlan = DomainValueNormalizer.NormalizeDietPlan(dto.DietPlan);
            profile.TargetCalories = dto.TargetCalories;
            profile.TargetProtein = dto.TargetProtein;
            profile.TargetCarbs = dto.TargetCarbs;
            profile.TargetFat = dto.TargetFat;
            profile.WaterGoalMl = dto.WaterGoalMl;
            profile.HealthStatus = dto.HealthStatus.Trim();
            profile.Nickname = dto.Nickname.Trim();
            profile.FoodAllergies = dto.FoodAllergies.Trim();
            profile.FavoriteFoods = dto.FavoriteFoods.Trim();
            profile.DislikedFoods = dto.DislikedFoods.Trim();
            profile.NutritionConstraints = dto.NutritionConstraints.Trim();
            profile.EatingHabits = dto.EatingHabits.Trim();
            profile.WorkoutSchedule = dto.WorkoutSchedule.Trim();
            profile.SleepTime = dto.SleepTime.Trim();
            profile.WakeTime = dto.WakeTime.Trim();
            profile.MeasurementUnit = string.IsNullOrWhiteSpace(dto.MeasurementUnit) ? "metric" : dto.MeasurementUnit.Trim().ToLowerInvariant();
            profile.SpecialStatusFlag = specialFlag ?? string.Empty;
            if (dto.HeightCm > 0)
            {
                profile.Bmi = dto.WeightKg / Math.Pow(dto.HeightCm / 100, 2);
            }
        }

        private static void ApplyProfileFields(Profile profile, UpdateProfileDto dto, string? specialFlag)
        {
            profile.HeightCm = dto.HeightCm;
            profile.WeightKg = dto.WeightKg;
            profile.TargetWeightKg = dto.TargetWeightKg;
            profile.Goal = DomainValueNormalizer.NormalizeGoal(dto.Goal);
            profile.ActivityLevel = DomainValueNormalizer.NormalizeActivityLevel(dto.ActivityLevel);
            profile.DietPlan = DomainValueNormalizer.NormalizeDietPlan(dto.DietPlan);
            profile.TargetCalories = dto.TargetCalories;
            profile.TargetProtein = dto.TargetProtein;
            profile.TargetCarbs = dto.TargetCarbs;
            profile.TargetFat = dto.TargetFat;
            profile.WaterGoalMl = dto.WaterGoalMl;
            profile.HealthStatus = dto.HealthStatus.Trim();
            profile.Nickname = dto.Nickname.Trim();
            profile.FoodAllergies = dto.FoodAllergies.Trim();
            profile.FavoriteFoods = dto.FavoriteFoods.Trim();
            profile.DislikedFoods = dto.DislikedFoods.Trim();
            profile.NutritionConstraints = dto.NutritionConstraints.Trim();
            profile.EatingHabits = dto.EatingHabits.Trim();
            profile.WorkoutSchedule = dto.WorkoutSchedule.Trim();
            profile.SleepTime = dto.SleepTime.Trim();
            profile.WakeTime = dto.WakeTime.Trim();
            profile.MeasurementUnit = string.IsNullOrWhiteSpace(dto.MeasurementUnit) ? "metric" : dto.MeasurementUnit.Trim().ToLowerInvariant();
            profile.SpecialStatusFlag = specialFlag ?? string.Empty;
            if (dto.HeightCm > 0)
            {
                profile.Bmi = dto.WeightKg / Math.Pow(dto.HeightCm / 100, 2);
            }
        }

        private static DateTime? CalculateBirthDate(int age)
        {
            return age > 0
                ? DateTime.Today.AddYears(-age)
                : null;
        }
    }
}
