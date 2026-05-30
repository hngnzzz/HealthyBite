using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class MealLogDetail
    {
        public int Id { get; set; }

        [Required]
        [Column("meal_log_id")]
        public int MealLogId { get; set; }

        [Column("food_id")]
        public int? FoodItemId { get; set; }

        public double Quantity { get; set; }

        public double Calories { get; set; }

        public double Protein { get; set; }

        public double Fat { get; set; }

        public double Carbs { get; set; }

        [MaxLength(20)]
        [Column("item_type")]
        public string ItemType { get; set; } = "food";

        [Required]
        [MaxLength(255)]
        [Column("item_name")]
        public string ItemName { get; set; } = string.Empty;

        [ForeignKey("MealLogId")]
        public MealLog? MealLog { get; set; }

        [ForeignKey("FoodItemId")]
        public FoodItem? FoodItem { get; set; }
    }
}
