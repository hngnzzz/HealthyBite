namespace Backend.DTOs
{
    public class WeightLogResponseDto
    {
        public int Id { get; set; }
        public int ProfileId { get; set; }
        public double WeightKg { get; set; }
        public DateTime LoggedDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
