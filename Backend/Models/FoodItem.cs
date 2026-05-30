using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class FoodItem
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string Name { get; set; } = string.Empty;

        public double Calories { get; set; }

        public double Protein { get; set; }

        public double Fat { get; set; }

        public double Carbs { get; set; }

        [Column("serving_size")]
        public double? ServingSizeValue { get; set; }

        [MaxLength(20)]
        [Column("serving_unit")]
        public string? ServingUnit { get; set; }

        [NotMapped]
        public string ServingSize => ServingSizeValue.HasValue
            ? $"{ServingSizeValue.Value:0.##} {ServingUnit ?? "g"}".Trim()
            : (ServingUnit ?? "g");

        [MaxLength(100)]
        public string? Category { get; set; }

        [MaxLength(50)]
        public string? Source { get; set; }

        public ICollection<MealLogDetail> MealLogDetails { get; set; } = new List<MealLogDetail>();
    }
}
