namespace Backend.DTOs
{
    public class UsdaOptions
    {
        public const string SectionName = "Usda";

        public string ApiKey { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = "https://api.nal.usda.gov/fdc/v1/";
    }
}
