-- 인덱스 생성 오류 수정 스크립트
-- 실행 날짜: ${new Date().toISOString().split('T')[0]}
-- 문제: posts.content 컬럼에 일반 인덱스 생성 시 키 길이 초과 오류

-- =============================================================================
-- 문제가 있는 인덱스 제거 (만약 존재한다면)
-- =============================================================================

-- 기존에 실패한 인덱스가 부분적으로 생성되었을 수 있으므로 확인 후 제거
-- MySQL 8.0에서는 DROP INDEX IF EXISTS 구문이 제한적이므로 조건부 실행
SET @sql = (
    SELECT CASE 
        WHEN COUNT(*) > 0 THEN 'DROP INDEX idx_posts_search_content ON posts'
        ELSE 'SELECT "Index does not exist" as message'
    END as sql_statement
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'posts'
      AND INDEX_NAME = 'idx_posts_search_content'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- 올바른 인덱스 생성
-- =============================================================================

-- 1. posts.content 컬럼에 FULLTEXT 인덱스 생성
-- FULLTEXT 인덱스는 키 길이 제한 없이 전체 텍스트 검색을 지원
CREATE FULLTEXT INDEX idx_posts_search_content ON posts(content);

-- 2. 제목과 내용을 함께 검색하는 복합 FULLTEXT 인덱스
CREATE FULLTEXT INDEX idx_posts_search_title_content ON posts(title, content);

-- 3. 검색 성능 최적화를 위한 추가 인덱스 (이미 기본 스키마에서 생성됨)
-- CREATE INDEX idx_posts_search_active ON posts(isDeleted, createdAt, authorId);

-- =============================================================================
-- 인덱스 생성 확인
-- =============================================================================

-- 생성된 인덱스 확인
SELECT 
    TABLE_NAME as '테이블명',
    INDEX_NAME as '인덱스명',
    INDEX_TYPE as '인덱스타입',
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as '컬럼목록'
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'posts'
  AND INDEX_NAME LIKE '%content%'
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE
ORDER BY INDEX_NAME;

-- 모든 posts 테이블 인덱스 확인
SELECT 
    INDEX_NAME as '인덱스명',
    INDEX_TYPE as '타입',
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as '컬럼',
    CARDINALITY as '카디널리티'
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'posts'
GROUP BY INDEX_NAME, INDEX_TYPE, CARDINALITY
ORDER BY INDEX_NAME;

-- =============================================================================
-- FULLTEXT 인덱스 사용 방법 안내
-- =============================================================================

/*
FULLTEXT 인덱스 사용 예시:

1. 기본 검색:
SELECT * FROM posts 
WHERE MATCH(content) AGAINST('검색어' IN NATURAL LANGUAGE MODE);

2. 제목과 내용 함께 검색:
SELECT * FROM posts 
WHERE MATCH(title, content) AGAINST('검색어' IN NATURAL LANGUAGE MODE);

3. 불린 모드 검색 (AND, OR, NOT 연산자 사용):
SELECT * FROM posts 
WHERE MATCH(title, content) AGAINST('+성경 +말씀 -시편' IN BOOLEAN MODE);

4. 관련도 점수와 함께:
SELECT *, MATCH(title, content) AGAINST('검색어') AS relevance
FROM posts 
WHERE MATCH(title, content) AGAINST('검색어')
ORDER BY relevance DESC;
*/

SELECT 'FULLTEXT 인덱스 생성 완료' as message, NOW() as timestamp;
