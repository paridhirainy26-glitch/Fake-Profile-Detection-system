CREATE DATABASE IF NOT EXISTS fake_profile_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fake_profile_db;

CREATE TABLE IF NOT EXISTS profile_predictions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    has_profile_pic TINYINT NOT NULL,
    bio_length INT UNSIGNED NOT NULL,
    username_randomness TINYINT NOT NULL,
    followers INT UNSIGNED NOT NULL,
    following INT UNSIGNED NOT NULL,
    follower_following_ratio DECIMAL(14,6) NOT NULL,
    account_age_days INT UNSIGNED NOT NULL,
    posts INT UNSIGNED NOT NULL,
    posts_per_day DECIMAL(14,6) NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    predicted_label VARCHAR(30) NOT NULL,
    fake_probability DECIMAL(8,7) NULL,
    demo_pseudo_labels TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_predicted_label (predicted_label)
);

CREATE TABLE IF NOT EXISTS profile_reports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    prediction_id BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(120) NOT NULL,
    details TEXT NULL,
    status ENUM('pending', 'reviewing', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_prediction
      FOREIGN KEY (prediction_id) REFERENCES profile_predictions(id)
      ON DELETE CASCADE,
    INDEX idx_report_status (status)
);
USE fake_profile_db;
SHOW TABLES;

USE fake_profile_db;

CREATE TABLE profile_predictions_backup AS
SELECT * FROM profile_predictions;

USE fake_profile_db;

DESCRIBE profile_predictions;

DESCRIBE profile_reports;

SELECT COUNT(*) AS prediction_count
FROM profile_predictions;

SELECT COUNT(*) AS report_count
FROM profile_reports;

ALTER TABLE profile_predictions
    DROP COLUMN platform,
    DROP COLUMN has_profile_pic,
    DROP COLUMN bio_length,
    DROP COLUMN username_randomness,
    DROP COLUMN follower_following_ratio,
    DROP COLUMN account_age_days,
    DROP COLUMN posts_per_day,
    ADD COLUMN profile_pic TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN username_number_ratio DECIMAL(14,6) NOT NULL DEFAULT 0,
    ADD COLUMN fullname_words INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN fullname_number_ratio DECIMAL(14,6) NOT NULL DEFAULT 0,
    ADD COLUMN name_matches_username TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN description_length INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN has_external_url TINYINT NOT NULL DEFAULT 0,
    ADD COLUMN is_private TINYINT NOT NULL DEFAULT 0;
    
DESCRIBE profile_predictions;

USE fake_profile_db;

SELECT *
FROM profile_reports
ORDER BY id DESC
LIMIT 10;

SELECT *
FROM profile_predictions
ORDER BY id DESC
LIMIT 10;

USE fake_profile_db;

SELECT *
FROM profile_reports
ORDER BY id DESC;

USE fake_profile_db;
SHOW TABLES;


USE fake_profile_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Investigator', 'Supervisor', 'Admin')
        NOT NULL DEFAULT 'Investigator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;

DESCRIBE users;

ALTER TABLE profile_predictions
ADD COLUMN username VARCHAR(255) NULL,
ADD COLUMN full_name VARCHAR(255) NULL;

SELECT *
FROM profile_predictions
WHERE id = 22;

DESCRIBE profile_predictions;

ALTER TABLE profile_predictions
ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Open';

SELECT id, username, status
FROM profile_predictions
ORDER BY id DESC;