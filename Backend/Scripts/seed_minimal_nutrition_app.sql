USE `healthymeal`;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `meal_log_items`;
DELETE FROM `meal_logs`;
DELETE FROM `health_profiles`;
DELETE FROM `foods`;
DELETE FROM `users`;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `users` (
    `id`,
    `full_name`,
    `email`,
    `password_hash`,
    `gender`,
    `birth_date`,
    `status`,
    `created_at`,
    `updated_at`
) VALUES (
    1,
    'Seed User',
    'seed.user@healthymeal.local',
    'AQAAAAIAAYagAAAAEEjGzYVw6oBvNw8V6k6k65Lk4b0hPqj3aA0m9n9V5k7mQ1xkY2p4l8v3t4q2dA==',
    'male',
    '2001-01-01',
    'active',
    NOW(),
    NOW()
);

INSERT INTO `health_profiles` (
    `id`,
    `user_id`,
    `height_cm`,
    `weight_kg`,
    `target_weight_kg`,
    `goal`,
    `activity_level`,
    `target_calories`
) VALUES (
    1,
    1,
    170,
    65,
    63,
    'maintain',
    'moderate',
    2200
);

INSERT INTO `foods` (
    `id`,
    `source`,
    `name`,
    `category`,
    `calories`,
    `protein`,
    `fat`,
    `carbs`,
    `serving_size`,
    `serving_unit`
) VALUES
(
    1,
    'local',
    'Com trang',
    'Tinh bot',
    130,
    2.4,
    0.3,
    28.2,
    100,
    'g'
),
(
    2,
    'local',
    'Uc ga luoc',
    'Protein',
    165,
    31,
    3.6,
    0,
    100,
    'g'
),
(
    3,
    'local',
    'Trung ga',
    'Protein',
    155,
    13,
    11,
    1.1,
    100,
    'g'
);
