using Backend.Controllers.Base;
using Backend.Common;
using Backend.DTOs;
using Backend.Helpers;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User")]
    public class MealLogsController : BaseApiController
    {
        private readonly MealLogService _mealLogService;

        public MealLogsController(MealLogService mealLogService)
        {
            _mealLogService = mealLogService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMealLogDto dto)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _mealLogService.CreateMealLogAsync(userId.Value, dto));
        }

        [HttpGet("profile/{profileId}")]
        public async Task<IActionResult> GetByProfileId(int profileId)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _mealLogService.GetMealLogsByProfileIdAsync(userId.Value, profileId));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _mealLogService.GetMealLogByIdAsync(userId.Value, id));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMealLogDto dto)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _mealLogService.UpdateMealLogAsync(userId.Value, id, dto));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _mealLogService.DeleteMealLogAsync(userId.Value, id));
        }
    }
}
