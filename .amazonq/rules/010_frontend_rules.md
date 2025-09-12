# Frontend 개발 규칙 (React/TypeScript/Vite)

## 🎨 UI/UX 컴포넌트 설계

### 모바일 우선 설계 (Mobile First)
- 기본 뷰포트: 375px (iPhone SE 기준)
- Tailwind CSS breakpoints 활용: sm(640px), md(768px), lg(1024px), xl(1280px)
- PWA 기반의 모바일 우선 설계

### 컴포넌트 구조 및 네이밍
- 컴포넌트: PascalCase (예: `PostCard`, `MissionCalendar`)
- Props 인터페이스: `{ComponentName}Props`
- 훅: camelCase with use prefix (예: `useGetPosts`)
- 파일명: PascalCase for components, kebab-case for utilities

### 컴포넌트 분류
```
components/
├── ui/              # shadcn/ui 기본 컴포넌트
├── layout/          # 레이아웃 컴포넌트
├── forms/           # 폼 관련 컴포넌트
├── common/          # 공통 컴포넌트
└── features/        # 기능별 컴포넌트
```

## ⚡ 성능 최적화 원칙

### React 최적화
- React.memo, useMemo, useCallback을 적절하게 사용 (불필요한 사용 금지)
- 이미지 최적화 및 지연 로딩 고려
- 컴포넌트 리렌더링 최소화

### React Query 패턴
- staleTime, cacheTime 적절한 설정
- 쿼리 키 관리 체계적으로 수행 (object 형식 사용: `{ id, filters }`)
- 무한 스크롤 및 페이징 최적화
- 쿼리 키는 `queries/` 폴더에 정의

### 쿼리 키 구조
```typescript
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), { id }] as const,
};
```

## 🔐 보안 및 안전성

### XSS 방지
- dangerouslySetInnerHTML 사용 제한
- 사용자 입력 데이터 새니타이제이션 필수
- React Hook Form + Zod 를 활용한 입력 검증

### 인증 관리
- JWT 토큰 기반 인증
- 토큰 자동 갱신 구현
- 보호된 라우트 구현

## 📱 PWA 및 모바일 최적화

### PWA 기능
- Service Worker 활용
- 푸시 알림 지원
- 오프라인 지원
- 홈 스크린 추가

### 반응형 디자인
- 모바일 우선 설계
- 터치 인터페이스 최적화
- 접근성 고려 (WCAG 2.1 AA 준수)

## 🎯 폼 및 상태 관리

### React Hook Form + Zod 패턴 필수
```typescript
const schema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100),
  content: z.string().min(1, "내용을 입력해주세요").max(1000),
});

type FormData = z.infer<typeof schema>;
```

### 에러 처리
- 로딩, 에러, 빈 상태 컴포넌트 활용
- ErrorBoundary 적용
- 사용자 친화적 에러 메시지

## 🧪 테스트 및 품질

### 테스트 전략
- 컴포넌트 단위 테스트
- 커스텀 훅 테스트
- E2E 테스트 (주요 플로우)

### 코드 품질
- ESLint 규칙 준수
- Prettier 코드 포맷팅
- TypeScript strict mode 활용