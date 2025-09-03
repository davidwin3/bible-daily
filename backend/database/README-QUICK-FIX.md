# 데이터베이스 외래 키 제약조건 오류 해결 가이드

## 🚨 현재 문제 상황

TypeORM이 `refresh_tokens` 테이블에서 인덱스 `IDX_610102b60fea1455310ccd299d`를 삭제하려고 시도하지만, 이 인덱스가 외래 키 제약조건에 필요하기 때문에 삭제할 수 없어서 오류가 발생하고 있습니다.

```
QueryFailedError: Cannot drop index 'IDX_610102b60fea1455310ccd299d': needed in a foreign key constraint
```

## 🔧 해결 방법

### 옵션 1: 빠른 수동 해결 (권장)

```bash
# 1. MySQL에 접속
mysql -u root -p bible_daily

# 2. 빠른 해결 스크립트 실행
source /path/to/backend/database/quick-fix.sql
```

### 옵션 2: 개발 환경 재시작

```bash
# 1. 개발 환경 중지
pnpm dev:stop

# 2. 데이터베이스 초기화 (주의: 모든 데이터 삭제됨)
docker-compose down -v
docker volume rm bible-daily_mysql-data

# 3. 개발 환경 재시작
pnpm dev:start
```

### 옵션 3: 수동 SQL 실행

MySQL에 직접 접속하여 다음 명령어들을 순서대로 실행:

```sql
-- 1. 외래 키 제약조건 확인
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'bible_daily'
    AND TABLE_NAME = 'refresh_tokens'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 2. 외래 키 제약조건 삭제 (CONSTRAINT_NAME을 실제 이름으로 변경)
ALTER TABLE refresh_tokens DROP FOREIGN KEY FK_CONSTRAINT_NAME_HERE;

-- 3. 문제가 되는 인덱스 삭제
DROP INDEX IDX_610102b60fea1455310ccd299d ON refresh_tokens;

-- 4. 새로운 인덱스 생성
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(userId);

-- 5. 외래 키 제약조건 재생성
ALTER TABLE refresh_tokens
ADD CONSTRAINT FK_refresh_tokens_user_id
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
```

## 📋 엔티티 변경사항 확인

현재 다음 엔티티 파일들이 수정되었습니다:

- `backend/src/entities/cell-member.entity.ts`
- `backend/src/entities/cell.entity.ts`
- `backend/src/entities/like.entity.ts`
- `backend/src/entities/mission-scripture.entity.ts`
- `backend/src/entities/mission.entity.ts`
- `backend/src/entities/post.entity.ts`
- `backend/src/entities/refresh-token.entity.ts`
- `backend/src/entities/user-mission.entity.ts`
- `backend/src/entities/user.entity.ts`

주요 변경사항:

1. **ID 타입 변경**: `number`에서 `string` (UUID)로 변경
2. **인덱스 추가**: 성능 최적화를 위한 다양한 인덱스 정의
3. **외래 키 관계 업데이트**: UUID 기반으로 관계 재정의

## ⚠️ 주의사항

1. **데이터 백업**: 프로덕션 환경에서는 반드시 데이터를 백업한 후 실행하세요.
2. **순서 중요**: 외래 키 제약조건을 먼저 삭제하고, 인덱스를 삭제한 후, 다시 생성하는 순서를 지켜야 합니다.
3. **ID 타입 변경**: 기존 데이터가 있는 경우 ID 타입 변경 시 데이터 변환이 필요할 수 있습니다.

## 🔍 문제 해결 후 확인사항

```sql
-- 1. 외래 키 제약조건 확인
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'bible_daily'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 2. 인덱스 확인
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'bible_daily'
    AND TABLE_NAME = 'refresh_tokens';
```

## 🚀 해결 후 재시작

문제를 해결한 후 애플리케이션을 재시작하세요:

```bash
# 백엔드만 재시작
cd backend
pnpm start:dev

# 또는 전체 개발 환경 재시작
pnpm dev:start
```
