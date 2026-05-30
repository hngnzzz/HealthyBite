using Backend.Controllers.Base;
using Backend.Common;
using Backend.Helpers;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User")]
    public class DashboardController : BaseApiController
    {
        private readonly DashboardService _dashboardService;

        public DashboardController(DashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetToday([FromQuery] int userId, [FromQuery] int? profileId, [FromQuery] DateTime? date)
        {
            var currentUserId = User.GetUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            if (userId != 0 && userId != currentUserId.Value)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponseFactory.Error(AppMessages.Forbidden));
            }

            return FromResult(await _dashboardService.GetTodayAsync(currentUserId.Value, profileId, date));
        }
    }
}
