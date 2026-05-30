namespace Backend.DTOs
{
    public class UsdaFoodItemResponseDto
    {
        public int FdcId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public double Calories { get; set; }
        public double Protein { get; set; }
        public double Fat { get; set; }
        public double Carbs { get; set; }
        public string ServingSize { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Source { get; set; } = "USDA";
        public string ImageUrl { get; set; } = string.Empty;
        public string FatSecretFoodId { get; set; } = string.Empty;
        public string MatchedKeyword { get; set; } = string.Empty;
        public string SearchSource { get; set; } = "USDA";
    }
}
