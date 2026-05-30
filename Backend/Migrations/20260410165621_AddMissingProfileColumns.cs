using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingProfileColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
                        // Add missing profile-related columns only if they do not already exist.
                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=0, 'ALTER TABLE `health_profiles` ADD COLUMN `bmi` DOUBLE NULL', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'bmi');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=0, 'ALTER TABLE `health_profiles` ADD COLUMN `special_status_flag` VARCHAR(100) NULL', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'special_status_flag');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=0, 'ALTER TABLE `health_profiles` ADD COLUMN `target_calories` INT NULL', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'target_calories');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=0, 'ALTER TABLE `health_profiles` ADD COLUMN `target_weight_kg` DOUBLE NULL', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'target_weight_kg');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=0, 'ALTER TABLE `health_profiles` ADD COLUMN `goal` VARCHAR(50) NULL', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'goal');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=0, 'ALTER TABLE `health_profiles` ADD COLUMN `activity_level` VARCHAR(50) NULL', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'activity_level');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
                        // Remove columns if they exist (rollback safe).
                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=1, 'ALTER TABLE `health_profiles` DROP COLUMN `bmi`', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'bmi');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=1, 'ALTER TABLE `health_profiles` DROP COLUMN `special_status_flag`', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'special_status_flag');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=1, 'ALTER TABLE `health_profiles` DROP COLUMN `target_calories`', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'target_calories');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=1, 'ALTER TABLE `health_profiles` DROP COLUMN `target_weight_kg`', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'target_weight_kg');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=1, 'ALTER TABLE `health_profiles` DROP COLUMN `goal`', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'goal');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");

                        migrationBuilder.Sql(@"
SET @s = (SELECT IF(COUNT(*)=1, 'ALTER TABLE `health_profiles` DROP COLUMN `activity_level`', 'SELECT 1')
    FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'health_profiles' AND COLUMN_NAME = 'activity_level');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
");
        }
    }
}
