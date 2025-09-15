-- 사용자 테이블에 실명 필드 추가
-- 2024-12-15: 회원가입시 실명 필수 입력 기능 추가

START TRANSACTION;

-- 1. realName 컬럼 추가 (nullable로 먼저 추가)
ALTER TABLE users ADD COLUMN realName VARCHAR(100) NULL AFTER name;

-- 2. 기존 사용자들의 name 값을 realName에 복사
-- 기존 사용자들은 name을 실명으로 간주하여 복사
UPDATE users SET realName = name WHERE realName IS NULL;

-- 3. realName 컬럼을 NOT NULL로 변경
ALTER TABLE users MODIFY COLUMN realName VARCHAR(100) NOT NULL;

-- 4. realName 필드에 인덱스 추가 (검색 성능 향상)
CREATE INDEX idx_users_real_name ON users(realName);

-- 5. 마이그레이션 완료 확인을 위한 SELECT 쿼리
SELECT 
    COUNT(*) as total_users,
    COUNT(realName) as users_with_real_name,
    COUNT(CASE WHEN realName IS NULL OR realName = '' THEN 1 END) as users_without_real_name
FROM users;

COMMIT;
