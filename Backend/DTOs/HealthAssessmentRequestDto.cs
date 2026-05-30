using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class HealthAssessmentRequestDto
    {
        [Required]
        [MaxLength(10)]
        public string Gender { get; set; } = string.Empty;

        [Range(0, 18)]
        public int AgeYears { get; set; }

        [Range(0, 11)]
        public int? AgeMonths { get; set; }

        [Range(1, 300)]
        public double HeightCm { get; set; }

        [Range(0.1, 500)]
        public double WeightKg { get; set; }
    }
}
