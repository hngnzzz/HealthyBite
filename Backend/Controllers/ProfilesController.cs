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
    public class ProfilesController : BaseApiController
    {
        private readonly ProfileService _profileService;

        public ProfilesController(ProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProfileDto dto)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _profileService.CreateProfileAsync(userId.Value, dto));
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            var currentUserId = User.GetUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            if (currentUserId.Value != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponseFactory.Error(AppMessages.Forbidden));
            }

            return FromResult(await _profileService.GetProfilesByUserIdAsync(currentUserId.Value));
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMine()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _profileService.GetProfilesByUserIdAsync(userId.Value));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _profileService.GetProfileByIdAsync(userId.Value, id));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProfileDto dto)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _profileService.UpdateProfileAsync(userId.Value, id, dto));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            return FromResult(await _profileService.DeleteProfileAsync(userId.Value, id));
        }
    }
}
