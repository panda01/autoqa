
-- This needs to be tested!!! Stolen from a MySQL export




SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";



CREATE TABLE `screenshots` (
	`ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` text COLLATE utf8mb4_unicode_ci NOT NULL,
	`file_path` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDV DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `comparisons` (
	`ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` text COLLATE utf8mb4_unicode_ci NOT NULL,
	`screenshot1_id` bigint(20) UNSIGNED NOT NULL,
	`screenshot2_id` bigint(20) UNSIGNED NOT NULL,
	`file_path` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
	`threshold_path` datetime DEFAULT CURRENT_TIMESTAMP,
	`contours_path` datetime DEFAULT CURRENT_TIMESTAMP,
	`diff_path` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDV DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `screenshots` (
	ADD PRIMARY KEY(`ID`)
)

ALTER TABLE `comparisons` (
	ADD PRIMARY KEY(`ID`),
	ADD KEY `screenshot1_id` (`screenshot1_id`),
	ADD KEY `screenshot2_id` (`screenshot2_id`);
)
