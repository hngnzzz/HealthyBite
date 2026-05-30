namespace Backend.DTOs
{
    public class JwtSettings
    {
        public const string SectionName = "Jwt";

        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = "HealthyMealIssuer";
        public string Audience { get; set; } = "HealthyMealAudience";
        public int AccessTokenExpiryMinutes { get; set; } = 15;
        public int RefreshTokenExpiryDays { get; set; } = 14;
        public string RefreshTokenCookieName { get; set; } = "hm_refresh_token";
        public bool RefreshTokenCookieSecure { get; set; }
    }
}
