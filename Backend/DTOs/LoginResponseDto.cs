namespace Backend.DTOs
{
    public class LoginResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public DateTime AccessTokenExpiresAt { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public string RefreshToken { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonIgnore]
        public DateTime RefreshTokenExpiresAt { get; set; }
    }
}
