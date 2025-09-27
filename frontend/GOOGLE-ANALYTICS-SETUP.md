# Google Analytics 설정 가이드

이 문서는 Bible Daily 프론트엔드에 Google Analytics 4 (GA4) 추적을 설정하고 사용하는 방법을 설명합니다.

## 📋 목차

1. [환경 설정](#환경-설정)
2. [기능 개요](#기능-개요)
3. [사용법](#사용법)
4. [이벤트 추적 예시](#이벤트-추적-예시)
5. [개발 환경에서의 테스트](#개발-환경에서의-테스트)
6. [문제 해결](#문제-해결)

## 🔧 환경 설정

### 1. Google Analytics 4 설정

1. [Google Analytics](https://analytics.google.com/)에 접속
2. 새 속성 생성 또는 기존 속성 선택
3. 데이터 스트림 > 웹 추가
4. 측정 ID (G-XXXXXXXXXX) 복사

### 2. 환경 변수 설정

`.env` 파일에 Google Analytics 측정 ID를 추가:

```bash
# Google Analytics Configuration
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**주의사항:**

- 개발 환경에서는 실제 데이터가 전송되지 않고 콘솔에만 로그가 출력됩니다
- 프로덕션 환경에서만 실제 GA로 데이터가 전송됩니다

## 🚀 기능 개요

### 자동 추적 기능

1. **페이지뷰 자동 추적**: 라우터 변경 시 자동으로 페이지뷰 이벤트 전송
2. **스크롤 추적**: 75% 스크롤 시 자동 이벤트 전송
3. **시간 추적**: 30초, 60초, 2분, 5분 체류 시 자동 이벤트 전송
4. **사용자 상호작용 추적**: 클릭, 키보드 입력 등 기본 상호작용 추적

### 수동 추적 기능

1. **버튼 클릭 추적**: 주요 버튼 클릭 이벤트
2. **폼 제출 추적**: 로그인, 게시물 작성 등 폼 제출 이벤트
3. **검색 추적**: 검색어 및 검색 결과 추적
4. **오류 추적**: 애플리케이션 오류 및 예외 상황 추적
5. **사용자 참여도 추적**: 좋아요, 댓글 등 사용자 참여 이벤트

## 📖 사용법

### 1. 페이지뷰 자동 추적

페이지뷰는 `App.tsx`에서 자동으로 추적됩니다:

```tsx
import { usePageViewTracking } from "@/hooks/useAnalytics";

function ServiceWorkerMessageHandler() {
  // 페이지뷰 자동 추적
  usePageViewTracking();

  // ... 기타 코드
}
```

### 2. 이벤트 추적 훅 사용

```tsx
import { useEventTracking } from "@/hooks/useAnalytics";

function MyComponent() {
  const { trackButtonClick, trackEvent, trackFormSubmit } = useEventTracking();

  const handleButtonClick = () => {
    trackButtonClick("my_button", {
      event_category: "user_action",
      custom_parameters: { source: "homepage" },
    });
  };

  return <button onClick={handleButtonClick}>클릭</button>;
}
```

### 3. 버튼 추적 편의 훅

```tsx
import { useButtonTracking } from "@/hooks/useAnalytics";

function MyComponent() {
  const { createClickHandler } = useButtonTracking();

  const handleOriginalAction = () => {
    console.log("원래 동작 실행");
  };

  return (
    <button
      onClick={createClickHandler("my_button", handleOriginalAction, {
        event_category: "navigation",
      })}
    >
      클릭
    </button>
  );
}
```

### 4. 직접 Analytics 라이브러리 사용

```tsx
import { analytics } from "@/lib/analytics";

// 커스텀 이벤트 추적
analytics.trackEvent("custom_event", {
  event_category: "custom",
  event_label: "test",
  value: 1,
  custom_parameters: { key: "value" },
});

// 페이지뷰 추적
analytics.trackPageView({
  page_title: "커스텀 페이지",
  custom_parameters: { section: "admin" },
});

// 오류 추적
analytics.trackError("API 호출 실패", {
  custom_parameters: { endpoint: "/api/posts" },
});
```

## 📊 이벤트 추적 예시

### 현재 구현된 추적 이벤트

#### 1. 인증 관련

- `google_login`: 구글 로그인 버튼 클릭
- `login_success`: 로그인 성공
- `login_failed`: 로그인 실패

#### 2. 네비게이션

- `nav_홈`, `nav_소감`, `nav_미션`, `nav_셀`, `nav_퀴즈`: 하단 네비게이션 클릭
- `view_all_posts`: 홈페이지에서 "전체 보기" 버튼 클릭
- `mission_detail_view`: 미션 상세보기 버튼 클릭

#### 3. 미션 관련

- `mission_completion_toggle`: 미션 완료/미완료 토글
- `mission_detail_view`: 미션 상세보기

#### 4. 게시물 관련

- `post_like_toggle`: 게시물 좋아요/좋아요 취소

#### 5. 사용자 참여도

- `scroll`: 75% 스크롤 도달
- `time_on_page`: 특정 시간 체류 (30초, 60초, 2분, 5분)
- `user_interaction`: 클릭, 키보드 입력 등

### 이벤트 데이터 구조

```typescript
interface GAEventParams {
  event_category?: string; // 이벤트 카테고리 (예: "navigation", "engagement")
  event_label?: string; // 이벤트 라벨 (예: "homepage_button")
  value?: number; // 숫자 값 (예: 좋아요 수, 시간 등)
  custom_parameters?: {
    // 커스텀 매개변수
    [key: string]: any;
  };
}
```

## 🧪 개발 환경에서의 테스트

개발 환경에서는 실제 GA로 데이터가 전송되지 않고, 브라우저 콘솔에 로그가 출력됩니다:

```javascript
// 콘솔 출력 예시
GA Page View: {
  page_title: "Bible Daily",
  page_location: "http://localhost:5173/",
  page_path: "/",
}

GA Event: click {
  event_category: "button",
  event_label: "google_login",
  custom_parameters: { login_method: "google" }
}
```

### 디버그 정보 확인

```tsx
import { analytics } from "@/lib/analytics";

console.log(analytics.getDebugInfo());
// 출력:
// {
//   measurementId: "G-XXXXXXXXXX",
//   isInitialized: true,
//   isDevelopment: true,
//   canTrack: true
// }
```

## 🔍 문제 해결

### 1. 이벤트가 전송되지 않는 경우

**확인 사항:**

- 환경 변수 `VITE_FIREBASE_MEASUREMENT_ID`가 올바르게 설정되었는지 확인
- 프로덕션 환경에서 테스트하고 있는지 확인 (개발 환경에서는 콘솔 로그만 출력)
- 브라우저의 애드블로커가 GA 스크립트를 차단하지 않는지 확인

### 2. 콘솔 에러가 발생하는 경우

**일반적인 해결책:**

- 브라우저 새로고침 후 재시도
- 네트워크 연결 상태 확인
- GA 측정 ID 형식 확인 (G-XXXXXXXXXX)

### 3. 개발 환경에서 실제 데이터 전송 테스트

개발 환경에서도 실제 GA로 데이터를 전송하려면:

```typescript
// analytics.ts에서 isDevelopment 조건 수정
constructor() {
  this.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || null;
  this.isDevelopment = false; // 강제로 false로 설정

  if (this.measurementId) {
    this.initialize();
  }
}
```

**주의:** 개발 데이터가 프로덕션 GA에 섞이지 않도록 별도의 GA 속성을 사용하는 것을 권장합니다.

## 📈 GA4 대시보드에서 확인하기

1. **실시간 보고서**: 실시간 사용자 및 이벤트 확인
2. **이벤트**: 커스텀 이벤트 및 매개변수 확인
3. **페이지 및 화면**: 페이지뷰 데이터 확인
4. **사용자**: 사용자 행동 및 참여도 분석

## 🔄 향후 개선 사항

1. **전자상거래 추적**: 구독, 결제 등 전자상거래 이벤트 추가
2. **사용자 여정 추적**: 퍼널 분석을 위한 단계별 이벤트 추가
3. **A/B 테스트**: 실험 및 변형 추적 기능 추가
4. **성능 모니터링**: 페이지 로딩 시간, 오류율 등 성능 지표 추가

---

**참고 문서:**

- [Google Analytics 4 문서](https://developers.google.com/analytics/devguides/collection/ga4)
- [gtag.js 참조](https://developers.google.com/analytics/devguides/collection/gtagjs)
