# 인앱 브라우저 우회 기능

## 개요

카카오톡, 라인 등의 인앱 브라우저에서 외부 브라우저로 자동 우회하는 기능을 구현했습니다.

참고: [카카오톡/라인 인앱브라우저에서 외부브라우저 띄우기](https://burndogfather.com/271)

## 구현 내용

### 1. 유틸리티 함수 (`src/lib/inapp-browser-utils.ts`)

- **브라우저 감지**: 카카오톡, 라인, 네이버, 인스타그램, 페이스북 등 인앱 브라우저 감지
- **플랫폼 감지**: iOS, Android 구분
- **우회 실행**: 각 브라우저별 최적화된 우회 방법 제공

### 2. React 컴포넌트 (`src/components/common/InAppBrowserHandler.tsx`)

- **InAppBrowserHandler**: 전체 화면 인앱 브라우저 우회 UI
- **InAppBrowserAlert**: 간단한 알림 형태의 우회 버튼
- **useInAppBrowserDetection**: 브라우저 감지 훅

### 3. HTML 레벨 우회 스크립트 (`index.html`)

- 페이지 로드 시 즉시 실행되는 바닐라 JavaScript
- React 앱이 로드되기 전에 우회 시도
- 카카오톡/라인은 즉시 우회, 기타는 안내 페이지 표시

## 우회 방법별 상세

### 카카오톡

```javascript
// 카카오톡 전용 스킴 사용
kakaotalk://web/openExternal?url={인코딩된URL}
```

### 라인

```javascript
// URL 파라미터 추가
{현재URL}?openExternalBrowser=1
// 또는
{현재URL}&openExternalBrowser=1
```

### Android (기타 인앱)

```javascript
// Chrome Intent 사용
intent://{도메인/경로}#Intent;scheme=http;package=com.android.chrome;end
```

### iOS (기타 인앱)

- URL 클립보드 복사
- Safari 실행 안내
- 수동 접속 가이드 제공

## 사용법

### 1. 전역 알림 (이미 적용됨)

```tsx
// App.tsx에 이미 추가됨
<InAppBrowserAlert />
```

### 2. 페이지별 커스텀 핸들러

```tsx
import { InAppBrowserHandler } from "@/components/common/InAppBrowserHandler";

function MyPage() {
  return (
    <div>
      <InAppBrowserHandler
        autoRedirect={true} // 자동 우회 여부
        showWarning={true} // 경고 표시 여부
      />
      {/* 페이지 내용 */}
    </div>
  );
}
```

### 3. 프로그래밍 방식 우회

```tsx
import {
  bypassInAppBrowser,
  detectInAppBrowser,
} from "@/lib/inapp-browser-utils";

function handleBypass() {
  const browserInfo = detectInAppBrowser();

  if (browserInfo.isInApp) {
    bypassInAppBrowser();
  }
}
```

## 테스트 방법

### 개발 환경 테스트

1. 개발 서버 실행: `npm run dev`
2. `/inapp-test` 페이지 접속
3. 브라우저 감지 및 우회 기능 테스트

### 실제 인앱 브라우저 테스트

1. 카카오톡/라인에서 사이트 링크 공유
2. 인앱 브라우저로 접속
3. 자동 우회 기능 확인
4. 수동 우회 버튼 테스트

## 파일 구조

```
frontend/
├── index.html                              # HTML 레벨 우회 스크립트
├── src/
│   ├── lib/
│   │   └── inapp-browser-utils.ts         # 유틸리티 함수
│   ├── components/
│   │   └── common/
│   │       └── InAppBrowserHandler.tsx    # React 컴포넌트
│   ├── pages/
│   │   └── InAppTestPage.tsx              # 테스트 페이지
│   └── App.tsx                            # 전역 알림 적용
```

## 지원 브라우저

### 즉시 우회 (스킴 기반)

- ✅ 카카오톡 인앱 브라우저
- ✅ 라인 인앱 브라우저

### 자동 리다이렉트 (Intent 기반)

- ✅ Android Chrome (기타 인앱들)

### 수동 안내 (클립보드 + 가이드)

- ✅ iOS Safari (기타 인앱들)
- ✅ 네이버, 인스타그램, 페이스북 등

## 주의사항

1. **보안 정책**: 일부 브라우저에서 스킴 실행이 차단될 수 있음
2. **사용자 경험**: 자동 우회 시 사용자에게 안내 메시지 제공 권장
3. **플랫폼 제한**: iOS에서는 강제 Safari 실행이 제한적
4. **업데이트**: 각 앱의 정책 변경에 따라 우회 방법 조정 필요

## 커스터마이징

### 스타일 커스터마이징

```tsx
<InAppBrowserHandler />
```

- Tailwind CSS 클래스로 스타일 조정 가능
- `className` prop을 통한 추가 스타일링

### 메시지 커스터마이징

- `inapp-browser-utils.ts`의 `fallbackRedirect` 함수에서 알림 메시지 수정
- 컴포넌트 내 텍스트 직접 수정

### 감지 패턴 추가

```typescript
// inapp-browser-utils.ts의 inAppPatterns 배열에 추가
const inAppPatterns = ["inapp", "snapchat", "새로운패턴"];
```

## 문제해결

### 우회가 작동하지 않는 경우

1. 브라우저 콘솔에서 에러 메시지 확인
2. User Agent 문자열 확인
3. 플랫폼별 테스트 (iOS/Android)

### 특정 앱에서만 문제가 있는 경우

1. `detectInAppBrowser` 함수에 해당 앱 패턴 추가
2. 앱별 커스텀 우회 로직 구현

## 라이선스

이 기능은 [burndogfather.com의 오픈소스 코드](https://burndogfather.com/271)를 기반으로 구현되었습니다.
