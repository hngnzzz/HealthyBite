using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class MealLog
    {
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("log_date")]
        public DateTime MealDate { get; set; } = DateTime.Now;

        [Required]
        [MaxLength(50)]
        [Column("meal_type")]
        public string MealType { get; set; } = string.Empty;

        [Column("total_calories")]
        public double TotalCalories { get; set; }
        [Column("total_protein")]
        public double TotalProtein { get; set; }
        [Column("total_fat")]
        public double TotalFat { get; set; }
        [Column("total_carbs")]
        public double TotalCarbs { get; set; }

        [NotMapped]
        public int ProfileId { get; set; }

        [ForeignKey("UserId")]
        public Profile? Profile { get; set; }

        public ICollection<MealLogDetail> MealLogDetails { get; set; } = new List<MealLogDetail>();
    }
}
