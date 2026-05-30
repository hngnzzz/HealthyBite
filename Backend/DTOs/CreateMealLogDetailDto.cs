using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class CreateMealLogDetailDto
    {
        public int? FoodItemId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public double Quantity { get; set; }

        [MaxLength(255)]
        public string? ItemName { get; set; }

        [MaxLength(20)]
        public string? ItemType { get; set; }

        [Range(0, double.MaxValue)]
        public double? Calories { get; set; }

        [Range(0, double.MaxValue)]
        public double? Protein { get; set; }

        [Range(0, double.MaxValue)]
        public double? Fat { get; set; }

        [Range(0, double.MaxValue)]
        public double? Carbs { get; set; }
    }
}
