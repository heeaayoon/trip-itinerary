-- 데이터베이스 엔진 및 문자셋 설정
SET default_storage_engine=InnoDB;
SET NAMES utf8mb4;

-- 기존 테이블이 있다면 모두 삭제
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `cities`, `trip_preferences`, `trip_tips`, `trip_notes`, `schedule_feedbacks`, `schedules`, `days`, `trip_participants`, `trips`, `users`;
SET FOREIGN_key_checks = 1;

-- =================================================================
-- 1. users 테이블 (소문자 테이블명, BINARY(16) ID)
-- =================================================================
CREATE TABLE `users` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `name` VARCHAR(255),
    `password` VARCHAR(255),
    `avatar_url` TEXT,
    `role` VARCHAR(50) DEFAULT 'USER',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT '사용자 정보 테이블';

-- =================================================================
-- 2. trips 테이블 (소문자 테이블명, BINARY(16) ID)
-- =================================================================
CREATE TABLE `trips` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `title` VARCHAR(255) NOT NULL,
    `start_date` DATE,
    `end_date` DATE,
    `theme` VARCHAR(255),
    `location` VARCHAR(255),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `country` VARCHAR(255),
    `admin_name` VARCHAR(255),
    `status` VARCHAR(50) DEFAULT 'PLANNED',
    `created_by` BINARY(16) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '여행 기본 정보 테이블';

-- =================================================================
-- 3. trip_participants (다대다 관계 테이블 - 로직 유지)
-- =================================================================
CREATE TABLE `trip_participants` (
    `trip_id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'MEMBER',
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`trip_id`, `user_id`),
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '여행 참여자 정보 (Trips-Users Many-to-Many)';

-- =================================================================
-- 4. days 테이블
-- =================================================================
CREATE TABLE `days` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `trip_id` BINARY(16) NOT NULL,
    `day_number` INT,
    `date` DATE,
    `day_theme` VARCHAR(255),
    `weather_forecast` TEXT,
    `weather_temp` DECIMAL(5, 2),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE
) COMMENT '여행의 각 날짜별 정보';

-- =================================================================
-- 5. schedules 테이블 (수정된 버전)
-- =================================================================
CREATE TABLE `schedules` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `day_id` BINARY(16) NOT NULL,
    
    -- [수정] VARCHAR -> TIME 타입으로 변경
    `time` TIME NULL, 
    `time_end` TIME NULL,
    
    `activity` VARCHAR(255),
    `description` TEXT,
    `tips` TEXT,
    `icon` VARCHAR(255),
    `lat` DECIMAL(10, 8),
    `lng` DECIMAL(11, 8),
    `category` VARCHAR(100),
    `status` ENUM('PLANNED', 'COMPLETED', 'CANCELED', 'SKIPPED') DEFAULT 'PLANNED',
    `is_ai_generated` BOOLEAN DEFAULT FALSE,
    `is_fixed` BOOLEAN DEFAULT FALSE,
    `original_schedule_id` BINARY(16),
    `display_order` INT DEFAULT 0,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`original_schedule_id`) REFERENCES `schedules`(`id`) ON DELETE SET NULL
) COMMENT '날짜별 세부 일정';

-- =================================================================
-- 6. schedule_feedbacks 테이블
-- =================================================================
CREATE TABLE `schedule_feedbacks` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `schedule_id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `satisfaction_score` SMALLINT,
    `mood_status` VARCHAR(100),
    `crowd_level` VARCHAR(100),
    `comment` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '일정별 사용자 피드백';

-- =================================================================
-- 7. trip_notes 테이블
-- =================================================================
CREATE TABLE `trip_notes` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `trip_id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `title` VARCHAR(255) DEFAULT '새 메모',
    `content` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '여행 관련 메모';

-- =================================================================
-- 8. trip_tips 테이블
-- =================================================================
CREATE TABLE `trip_tips` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `trip_id` BINARY(16) NOT NULL,
    `user_id` BINARY(16) NOT NULL,
    `text` TEXT,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) COMMENT '여행 관련 팁';

-- =================================================================
-- 9. trip_preferences 테이블 (JSON 타입 유지)
-- =================================================================
CREATE TABLE `trip_preferences` (
    `id` BINARY(16) NOT NULL DEFAULT (UUID_TO_BIN(UUID())),
    `trip_id` BINARY(16) NOT NULL UNIQUE,
    `travel_style` VARCHAR(255),
    `pace_preference` VARCHAR(255),
    `accommodation_type` VARCHAR(255),
    `companion_type` VARCHAR(255),
    `budget_level` VARCHAR(255),
    `interests` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `flight_out_dept` TEXT,
    `flight_out_arr` TEXT,
    `flight_in_dept` TEXT,
    `flight_in_arr` TEXT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE
) COMMENT '여행 선호도 설정';

-- =================================================================
-- 10. cities 테이블
-- =================================================================
CREATE TABLE `cities` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `city` VARCHAR(255),
    `city_ascii` VARCHAR(255),
    `lat` DECIMAL(10, 8),
    `lng` DECIMAL(11, 8),
    `country` VARCHAR(255),
    `iso2` VARCHAR(10),
    `iso3` VARCHAR(10),
    `admin_name` VARCHAR(255),
    `capital` VARCHAR(255),
    `population` BIGINT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT '도시 정보';