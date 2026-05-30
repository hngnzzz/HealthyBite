using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    public partial class AddRefreshTokens : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `token_hash` VARCHAR(128) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `created_by_ip` VARCHAR(64) NOT NULL,
    `revoked_at` DATETIME(6) NULL,
    `revoked_by_ip` VARCHAR(64) NULL,
    `replaced_by_token_hash` VARCHAR(128) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `IX_refresh_tokens_token_hash` (`token_hash`),
    KEY `IX_refresh_tokens_user_id` (`user_id`),
    CONSTRAINT `FK_refresh_tokens_users_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS `refresh_tokens`;");
        }
    }
}
