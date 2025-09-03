-- 외래 키 제약조건 문제 해결을 위한 안전한 마이그레이션 스크립트
-- 실행 날짜: ${new Date().toISOString().split('T')[0]}

-- =============================================================================
-- 현재 문제 상황 분석
-- =============================================================================
-- 1. refresh_tokens 테이블의 userId 컬럼 타입이 string으로 변경됨
-- 2. 기존 인덱스가 외래키 제약조건과 연결되어 삭제가 불가능
-- 3. TypeORM이 인덱스를 삭제하려고 시도하지만 실패함

-- =============================================================================
-- 안전한 해결 방법: 외래 키 제약조건을 먼저 삭제하고 재생성
-- =============================================================================

-- 1. 현재 외래 키 제약조건 확인
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'refresh_tokens' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 2. refresh_tokens 테이블의 외래 키 제약조건 임시 삭제
SET @fk_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'refresh_tokens' 
        AND COLUMN_NAME = 'userId' 
        AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);

SET @sql = CONCAT('ALTER TABLE refresh_tokens DROP FOREIGN KEY ', @fk_name);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 문제가 되는 인덱스 삭제 (이제 안전하게 삭제 가능)
DROP INDEX IF EXISTS IDX_610102b60fea1455310ccd299d ON refresh_tokens;

-- 4. 다른 관련 인덱스들도 안전하게 정리
DROP INDEX IF EXISTS idx_refresh_tokens_user_id ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_token ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_expires_at ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_valid_tokens ON refresh_tokens;

-- 5. userId 컬럼 타입 변경 (필요한 경우)
-- 주의: 이 부분은 데이터가 있는 경우 신중하게 실행해야 함
-- ALTER TABLE refresh_tokens MODIFY COLUMN userId VARCHAR(36) NOT NULL;

-- 6. 새로운 인덱스 생성
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(userId);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expiresAt);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(isRevoked);
CREATE INDEX idx_refresh_tokens_valid_tokens ON refresh_tokens(userId, isRevoked, expiresAt);

-- 7. 외래 키 제약조건 재생성
ALTER TABLE refresh_tokens 
ADD CONSTRAINT FK_refresh_tokens_user_id 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- =============================================================================
-- 다른 테이블들의 외래 키 제약조건도 확인하고 정리
-- =============================================================================

-- user_missions 테이블 정리
SET @fk_name_um_user = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'user_missions' 
        AND COLUMN_NAME = 'userId' 
        AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);

SET @fk_name_um_mission = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'user_missions' 
        AND COLUMN_NAME = 'missionId' 
        AND REFERENCED_TABLE_NAME = 'missions'
    LIMIT 1
);

-- user_missions 외래 키 재생성 (필요한 경우)
-- SET @sql = CONCAT('ALTER TABLE user_missions DROP FOREIGN KEY ', @fk_name_um_user);
-- PREPARE stmt FROM @sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- SET @sql = CONCAT('ALTER TABLE user_missions DROP FOREIGN KEY ', @fk_name_um_mission);
-- PREPARE stmt FROM @sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- ALTER TABLE user_missions 
-- ADD CONSTRAINT FK_user_missions_user_id 
-- FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE user_missions 
-- ADD CONSTRAINT FK_user_missions_mission_id 
-- FOREIGN KEY (missionId) REFERENCES missions(id) ON DELETE CASCADE;

-- =============================================================================
-- 마이그레이션 완료 확인
-- =============================================================================

-- 모든 외래 키 제약조건 확인
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 모든 인덱스 확인
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    INDEX_TYPE,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('refresh_tokens', 'user_missions', 'posts', 'likes', 'cells', 'cell_members', 'missions', 'mission_scriptures', 'users')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 완료 로그
SELECT CONCAT('외래 키 제약조건 수정 완료 - ', NOW()) as completion_log;
