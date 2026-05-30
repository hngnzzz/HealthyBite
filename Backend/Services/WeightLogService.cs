using Backend.Common;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class WeightLogService
    {
        private readonly AppDbContext _context;

        public WeightLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<List<WeightLogResponseDto>>> GetByProfileAsync(int userId, int profileId)
        {
            var profile = await _context.Profiles
                .AsNoTracking()
                .FirstOrDefaultAsync(entry => entry.Id == profileId);

            if (profile == null)
            {
                return ServiceResult<List<WeightLogResponseDto>>.NotFound(AppMessages.ProfileNotFound);
            }

            if (profile.UserId != userId)
            {
                return ServiceResult<List<WeightLogResponseDto>>.Forbidden(AppMessages.Forbidden);
            }

            var logs = await _context.WeightLogs
                .AsNoTracking()
                .Where(entry => entry.ProfileId == profileId && entry.UserId == userId)
                .OrderByDescending(entry => entry.LoggedDate)
                .ThenByDescending(entry => entry.CreatedAt)
                .ThenByDescending(entry => entry.Id)
                .ToListAsync();

            return ServiceResult<List<WeightLogResponseDto>>.Ok(
                logs.Select(MapWeightLog).ToList(),
                "Weight history loaded.");
        }

        public async Task<ServiceResult<WeightLogResponseDto>> CreateAsync(int userId, int profileId, CreateWeightLogDto dto)
        {
            if (dto.WeightKg <= 0 || dto.WeightKg > 500)
            {
                return ServiceResult<WeightLogResponseDto>.BadRequest("Weight must be greater than 0 and no more than 500 kg.");
            }

            if (dto.LoggedDate.Date > DateTime.Today)
            {
                return ServiceResult<WeightLogResponseDto>.BadRequest("Logged date cannot be in the future.");
            }

            var profile = await _context.Profiles
                .FirstOrDefaultAsync(entry => entry.Id == profileId);

            if (profile == null)
            {
                return ServiceResult<WeightLogResponseDto>.NotFound(AppMessages.ProfileNotFound);
            }

            if (profile.UserId != userId)
            {
                return ServiceResult<WeightLogResponseDto>.Forbidden(AppMessages.Forbidden);
            }

            var weightLog = new WeightLog
            {
                ProfileId = profileId,
                UserId = userId,
                WeightKg = Math.Round(dto.WeightKg, 1),
                LoggedDate = dto.LoggedDate.Date,
                CreatedAt = DateTime.UtcNow,
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.WeightLogs.Add(weightLog);
                profile.WeightKg = weightLog.WeightKg;
                profile.UpdatedAt = DateTime.Now;

                if (profile.HeightCm > 0)
                {
                    profile.Bmi = weightLog.WeightKg / Math.Pow(profile.HeightCm / 100, 2);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<WeightLogResponseDto>.Ok(MapWeightLog(weightLog), "Weight logged successfully.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ServiceResult> DeleteAsync(int userId, int id)
        {
            var weightLog = await _context.WeightLogs
                .FirstOrDefaultAsync(entry => entry.Id == id);

            if (weightLog == null)
            {
                return ServiceResult.NotFound("Weight log not found.");
            }

            if (weightLog.UserId != userId)
            {
                return ServiceResult.Forbidden(AppMessages.Forbidden);
            }

            var profile = await _context.Profiles
                .FirstOrDefaultAsync(entry => entry.Id == weightLog.ProfileId);

            if (profile == null)
            {
                return ServiceResult.NotFound(AppMessages.ProfileNotFound);
            }

            if (profile.UserId != userId)
            {
                return ServiceResult.Forbidden(AppMessages.Forbidden);
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.WeightLogs.Remove(weightLog);
                await _context.SaveChangesAsync();

                var latestLog = await _context.WeightLogs
                    .Where(entry => entry.ProfileId == profile.Id && entry.UserId == userId)
                    .OrderByDescending(entry => entry.LoggedDate)
                    .ThenByDescending(entry => entry.CreatedAt)
                    .ThenByDescending(entry => entry.Id)
                    .FirstOrDefaultAsync();

                if (latestLog != null)
                {
                    profile.WeightKg = latestLog.WeightKg;
                    profile.UpdatedAt = DateTime.Now;

                    if (profile.HeightCm > 0)
                    {
                        profile.Bmi = latestLog.WeightKg / Math.Pow(profile.HeightCm / 100, 2);
                    }

                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return ServiceResult.Ok("Weight log deleted successfully.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static WeightLogResponseDto MapWeightLog(WeightLog weightLog)
        {
            return new WeightLogResponseDto
            {
                Id = weightLog.Id,
                ProfileId = weightLog.ProfileId,
                WeightKg = weightLog.WeightKg,
                LoggedDate = weightLog.LoggedDate,
                CreatedAt = weightLog.CreatedAt,
            };
        }
    }
}
