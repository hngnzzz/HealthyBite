using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(128)]
        [Column("token_hash")]
        public string TokenHash { get; set; } = string.Empty;

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(64)]
        [Column("created_by_ip")]
        public string CreatedByIp { get; set; } = string.Empty;

        [Column("revoked_at")]
        public DateTime? RevokedAt { get; set; }

        [MaxLength(64)]
        [Column("revoked_by_ip")]
        public string? RevokedByIp { get; set; }

        [MaxLength(128)]
        [Column("replaced_by_token_hash")]
        public string? ReplacedByTokenHash { get; set; }

        [NotMapped]
        public bool IsActive => RevokedAt == null && ExpiresAt > DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
