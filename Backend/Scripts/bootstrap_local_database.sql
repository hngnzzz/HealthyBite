-- Full local bootstrap for HealthyMeal.
-- Replace YOUR_LOCAL_DB_PASSWORD before running.

CREATE DATABASE IF NOT EXISTS `healthymeal`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'healthymeal'@'localhost'
  IDENTIFIED BY 'YOUR_LOCAL_DB_PASSWORD';

CREATE USER IF NOT EXISTS 'healthymeal'@'127.0.0.1'
  IDENTIFIED BY 'YOUR_LOCAL_DB_PASSWORD';

ALTER USER 'healthymeal'@'localhost'
  IDENTIFIED BY 'YOUR_LOCAL_DB_PASSWORD';

ALTER USER 'healthymeal'@'127.0.0.1'
  IDENTIFIED BY 'YOUR_LOCAL_DB_PASSWORD';

GRANT ALL PRIVILEGES ON `healthymeal`.* TO 'healthymeal'@'localhost';
GRANT ALL PRIVILEGES ON `healthymeal`.* TO 'healthymeal'@'127.0.0.1';

USE `healthymeal`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` LONGTEXT NOT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `birth_date` DATETIME(6) NULL,
  `status` VARCHAR(20) NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  `updated_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `health_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `height_cm` DOUBLE NOT NULL,
  `weight_kg` DOUBLE NOT NULL,
  `target_weight_kg` DOUBLE NULL,
  `goal` VARCHAR(50) NULL,
  `activity_level` VARCHAR(50) NULL,
  `diet_plan` VARCHAR(50) NULL,
  `target_calories` INT NULL,
  `target_protein` DOUBLE NULL,
  `target_fat` DOUBLE NULL,
  `target_carbs` DOUBLE NULL,
  `water_goal_ml` INT NULL,
  `health_status` VARCHAR(150) NULL,
  `nickname` VARCHAR(100) NULL,
  `food_allergies` VARCHAR(500) NULL,
  `favorite_foods` VARCHAR(500) NULL,
  `disliked_foods` VARCHAR(500) NULL,
  `nutrition_constraints` VARCHAR(500) NULL,
  `eating_habits` VARCHAR(500) NULL,
  `workout_schedule` VARCHAR(500) NULL,
  `sleep_time` VARCHAR(10) NULL,
  `wake_time` VARCHAR(10) NULL,
  `measurement_unit` VARCHAR(20) NULL,
  `bmi` DOUBLE NULL,
  `special_status_flag` VARCHAR(100) NULL,
  `created_at` DATETIME(6) NULL,
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AK_health_profiles_user_id` (`user_id`),
  CONSTRAINT `FK_health_profiles_users_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `foods` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(300) NOT NULL,
  `calories` DOUBLE NOT NULL,
  `protein` DOUBLE NOT NULL,
  `fat` DOUBLE NOT NULL,
  `carbs` DOUBLE NOT NULL,
  `serving_size` DOUBLE NULL,
  `serving_unit` VARCHAR(20) NULL,
  `category` VARCHAR(100) NULL,
  `source` VARCHAR(50) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meal_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `log_date` DATETIME(6) NOT NULL,
  `meal_type` VARCHAR(50) NOT NULL,
  `total_calories` DOUBLE NOT NULL,
  `total_protein` DOUBLE NOT NULL,
  `total_fat` DOUBLE NOT NULL,
  `total_carbs` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_meal_logs_user_id` (`user_id`),
  CONSTRAINT `FK_meal_logs_health_profiles_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `health_profiles` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meal_log_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `meal_log_id` INT NOT NULL,
  `food_id` INT NULL,
  `quantity` DOUBLE NOT NULL,
  `calories` DOUBLE NOT NULL,
  `protein` DOUBLE NOT NULL,
  `fat` DOUBLE NOT NULL,
  `carbs` DOUBLE NOT NULL,
  `item_type` VARCHAR(20) NOT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_meal_log_items_meal_log_id` (`meal_log_id`),
  KEY `IX_meal_log_items_food_id` (`food_id`),
  CONSTRAINT `FK_meal_log_items_meal_logs_meal_log_id`
    FOREIGN KEY (`meal_log_id`) REFERENCES `meal_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_meal_log_items_foods_food_id`
    FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

FLUSH PRIVILEGES;
