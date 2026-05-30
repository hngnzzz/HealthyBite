using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class WeightLog
    {
        public int Id { get; set; }

        [Required]
        [Column("profile_id")]
        public int ProfileId { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Column("weight_kg")]
        public double WeightKg { get; set; }

        [Column("logged_date")]
        public DateTime LoggedDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProfileId")]
        public Profile? Profile { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
