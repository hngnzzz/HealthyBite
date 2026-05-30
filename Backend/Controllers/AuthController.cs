using Backend.Controllers.Base;
using Backend.Common;
using Backend.DTOs;
using Backend.Helpers;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : BaseApiController
    {
        private readonly AuthService _authService;
        private readonly JwtSettings _jwtSettings;

        public AuthController(AuthService authService, IOptions<JwtSettings> jwtSettings)
        {
            _authService = authService;
            _jwtSettings = jwtSettings.Value;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto, GetClientIpAddress());
            SetRefreshTokenCookie(result.Data);
            return FromResult(result);
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto, GetClientIpAddress());
            SetRefreshTokenCookie(result.Data);
            return FromResult(result);
        }

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            Request.Cookies.TryGetValue(_jwtSettings.RefreshTokenCookieName, out var refreshToken);
            var result = await _authService.RefreshAsync(refreshToken, GetClientIpAddress());
            if (result.Status != ResultStatus.Ok)
            {
                ClearRefreshTokenCookie();
            }
            SetRefreshTokenCookie(result.Data);
            return FromResult(result);
        }

        [Authorize(Roles = "User")]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponseFactory.Error(AppMessages.InvalidCredentials));
            }

            Request.Cookies.TryGetValue(_jwtSettings.RefreshTokenCookieName, out var refreshToken);
            var result = await _authService.LogoutAsync(userId.Value, refreshToken, GetClientIpAddress());
            ClearRefreshTokenCookie();
            return FromResult(result);
        }

        private void SetRefreshTokenCookie(LoginResponseDto? loginResponse)
        {
            if (loginResponse == null || string.IsNullOrWhiteSpace(loginResponse.RefreshToken))
            {
                return;
            }

            Response.Cookies.Append(_jwtSettings.RefreshTokenCookieName, loginResponse.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = _jwtSettings.RefreshTokenCookieSecure,
                SameSite = SameSiteMode.Lax,
                Expires = loginResponse.RefreshTokenExpiresAt
            });
        }

        private void ClearRefreshTokenCookie()
        {
            Response.Cookies.Delete(_jwtSettings.RefreshTokenCookieName, new CookieOptions
            {
                HttpOnly = true,
                Secure = _jwtSettings.RefreshTokenCookieSecure,
                SameSite = SameSiteMode.Lax
            });
        }

        private string GetClientIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }
}
