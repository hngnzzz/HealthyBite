using Backend.Common;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtTokenService _jwtTokenService;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthService(AppDbContext context, JwtTokenService jwtTokenService)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<ServiceResult<LoginResponseDto>> RegisterAsync(RegisterDto dto, string ipAddress)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(user => user.Email == email);

            if (existingUser != null)
            {
                return ServiceResult<LoginResponseDto>.BadRequest(AppMessages.EmailExists);
            }

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                CreatedAt = DateTime.Now
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return ServiceResult<LoginResponseDto>.BadRequest(AppMessages.EmailExists);
            }

            return ServiceResult<LoginResponseDto>.Ok(
                await BuildLoginResponseAsync(user, ipAddress),
                AppMessages.RegisterSuccess);
        }

        public async Task<ServiceResult<LoginResponseDto>> LoginAsync(LoginDto dto, string ipAddress)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(entry => entry.Email == email);

            if (user == null)
            {
                return ServiceResult<LoginResponseDto>.Unauthorized(AppMessages.InvalidCredentials);
            }

            if (!string.Equals(user.Status, "active", StringComparison.OrdinalIgnoreCase))
            {
                return ServiceResult<LoginResponseDto>.Unauthorized(AppMessages.InvalidCredentials);
            }

            var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return ServiceResult<LoginResponseDto>.Unauthorized(AppMessages.InvalidCredentials);
            }

            return ServiceResult<LoginResponseDto>.Ok(
                await BuildLoginResponseAsync(user, ipAddress),
                AppMessages.LoginSuccess);
        }

        public async Task<ServiceResult<LoginResponseDto>> RefreshAsync(string? refreshToken, string ipAddress)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return ServiceResult<LoginResponseDto>.Unauthorized(AppMessages.InvalidRefreshToken);
            }

            var tokenHash = JwtTokenService.HashRefreshToken(refreshToken);
            var storedToken = await _context.RefreshTokens
                .Include(token => token.User)
                .FirstOrDefaultAsync(token => token.TokenHash == tokenHash);

            if (storedToken?.User == null || !storedToken.IsActive || storedToken.User.Status != "active")
            {
                return ServiceResult<LoginResponseDto>.Unauthorized(AppMessages.InvalidRefreshToken);
            }

            var nextRefreshToken = _jwtTokenService.GenerateRefreshToken();
            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.RevokedByIp = ipAddress;
            storedToken.ReplacedByTokenHash = nextRefreshToken.TokenHash;

            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = storedToken.UserId,
                TokenHash = nextRefreshToken.TokenHash,
                ExpiresAt = nextRefreshToken.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = ipAddress
            });

            await _context.SaveChangesAsync();

            var accessToken = _jwtTokenService.GenerateAccessToken(storedToken.User);
            return ServiceResult<LoginResponseDto>.Ok(new LoginResponseDto
            {
                Id = storedToken.User.Id,
                FullName = storedToken.User.FullName,
                Email = storedToken.User.Email,
                CreatedAt = storedToken.User.CreatedAt,
                AccessToken = accessToken.Token,
                AccessTokenExpiresAt = accessToken.ExpiresAt,
                RefreshToken = nextRefreshToken.Token,
                RefreshTokenExpiresAt = nextRefreshToken.ExpiresAt
            }, AppMessages.LoginSuccess);
        }

        public async Task<ServiceResult> LogoutAsync(int userId, string? refreshToken, string ipAddress)
        {
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                var tokenHash = JwtTokenService.HashRefreshToken(refreshToken);
                var storedToken = await _context.RefreshTokens
                    .FirstOrDefaultAsync(token => token.UserId == userId && token.TokenHash == tokenHash);

                if (storedToken != null && storedToken.RevokedAt == null)
                {
                    storedToken.RevokedAt = DateTime.UtcNow;
                    storedToken.RevokedByIp = ipAddress;
                    await _context.SaveChangesAsync();
                }
            }

            return ServiceResult.Ok("Logged out successfully");
        }

        private async Task<LoginResponseDto> BuildLoginResponseAsync(User user, string ipAddress)
        {
            var accessToken = _jwtTokenService.GenerateAccessToken(user);
            var refreshToken = _jwtTokenService.GenerateRefreshToken();

            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = refreshToken.TokenHash,
                ExpiresAt = refreshToken.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = ipAddress
            });
            await _context.SaveChangesAsync();

            return new LoginResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                AccessToken = accessToken.Token,
                AccessTokenExpiresAt = accessToken.ExpiresAt,
                RefreshToken = refreshToken.Token,
                RefreshTokenExpiresAt = refreshToken.ExpiresAt
            };
        }
    }
}
