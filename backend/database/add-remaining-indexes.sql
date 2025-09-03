-- 남은 인덱스 추가 스크립트
-- 기본 스키마에서 생성되지 않은 추가 인덱스들만 생성

-- 이미 존재하는 인덱스인지 확인하고 생성하는 매크로 함수
DELIMITER //

CREATE PROCEDURE CreateIndexIfNotExists(
    IN index_name VARCHAR(255),
    IN table_name VARCHAR(255),
    IN index_sql TEXT
)
BEGIN
    DECLARE index_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND INDEX_NAME = index_name;
    
    IF index_count = 0 THEN
        SET @sql = index_sql;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Created index: ', index_name) as message;
    ELSE
        SELECT CONCAT('Index already exists: ', index_name) as message;
    END IF;
END //

DELIMITER ;

-- =============================================================================
-- Posts 테이블 추가 인덱스 (FULLTEXT는 이미 생성됨)
-- =============================================================================

-- 검색 성능 최적화를 위한 복합 인덱스
CALL CreateIndexIfNotExists(
    'idx_posts_search_active',
    'posts',
    'CREATE INDEX idx_posts_search_active ON posts(isDeleted, createdAt, authorId)'
);

-- =============================================================================
-- 정리
-- =============================================================================

-- 프로시저 제거
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

-- =============================================================================
-- 인덱스 생성 확인
-- =============================================================================

-- 모든 테이블의 인덱스 현황 확인
SELECT 
    TABLE_NAME as '테이블명',
    INDEX_NAME as '인덱스명',
    INDEX_TYPE as '타입',
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as '컬럼목록'
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('posts', 'missions', 'user_missions', 'likes', 'users', 'cells', 'cell_members', 'mission_scriptures', 'refresh_tokens')
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE
ORDER BY TABLE_NAME, INDEX_NAME;

-- 완료 메시지
SELECT 'Additional indexes processed successfully' as message, NOW() as timestamp;
