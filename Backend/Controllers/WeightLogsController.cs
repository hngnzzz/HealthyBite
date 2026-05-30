using Backend.Controllers.Base;
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
    public class WeightLogsController : BaseApiController
    {
        private readonly WeightLogService _weightLogService;

        public WeightLogsController(WeightLogService weightLogService)
        {
            _weightLogService = weightLogService;
        }

        [HttpGet("profile/{profileId:int}")]
        public async Task<IActionResult> GetByProfile(int profileId)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            return FromResult(await _weightLogService.GetByProfileAsync(userId.Value, profileId));
        }

        [HttpPost("profile/{profileId:int}")]
        public async Task<IActionResult> Create(int profileId, [FromBody] CreateWeightLogDto dto)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            return FromResult(await _weightLogService.CreateAsync(userId.Value, profileId, dto));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            return FromResult(await _weightLogService.DeleteAsync(userId.Value, id));
        }
    }
}
