-- Local MariaDB/MySQL setup for HealthyMeal.
-- Replace YOUR_LOCAL_DB_PASSWORD before running this script.

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

FLUSH PRIVILEGES;
