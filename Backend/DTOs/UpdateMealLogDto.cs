using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class UpdateMealLogDto
    {
        [Required]
        [MaxLength(50)]
        public string MealType { get; set; } = string.Empty;

        public DateTime MealDate { get; set; } = DateTime.Now;

        [Required]
        [MinLength(1)]
        public List<CreateMealLogDetailDto> Items { get; set; } = new();
    }
}
