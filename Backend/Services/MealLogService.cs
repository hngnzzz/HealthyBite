using Backend.Common;
using Backend.Data;
using Backend.DTOs;
using Backend.Helpers;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class MealLogService
    {
        private readonly AppDbContext _context;

        public MealLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<MealLogResponseDto>> CreateMealLogAsync(int userId, CreateMealLogDto dto)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(entry => entry.Id == dto.ProfileId);
            if (profile == null)
            {
                return ServiceResult<MealLogResponseDto>.BadRequest(AppMessages.ProfileDoesNotExist);
            }

            if (profile.UserId != userId)
            {
                return ServiceResult<MealLogResponseDto>.Forbidden(AppMessages.Forbidden);
            }

            var foodIds = dto.Items
                .Where(item => item.FoodItemId.HasValue)
                .Select(item => item.FoodItemId!.Value)
                .Distinct()
                .ToList();

            var foods = await _context.FoodItems
                .Where(food => foodIds.Contains(food.Id))
                .ToDictionaryAsync(food => food.Id);

            var invalidFoodIds = foodIds
                .Where(id => !foods.ContainsKey(id))
                .ToList();

            if (invalidFoodIds.Count > 0)
            {
                return ServiceResult<MealLogResponseDto>.BadRequest(
                    AppMessages.FoodItemsNotFound(invalidFoodIds));
            }

            var invalidManualItems = dto.Items
                .Where(item => !item.FoodItemId.HasValue && string.IsNullOrWhiteSpace(item.ItemName))
                .ToList();

            if (invalidManualItems.Count > 0)
            {
                return ServiceResult<MealLogResponseDto>.BadRequest("Meal log items imported from USDA must include itemName.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var mealLog = new MealLog
                {
                    UserId = profile.UserId,
                    MealType = DomainValueNormalizer.NormalizeMealType(dto.MealType),
                    MealDate = dto.MealDate.Date
                };

                _context.MealLogs.Add(mealLog);
                await _context.SaveChangesAsync();

                var createdDetails = dto.Items
                    .Select(item => CreateMealLogDetail(mealLog.Id, item, foods))
                    .ToList();

                var totals = CalculateTotals(createdDetails);

                await _context.MealLogDetails.AddRangeAsync(createdDetails);

                mealLog.TotalCalories = totals.Calories;
                mealLog.TotalProtein = totals.Protein;
                mealLog.TotalFat = totals.Fat;
                mealLog.TotalCarbs = totals.Carbs;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<MealLogResponseDto>.Ok(
                    MapMealLog(mealLog, createdDetails, profile.Id),
                    AppMessages.CreateMealLogSuccess);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ServiceResult<List<MealLogResponseDto>>> GetMealLogsByProfileIdAsync(int userId, int profileId)
        {
            var profile = await _context.Profiles
                .AsNoTracking()
                .FirstOrDefaultAsync(entry => entry.Id == profileId);

            if (profile == null)
            {
                return ServiceResult<List<MealLogResponseDto>>.NotFound(AppMessages.ProfileNotFound);
            }

            if (profile.UserId != userId)
            {
                return ServiceResult<List<MealLogResponseDto>>.Forbidden(AppMessages.Forbidden);
            }

            var mealLogs = await _context.MealLogs
                .AsNoTracking()
                .Include(mealLog => mealLog.Profile)
                .Include(mealLog => mealLog.MealLogDetails)
                .Where(mealLog => mealLog.UserId == profile.UserId)
                .OrderByDescending(mealLog => mealLog.MealDate)
                .ToListAsync();

            return ServiceResult<List<MealLogResponseDto>>.Ok(
                mealLogs.Select(mealLog => MapMealLog(mealLog)).ToList(),
                AppMessages.GetMealLogsSuccess);
        }

        public async Task<ServiceResult<MealLogResponseDto>> GetMealLogByIdAsync(int userId, int id)
        {
            var mealLog = await _context.MealLogs
                .AsNoTracking()
                .Include(entry => entry.Profile)
                .Include(entry => entry.MealLogDetails)
                .FirstOrDefaultAsync(entry => entry.Id == id);

            return mealLog == null
                ? ServiceResult<MealLogResponseDto>.NotFound(AppMessages.MealLogNotFound)
                : mealLog.UserId != userId
                    ? ServiceResult<MealLogResponseDto>.Forbidden(AppMessages.Forbidden)
                    : ServiceResult<MealLogResponseDto>.Ok(MapMealLog(mealLog), AppMessages.GetMealLogSuccess);
        }

        public async Task<ServiceResult<MealLogResponseDto>> UpdateMealLogAsync(int userId, int id, UpdateMealLogDto dto)
        {
            var mealLog = await _context.MealLogs
                .Include(entry => entry.MealLogDetails)
                .FirstOrDefaultAsync(entry => entry.Id == id);

            if (mealLog == null)
            {
                return ServiceResult<MealLogResponseDto>.NotFound(AppMessages.MealLogNotFound);
            }

            if (mealLog.UserId != userId)
            {
                return ServiceResult<MealLogResponseDto>.Forbidden(AppMessages.Forbidden);
            }

            var foodIds = dto.Items
                .Where(item => item.FoodItemId.HasValue)
                .Select(item => item.FoodItemId!.Value)
                .Distinct()
                .ToList();

            var foods = await _context.FoodItems
                .Where(food => foodIds.Contains(food.Id))
                .ToDictionaryAsync(food => food.Id);

            var invalidFoodIds = foodIds
                .Where(idValue => !foods.ContainsKey(idValue))
                .ToList();

            if (invalidFoodIds.Count > 0)
            {
                return ServiceResult<MealLogResponseDto>.BadRequest(AppMessages.FoodItemsNotFound(invalidFoodIds));
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.MealLogDetails.RemoveRange(mealLog.MealLogDetails);
                await _context.SaveChangesAsync();

                mealLog.MealType = DomainValueNormalizer.NormalizeMealType(dto.MealType);
                mealLog.MealDate = dto.MealDate.Date;

                var updatedDetails = dto.Items
                    .Select(item => CreateMealLogDetail(mealLog.Id, item, foods))
                    .ToList();

                var totals = CalculateTotals(updatedDetails);

                await _context.MealLogDetails.AddRangeAsync(updatedDetails);

                mealLog.TotalCalories = totals.Calories;
                mealLog.TotalProtein = totals.Protein;
                mealLog.TotalFat = totals.Fat;
                mealLog.TotalCarbs = totals.Carbs;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<MealLogResponseDto>.Ok(
                    MapMealLog(mealLog, updatedDetails),
                    AppMessages.UpdateMealLogSuccess);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ServiceResult> DeleteMealLogAsync(int userId, int id)
        {
            var mealLog = await _context.MealLogs
                .Include(entry => entry.MealLogDetails)
                .FirstOrDefaultAsync(entry => entry.Id == id);

            if (mealLog == null)
            {
                return ServiceResult.NotFound(AppMessages.MealLogNotFound);
            }

            if (mealLog.UserId != userId)
            {
                return ServiceResult.Forbidden(AppMessages.Forbidden);
            }

            _context.MealLogDetails.RemoveRange(mealLog.MealLogDetails);
            _context.MealLogs.Remove(mealLog);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(AppMessages.DeleteMealLogSuccess);
        }

        private static MealLogResponseDto MapMealLog(
            MealLog mealLog,
            IEnumerable<MealLogDetail>? details = null,
            int? profileId = null)
        {
            var mealLogDetails = details?.ToList() ?? mealLog.MealLogDetails.ToList();
            var totals = CalculateTotals(mealLogDetails);

            return new MealLogResponseDto
            {
                Id = mealLog.Id,
                ProfileId = profileId ?? mealLog.Profile?.Id ?? 0,
                MealType = mealLog.MealType,
                MealDate = mealLog.MealDate,
                TotalCalories = mealLog.TotalCalories > 0 ? mealLog.TotalCalories : totals.Calories,
                TotalProtein = mealLog.TotalProtein > 0 ? mealLog.TotalProtein : totals.Protein,
                TotalFat = mealLog.TotalFat > 0 ? mealLog.TotalFat : totals.Fat,
                TotalCarbs = mealLog.TotalCarbs > 0 ? mealLog.TotalCarbs : totals.Carbs,
                Items = mealLogDetails.Select(MapDetail).ToList()
            };
        }

        private static MealLogDetail CreateMealLogDetail(
            int mealLogId,
            CreateMealLogDetailDto item,
            IReadOnlyDictionary<int, FoodItem> foods)
        {
            if (item.FoodItemId.HasValue)
            {
                var food = foods[item.FoodItemId.Value];

                return new MealLogDetail
                {
                    MealLogId = mealLogId,
                    FoodItemId = food.Id,
                    Quantity = item.Quantity,
                    ItemType = "food",
                    ItemName = food.Name,
                    Calories = food.Calories * item.Quantity,
                    Protein = food.Protein * item.Quantity,
                    Fat = food.Fat * item.Quantity,
                    Carbs = food.Carbs * item.Quantity
                };
            }

            return CreateManualMealLogDetail(mealLogId, item);
        }

        private static MealLogDetail CreateManualMealLogDetail(int mealLogId, CreateMealLogDetailDto item)
        {
            if (string.IsNullOrWhiteSpace(item.ItemName))
            {
                throw new InvalidOperationException("Manual meal log items must include item_name.");
            }

            return new MealLogDetail
            {
                MealLogId = mealLogId,
                FoodItemId = null,
                Quantity = item.Quantity,
                ItemType = string.IsNullOrWhiteSpace(item.ItemType) ? "food" : item.ItemType.Trim(),
                ItemName = item.ItemName.Trim(),
                Calories = item.Calories ?? 0,
                Protein = item.Protein ?? 0,
                Fat = item.Fat ?? 0,
                Carbs = item.Carbs ?? 0
            };
        }

        private static (double Calories, double Protein, double Fat, double Carbs) CalculateTotals(IEnumerable<MealLogDetail> details)
        {
            return (
                details.Sum(detail => detail.Calories),
                details.Sum(detail => detail.Protein),
                details.Sum(detail => detail.Fat),
                details.Sum(detail => detail.Carbs));
        }

        private static MealLogDetailResponseDto MapDetail(MealLogDetail detail)
        {
            return new MealLogDetailResponseDto
            {
                Id = detail.Id,
                FoodItemId = detail.FoodItemId,
                Quantity = detail.Quantity,
                Calories = detail.Calories,
                Protein = detail.Protein,
                Fat = detail.Fat,
                Carbs = detail.Carbs,
                ItemType = detail.ItemType,
                ItemName = detail.ItemName
            };
        }
    }
}
