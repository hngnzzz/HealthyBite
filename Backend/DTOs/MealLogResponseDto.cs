namespace Backend.DTOs
{
    public class MealLogResponseDto
    {
        public int Id { get; set; }
        public int ProfileId { get; set; }
        public string MealType { get; set; } = string.Empty;
        public DateTime MealDate { get; set; }
        public double TotalCalories { get; set; }
        public double TotalProtein { get; set; }
        public double TotalFat { get; set; }
        public double TotalCarbs { get; set; }
        public List<MealLogDetailResponseDto> Items { get; set; } = new();
    }
}
