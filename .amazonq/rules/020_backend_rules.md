# Backend 개발 규칙 (NestJS/TypeORM)

## 🏗️ 아키텍처 설계

### 모듈 구조
```
src/
├── entities/          # TypeORM 엔티티
├── auth/              # 인증 모듈
├── users/             # 사용자 모듈
├── posts/             # 게시물 모듈
├── missions/          # 미션 모듈
├── cells/             # 셀 모듈
├── admin/             # 관리자 모듈
└── common/            # 공통 모듈
```

### 네이밍 컨벤션
- 컨트롤러: `*.controller.ts`
- 서비스: `*.service.ts`
- 모듈: `*.module.ts`
- DTO: `Create*Dto`, `Update*Dto`, `*ResponseDto`, `Get*QueryDto`
- 엔티티: `*.entity.ts`

## 🗄️ 데이터베이스 설계

### 엔티티 설계 원칙
- 테이블명: snake_case 복수형 (예: `users`, `cell_members`)
- 컬럼명: camelCase (예: `createdAt`, `isActive`)
- 외래키: `{테이블명}Id` 형식 (예: `userId`, `postId`)

### 공통 필드 필수
```typescript
@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
```

### 소프트 삭제 패턴
```typescript
@Column({ default: false })
isDeleted: boolean;
```

### 관계 설정 규칙
- 일대다 관계: `@OneToMany`와 `@ManyToOne` 사용
- 다대다 관계: 중간 테이블 생성하여 일대다로 분해
- 외래키 제약조건: 항상 명시적으로 설정
- Cascade 옵션: 신중하게 사용 (주로 `['remove']`는 피함)

## 🔐 인증/인가 시스템

### JWT 토큰 관리
- 액세스 토큰: 24시간
- 리프레시 토큰: 7일
- 자동 갱신 구현

### 권한 기반 접근 제어 (RBAC)
```typescript
export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export enum CellRole {
  MEMBER = "member",
  LEADER = "leader",
}
```

### 가드 사용
- `@UseGuards(JwtAuthGuard)`: 기본 인증
- `@UseGuards(RolesGuard)`: 역할 기반 권한
- `@UseGuards(AdminGuard)`: 관리자 전용
- `@UseGuards(PostOwnerGuard)`: 리소스 소유권 확인

## 🚨 API 설계 및 보안

### RESTful API 설계
```
GET /api/v1/{resource}           # 목록 조회
GET /api/v1/{resource}/:id       # 상세 조회
POST /api/v1/{resource}          # 생성
PUT /api/v1/{resource}/:id       # 전체 수정
PATCH /api/v1/{resource}/:id     # 부분 수정
DELETE /api/v1/{resource}/:id    # 삭제
```

### 상태 코드 가이드라인
- 200 OK: 성공적인 GET, PUT, PATCH
- 201 Created: 성공적인 POST
- 204 No Content: 성공적인 DELETE
- 400 Bad Request: 잘못된 요청
- 401 Unauthorized: 인증 실패
- 403 Forbidden: 권한 없음
- 404 Not Found: 리소스 없음

### DTO 검증 필수
```typescript
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Transform(({ value }) => sanitizeHtml(value))
  content: string;
}
```

### 보안 규칙
- 입력 검증 및 새니타이제이션 필수
- HTML 새니타이제이션: DOMPurify 사용
- SQL Injection 방지: TypeORM 쿼리 빌더 활용
- Rate Limiting 적용
- CORS 설정 엄격하게 관리

## 📊 성능 최적화

### 데이터베이스 최적화
- 적절한 인덱스 설정
- N+1 문제 방지를 위한 join 최적화
- 가상 컬럼 활용 (`@VirtualColumn`)
- 지연 로딩 기본, 필요시 eager loading

### 캐싱 전략
- Redis 캐싱 활용
- 쿼리 결과 캐싱
- 세션 관리

## 🔍 모니터링 및 로깅

### 보안 이벤트 로깅
- 로그인 시도
- 권한 없는 접근
- 의심스러운 활동

### 성능 모니터링
- API 응답 시간
- 데이터베이스 쿼리 성능
- 메모리 사용량

## 🧪 테스트 전략

### 테스트 계층
- 단위 테스트: 서비스 로직
- 통합 테스트: 컨트롤러-서비스 연동
- E2E 테스트: 전체 API 플로우

### 테스트 데이터베이스
- 테스트용 별도 DB 사용
- 각 테스트 후 데이터 정리

## 🚫 금지 사항

### 보안 위험 요소
- 민감한 정보 로깅 금지
- 하드코딩된 비밀키 사용 금지
- 사용자 입력 직접 쿼리 실행 금지

### 성능 위험 요소
- N+1 쿼리 문제 회피
- 무거운 연산을 동기적으로 처리 금지
- 큰 데이터셋 한번에 로딩 금지