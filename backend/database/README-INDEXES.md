# 📊 데이터베이스 인덱스 최적화 가이드

## 개요

이 문서는 Bible Daily 프로젝트의 데이터베이스 성능 최적화를 위한 인덱스 설계 및 적용 가이드입니다.

## 🎯 적용된 인덱스 목록

### 1. Posts 테이블

| 인덱스명                 | 컬럼                 | 목적                    |
| ------------------------ | -------------------- | ----------------------- |
| `idx_posts_is_deleted`   | isDeleted            | 삭제된 게시물 필터링    |
| `idx_posts_created_at`   | createdAt            | 생성일 기준 정렬        |
| `idx_posts_author_id`    | authorId             | 작성자별 게시물 조회    |
| `idx_posts_active_posts` | isDeleted, createdAt | 활성 게시물 조회 최적화 |
| `idx_posts_search_title` | title                | 제목 검색 최적화        |

### 2. Missions 테이블

| 인덱스명                       | 컬럼           | 목적                  |
| ------------------------------ | -------------- | --------------------- |
| `idx_missions_is_active`       | isActive       | 활성 미션 조회        |
| `idx_missions_active_missions` | isActive, date | 활성 미션의 날짜 정렬 |

### 3. User_Missions 테이블

| 인덱스명                              | 컬럼                   | 목적               |
| ------------------------------------- | ---------------------- | ------------------ |
| `idx_user_missions_user_id`           | userId                 | 사용자별 미션 조회 |
| `idx_user_missions_mission_id`        | missionId              | 미션별 통계 조회   |
| `idx_user_missions_is_completed`      | isCompleted            | 완료 상태 필터링   |
| `idx_user_missions_created_at`        | createdAt              | 생성일 기준 정렬   |
| `idx_user_missions_user_completed`    | userId, isCompleted    | 사용자별 완료 통계 |
| `idx_user_missions_mission_completed` | missionId, isCompleted | 미션별 완료 통계   |
| `idx_user_missions_recent_activity`   | userId, createdAt      | 사용자별 최근 활동 |

### 4. Likes 테이블

| 인덱스명               | 컬럼      | 목적                    |
| ---------------------- | --------- | ----------------------- |
| `idx_likes_post_id`    | postId    | 게시물별 좋아요 수 조회 |
| `idx_likes_user_id`    | userId    | 사용자별 좋아요 목록    |
| `idx_likes_created_at` | createdAt | 좋아요 생성일 정렬      |

### 5. Users 테이블

| 인덱스명                  | 컬럼                  | 목적                      |
| ------------------------- | --------------------- | ------------------------- |
| `idx_users_is_active`     | isActive              | 활성 사용자 조회          |
| `idx_users_role`          | role                  | 역할별 사용자 조회        |
| `idx_users_last_login_at` | lastLoginAt           | 최근 로그인 조회          |
| `idx_users_active_users`  | isActive, role        | 활성 사용자 역할별 조회   |
| `idx_users_recent_login`  | isActive, lastLoginAt | 활성 사용자의 최근 로그인 |

### 6. Cells 테이블

| 인덱스명                 | 컬럼               | 목적                |
| ------------------------ | ------------------ | ------------------- |
| `idx_cells_is_active`    | isActive           | 활성 셀 조회        |
| `idx_cells_leader_id`    | leaderId           | 리더별 셀 조회      |
| `idx_cells_active_cells` | isActive, leaderId | 활성 셀의 리더 조회 |

### 7. Cell_Members 테이블

| 인덱스명                       | 컬럼             | 목적                    |
| ------------------------------ | ---------------- | ----------------------- |
| `idx_cell_members_user_id`     | userId           | 사용자별 셀 멤버십 조회 |
| `idx_cell_members_cell_id`     | cellId           | 셀별 멤버 조회          |
| `idx_cell_members_is_active`   | isActive         | 활성 멤버 조회          |
| `idx_cell_members_user_active` | userId, isActive | 사용자별 활성 멤버십    |
| `idx_cell_members_cell_active` | cellId, isActive | 셀별 활성 멤버          |
| `idx_cell_members_joined_at`   | joinedAt         | 가입일 정렬             |

### 8. Mission_Scriptures 테이블

| 인덱스명                            | 컬럼             | 목적                      |
| ----------------------------------- | ---------------- | ------------------------- |
| `idx_mission_scriptures_mission_id` | missionId        | 미션별 성경구절 조회      |
| `idx_mission_scriptures_order`      | missionId, order | 미션별 성경구절 순서 정렬 |
| `idx_mission_scriptures_book`       | startBook        | 성경책별 구절 검색        |

### 9. Refresh_Tokens 테이블

| 인덱스명                          | 컬럼                         | 목적             |
| --------------------------------- | ---------------------------- | ---------------- |
| `idx_refresh_tokens_token`        | token                        | 토큰 조회        |
| `idx_refresh_tokens_expires_at`   | expiresAt                    | 만료일 조회      |
| `idx_refresh_tokens_is_revoked`   | isRevoked                    | 무효화 상태 조회 |
| `idx_refresh_tokens_valid_tokens` | userId, isRevoked, expiresAt | 유효한 토큰 조회 |

## 🚀 인덱스 적용 방법

### 1. 개발 환경

```bash
# Docker Compose 환경에서 실행
docker-compose exec mysql mysql -u root -p bible_daily < database/add-performance-indexes.sql
```

### 2. 직접 MySQL 접속

```bash
# MySQL에 직접 접속하여 실행
mysql -u username -p database_name < database/add-performance-indexes.sql
```

### 3. TypeORM 자동 동기화

TypeORM의 `synchronize: true` 옵션이 활성화되어 있다면, 엔티티에 정의된 인덱스가 자동으로 생성됩니다.

**⚠️ 주의**: 운영 환경에서는 `synchronize: false`로 설정하고 수동으로 마이그레이션을 실행하세요.

## 📈 성능 개선 예상 효과

### Before (인덱스 적용 전)

- 게시물 목록 조회: 전체 테이블 스캔
- 미션 완료 통계: 관련 테이블 전체 스캔
- 사용자별 통계: 조인 후 전체 스캔

### After (인덱스 적용 후)

- **게시물 목록 조회**: 50-80% 성능 개선 예상
- **미션 완료 통계**: 70-90% 성능 개선 예상
- **사용자별 통계**: 60-85% 성능 개선 예상
- **검색 기능**: 40-70% 성능 개선 예상

## 🔍 인덱스 효과 확인 방법

### 1. 쿼리 실행 계획 확인

```sql
EXPLAIN SELECT * FROM posts WHERE isDeleted = false ORDER BY createdAt DESC;
```

### 2. 인덱스 사용 통계 확인

```sql
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'bible_daily'
  AND TABLE_NAME IN ('posts', 'missions', 'user_missions', 'likes', 'users', 'cells', 'cell_members', 'mission_scriptures', 'refresh_tokens')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

### 3. 쿼리 성능 모니터링

```sql
-- 슬로우 쿼리 로그 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- 성능 스키마에서 쿼리 분석
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC LIMIT 10;
```

## ⚠️ 주의사항

### 1. 인덱스 오버헤드

- 인덱스는 저장공간을 추가로 사용합니다
- INSERT/UPDATE/DELETE 시 인덱스 유지 비용이 발생합니다
- 불필요한 인덱스는 성능을 오히려 저하시킬 수 있습니다

### 2. 복합 인덱스 순서

- 복합 인덱스의 컬럼 순서가 중요합니다
- 선택성이 높은 컬럼을 앞에 배치했습니다
- WHERE 절의 조건 순서와 일치시켜야 효과적입니다

### 3. 정기적인 모니터링

- 인덱스 사용률을 정기적으로 모니터링하세요
- 사용되지 않는 인덱스는 제거를 고려하세요
- 데이터 증가에 따른 인덱스 재조정이 필요할 수 있습니다

## 📋 향후 최적화 계획

### 1. 전문 검색 인덱스

- Posts 테이블의 content 컬럼에 FULLTEXT 인덱스 적용 고려
- 한글 검색 최적화를 위한 추가 설정 필요

### 2. 파티셔닝

- 데이터 증가 시 날짜별 파티셔닝 고려
- 특히 user_missions, posts 테이블이 대상

### 3. 캐싱 전략

- Redis를 활용한 자주 조회되는 데이터 캐싱
- 통계 데이터의 주기적 업데이트 전략

## 📞 문의사항

인덱스 관련 문의사항이나 성능 이슈가 있으면 개발팀에 문의하세요.

---

_마지막 업데이트: 2024년 12월_
