namespace Backend.DTOs
{
    public class FatSecretOptions
    {
        public const string SectionName = "FatSecret";

        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string ApiBaseUrl { get; set; } = "https://platform.fatsecret.com/rest/server.api";
        public string TokenUrl { get; set; } = "https://oauth.fatsecret.com/connect/token";
        public string Scope { get; set; } = "basic";
        public bool EnableImages { get; set; }
        public string Locale { get; set; } = "vi_VN";
    }
}
