# 데이터베이스 규칙

## 📊 데이터베이스 엔티티 설계

### 엔티티 구조 표준

#### 1. User (사용자)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  profile_image TEXT,
  role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. Post (게시물)
```sql
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  bible_verse VARCHAR(200),
  author_id INT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. Mission (미션)
```sql
CREATE TABLE missions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE UNIQUE NOT NULL,
  start_book VARCHAR(50) NOT NULL,
  start_chapter INT NOT NULL,
  start_verse INT,
  end_book VARCHAR(50),
  end_chapter INT,
  end_verse INT,
  title VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🗄️ 네이밍 컨벤션

### 테이블 네이밍
- snake_case 복수형 사용 (예: `users`, `cell_members`)
- 연결 테이블: `{table1}_{table2}` (예: `user_missions`)

### 컬럼 네이밍
- snake_case 사용 (예: `created_at`, `is_active`)
- Boolean 필드: `is_` 접두사 (예: `is_deleted`, `is_active`)
- 외래키: `{테이블명}_id` 형식 (예: `user_id`, `post_id`)

### 인덱스 네이밍
- Primary Key: `pk_{테이블명}`
- Foreign Key: `fk_{테이블명}_{참조테이블명}`
- Unique Index: `uk_{테이블명}_{컬럼명}`
- 일반 Index: `idx_{테이블명}_{컬럼명}`

## 🔗 관계 설정 및 제약조건

### 외래키 제약조건
```sql
-- 기본 외래키 (CASCADE DELETE)
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE

-- 참조 무결성 유지 (RESTRICT)
FOREIGN KEY (cell_id) REFERENCES cells(id) ON DELETE RESTRICT

-- NULL 설정 (SET NULL)
FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
```

### 복합 유니크 제약조건
```sql
-- 사용자당 하나의 미션만 완료 가능
UNIQUE KEY uk_user_missions_user_mission (user_id, mission_id)

-- 사용자당 하나의 셀만 가입 가능
UNIQUE KEY uk_cell_members_user (user_id)
```

## 📈 인덱스 최적화 전략

### 필수 인덱스
```sql
-- 검색용 인덱스
CREATE INDEX idx_posts_title ON posts(title);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- 조인 최적화 인덱스
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- 복합 인덱스 (쿼리 패턴 고려)
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_user_missions_status ON user_missions(user_id, is_completed);
```

### 성능 고려사항
- 자주 조회되는 컬럼에 인덱스 추가
- WHERE, ORDER BY, JOIN 조건에 사용되는 컬럼 우선
- 복합 인덱스는 선택도가 높은 컬럼을 앞에 배치
- 인덱스 남용 방지 (INSERT/UPDATE 성능 저하)

## 🔄 마이그레이션 규칙

### 마이그레이션 파일 네이밍
```
YYYYMMDDHHMMSS-description.sql
20241201120000-create-users-table.sql
20241201121000-add-profile-image-to-users.sql
20241201122000-create-indexes-for-posts.sql
```

### 안전한 마이그레이션 작성
```sql
-- 1. 기존 데이터 백업 확인
-- 2. 트랜잭션 사용
START TRANSACTION;

-- 3. 스키마 변경
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 4. 데이터 마이그레이션 (필요시)
UPDATE users SET phone = '' WHERE phone IS NULL;

-- 5. 제약조건 추가
ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NOT NULL;

-- 6. 커밋
COMMIT;
```

### 롤백 전략
- 각 마이그레이션에 대응하는 롤백 스크립트 작성
- 데이터 손실이 없는 롤백 방법 우선
- 복잡한 마이그레이션은 단계별로 분할

## 📊 데이터 타입 가이드라인

### 권장 데이터 타입
```sql
-- ID: 자동 증가 정수
id INT PRIMARY KEY AUTO_INCREMENT

-- 문자열
title VARCHAR(100)          -- 제한된 길이
content TEXT               -- 긴 텍스트
email VARCHAR(255)         -- 이메일

-- 숫자
price DECIMAL(10,2)        -- 통화
count INT                  -- 정수
percentage FLOAT           -- 소수

-- 날짜/시간
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
birth_date DATE           -- 날짜만
meeting_time TIME         -- 시간만

-- 불린
is_active BOOLEAN DEFAULT TRUE

-- 열거형
status ENUM('pending', 'approved', 'rejected')
```

## 🔍 쿼리 최적화

### 성능 좋은 쿼리 패턴
```sql
-- LIMIT 사용한 페이징
SELECT * FROM posts
WHERE created_at < '2024-01-01'
ORDER BY created_at DESC
LIMIT 20;

-- 적절한 JOIN 사용
SELECT p.title, u.name
FROM posts p
INNER JOIN users u ON p.author_id = u.id
WHERE p.is_deleted = FALSE;

-- 인덱스 활용한 검색
SELECT * FROM posts
WHERE title LIKE 'Bible%'  -- 앞쪽 매칭
AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### 피해야 할 쿼리 패턴
```sql
-- N+1 문제 유발
SELECT * FROM posts;  -- 그 후 각 post마다 author 조회

-- 전체 테이블 스캔
SELECT * FROM posts WHERE LOWER(title) LIKE '%bible%';

-- 함수 사용으로 인덱스 무효화
SELECT * FROM posts WHERE YEAR(created_at) = 2024;
```

## 🚨 보안 및 무결성

### 데이터 검증
- NOT NULL 제약조건 적절히 사용
- CHECK 제약조건으로 데이터 범위 제한
- 외래키 제약조건으로 참조 무결성 보장

### 민감 데이터 처리
- 개인정보는 암호화 저장
- 비밀번호는 해시화 (bcrypt)
- 로그에 민감 정보 기록 금지

### 백업 및 복구
- 정기적인 데이터베이스 백업
- 백업 파일 암호화 저장
- 복구 절차 문서화 및 테스트

## 📏 성능 모니터링

### 모니터링 대상
- 느린 쿼리 (slow query log)
- 인덱스 사용률
- 테이블 크기 및 증가율
- 연결 수 및 대기 시간

### 최적화 체크리스트
- [ ] 적절한 인덱스 설정
- [ ] 쿼리 실행 계획 확인
- [ ] 불필요한 데이터 조회 방지
- [ ] 정기적인 통계 정보 업데이트