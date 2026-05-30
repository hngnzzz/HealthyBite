using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class CreateWeightLogDto
    {
        [Range(0.01, 500)]
        public double WeightKg { get; set; }

        [Required]
        public DateTime LoggedDate { get; set; }
    }
}
