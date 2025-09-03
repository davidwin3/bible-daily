-- 기본 테이블 구조 생성 스크립트
-- TypeORM 엔티티 기반으로 필수 테이블만 먼저 생성

-- =============================================================================
-- Users 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `firebaseUid` varchar(255) NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `profileImage` varchar(500) NULL,
  `role` enum('student','teacher','admin') NOT NULL DEFAULT 'student',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `lastLoginAt` datetime NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  INDEX `idx_users_is_active` (`isActive`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_last_login_at` (`lastLoginAt`),
  INDEX `idx_users_active_users` (`isActive`, `role`),
  INDEX `idx_users_recent_login` (`isActive`, `lastLoginAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Posts 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `posts` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `title` varchar(200) NOT NULL,
  `content` varchar(1000) NOT NULL,
  `bibleVerse` varchar(200) NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime NULL,
  `authorId` varchar(36) NOT NULL,
  
  INDEX `idx_posts_is_deleted` (`isDeleted`),
  INDEX `idx_posts_created_at` (`createdAt`),
  INDEX `idx_posts_author_id` (`authorId`),
  INDEX `idx_posts_active_posts` (`isDeleted`, `createdAt`),
  INDEX `idx_posts_search_title` (`title`),
  
  FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Missions 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `missions` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `date` date NOT NULL UNIQUE,
  `title` varchar(200) NULL,
  `description` text NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  INDEX `idx_missions_is_active` (`isActive`),
  INDEX `idx_missions_active_missions` (`isActive`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Mission_Scriptures 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `mission_scriptures` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `missionId` varchar(36) NOT NULL,
  `startBook` varchar(50) NOT NULL,
  `startChapter` int NOT NULL,
  `startVerse` int NULL,
  `endBook` varchar(50) NULL,
  `endChapter` int NULL,
  `endVerse` int NULL,
  `order` int NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  INDEX `idx_mission_scriptures_mission_id` (`missionId`),
  INDEX `idx_mission_scriptures_order` (`missionId`, `order`),
  INDEX `idx_mission_scriptures_book` (`startBook`),
  
  FOREIGN KEY (`missionId`) REFERENCES `missions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- User_Missions 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `user_missions` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL,
  `missionId` varchar(36) NOT NULL,
  `isCompleted` tinyint(1) NOT NULL DEFAULT 0,
  `completedAt` datetime NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  UNIQUE KEY `unique_user_mission` (`userId`, `missionId`),
  INDEX `idx_user_missions_user_id` (`userId`),
  INDEX `idx_user_missions_mission_id` (`missionId`),
  INDEX `idx_user_missions_is_completed` (`isCompleted`),
  INDEX `idx_user_missions_created_at` (`createdAt`),
  INDEX `idx_user_missions_user_completed` (`userId`, `isCompleted`),
  INDEX `idx_user_missions_mission_completed` (`missionId`, `isCompleted`),
  INDEX `idx_user_missions_recent_activity` (`userId`, `createdAt`),
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`missionId`) REFERENCES `missions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Likes 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `likes` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL,
  `postId` varchar(36) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  
  UNIQUE KEY `unique_user_post_like` (`userId`, `postId`),
  INDEX `idx_likes_post_id` (`postId`),
  INDEX `idx_likes_user_id` (`userId`),
  INDEX `idx_likes_created_at` (`createdAt`),
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Cells 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `cells` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `description` text NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `leaderId` varchar(36) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  INDEX `idx_cells_is_active` (`isActive`),
  INDEX `idx_cells_leader_id` (`leaderId`),
  INDEX `idx_cells_active_cells` (`isActive`, `leaderId`),
  
  FOREIGN KEY (`leaderId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Cell_Members 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `cell_members` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL,
  `cellId` varchar(36) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `joinedAt` datetime NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  UNIQUE KEY `unique_user_cell` (`userId`, `cellId`),
  INDEX `idx_cell_members_user_id` (`userId`),
  INDEX `idx_cell_members_cell_id` (`cellId`),
  INDEX `idx_cell_members_is_active` (`isActive`),
  INDEX `idx_cell_members_user_active` (`userId`, `isActive`),
  INDEX `idx_cell_members_cell_active` (`cellId`, `isActive`),
  INDEX `idx_cell_members_joined_at` (`joinedAt`),
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cellId`) REFERENCES `cells`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Refresh_Tokens 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `userId` varchar(36) NOT NULL,
  `token` varchar(500) NOT NULL UNIQUE,
  `expiresAt` datetime NOT NULL,
  `isRevoked` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  INDEX `idx_refresh_tokens_token` (`token`),
  INDEX `idx_refresh_tokens_expires_at` (`expiresAt`),
  INDEX `idx_refresh_tokens_is_revoked` (`isRevoked`),
  INDEX `idx_refresh_tokens_valid_tokens` (`userId`, `isRevoked`, `expiresAt`),
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 스키마 생성 완료 확인
-- =============================================================================
SELECT 'Basic schema created successfully' as message, NOW() as timestamp;
