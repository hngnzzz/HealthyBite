namespace Backend.DTOs
{
    public class MealLogDetailResponseDto
    {
        public int Id { get; set; }
        public int? FoodItemId { get; set; }
        public double Quantity { get; set; }
        public double Calories { get; set; }
        public double Protein { get; set; }
        public double Fat { get; set; }
        public double Carbs { get; set; }
        public string ItemType { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
    }
}
