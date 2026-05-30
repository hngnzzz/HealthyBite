using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class CreateMealLogDto
    {
        [Required]
        public int ProfileId { get; set; }

        [Required]
        [MaxLength(50)]
        public string MealType { get; set; } = string.Empty;

        public DateTime MealDate { get; set; } = DateTime.Now;

        [Required]
        [MinLength(1)]
        public List<CreateMealLogDetailDto> Items { get; set; } = new();
    }
}
