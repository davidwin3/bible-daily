-- 즉시 실행 가능한 데이터베이스 문제 해결 스크립트
-- 외래 키 제약조건으로 인한 인덱스 삭제 오류 해결

-- 1. 현재 문제가 되는 refresh_tokens 테이블의 외래 키 제약조건 확인
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'refresh_tokens' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 2. 외래 키 제약조건 삭제 (동적 SQL 사용)
SET @sql = (
    SELECT CONCAT('ALTER TABLE refresh_tokens DROP FOREIGN KEY ', CONSTRAINT_NAME)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'refresh_tokens' 
        AND COLUMN_NAME = 'userId' 
        AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);

-- 외래 키 제약조건이 존재하는 경우에만 실행
SET @sql = IFNULL(@sql, 'SELECT "No foreign key to drop" as status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 문제가 되는 인덱스들 삭제
DROP INDEX IF EXISTS IDX_610102b60fea1455310ccd299d ON refresh_tokens;

-- 4. 기존 인덱스들도 정리 (있다면)
DROP INDEX IF EXISTS idx_refresh_tokens_user_id ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_token ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_expires_at ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens;
DROP INDEX IF EXISTS idx_refresh_tokens_valid_tokens ON refresh_tokens;

-- 5. 새로운 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(userId);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expiresAt);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(isRevoked);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_valid_tokens ON refresh_tokens(userId, isRevoked, expiresAt);

-- 6. 외래 키 제약조건 재생성
ALTER TABLE refresh_tokens 
ADD CONSTRAINT FK_refresh_tokens_user_id 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

SELECT 'Database fix completed successfully!' as status;
