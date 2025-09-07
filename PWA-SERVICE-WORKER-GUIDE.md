# PWA Service Worker 관리 가이드

## 개요

Bible Daily 프로젝트는 PWA(Progressive Web App) 기능을 지원하며, Service Worker를 통해 오프라인 지원과 캐시 관리를 제공합니다. 이 가이드는 Service Worker의 동작 방식과 관리 방법을 설명합니다.

## 🎯 주요 기능

### 1. 조건부 Service Worker 등록

- **PWA 환경**: Service Worker가 자동으로 등록되어 캐시와 오프라인 기능 제공
- **일반 브라우저**: Service Worker 없이 동작하여 API 응답이 캐시되지 않음

### 2. 스마트 캐시 전략

- **정적 파일**: 캐시 우선 전략 (CSS, JS, 이미지 등)
- **API GET 요청**: 네트워크 우선, 짧은 캐시 시간 (1분)
- **API POST/PUT/DELETE**: 캐시하지 않음, 항상 네트워크 요청

## 🔧 환경 감지 로직

### PWA 환경 판단 기준

```typescript
export function isPWAEnvironment(): boolean {
  // 1. display-mode가 standalone인지 확인
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // 2. navigator.standalone (iOS Safari)
  if (
    "standalone" in window.navigator &&
    (window.navigator as any).standalone
  ) {
    return true;
  }

  // 3. 홈 스크린에서 실행된 경우 (Android Chrome)
  if (window.matchMedia("(display-mode: minimal-ui)").matches) {
    return true;
  }

  // 4. URL 파라미터로 PWA 모드 강제 설정 (개발/테스트용)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("pwa") === "true") {
    return true;
  }

  return false;
}
```

## 📱 Service Worker 캐시 전략

### API 요청 처리

```javascript
// POST, PUT, DELETE, PATCH 요청은 항상 네트워크에서 가져오고 캐시하지 않음
if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // 네트워크 오류 시 오프라인 응답 반환
    return new Response(
      JSON.stringify({
        error: "네트워크 연결이 없습니다. 나중에 다시 시도해주세요.",
        offline: true,
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// GET 요청에 대한 네트워크 우선 전략 (단, 짧은 캐시 시간 적용)
if (method === "GET") {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      // 성공적인 응답만 캐시 (1분 캐시)
      const cachedResponse = new Response(responseToCache.body, {
        headers: {
          ...Object.fromEntries(responseToCache.headers.entries()),
          "sw-cached-at": Date.now().toString(),
          "cache-control": "max-age=60", // 1분 캐시
        },
      });

      cache.put(request, cachedResponse);
      return response;
    }
  } catch (error) {
    // 네트워크 오류 시 캐시된 데이터 확인 (최대 5분)
    const maxCacheAge = 5 * 60 * 1000; // 5분
    // ... 캐시 유효성 검사 로직
  }
}
```

## 🛠️ 개발자 도구

### PWA 디버그 패널

개발 환경에서 `Ctrl + Shift + P`를 눌러 PWA 디버그 패널을 열 수 있습니다.

**주요 기능:**

- 현재 환경 정보 표시 (PWA/브라우저 모드)
- Service Worker 상태 확인
- PWA 모드 강제 토글 (`?pwa=true` 파라미터)
- Service Worker 등록/해제
- 캐시 관리 (API 캐시, 전체 캐시)
- 실시간 상태 모니터링

### 캐시 관리 명령어

```typescript
// 전체 캐시 삭제
await clearAllCaches();

// API 캐시만 삭제
await clearAPICacheOnly();

// Service Worker 없이 기본 캐시 삭제
await clearPWACache();

// 캐시 정보 조회
const info = await getCacheInfo();
```

## 🧪 테스트 방법

### 1. PWA 모드 테스트

```bash
# URL에 pwa=true 파라미터 추가
http://localhost:5173/?pwa=true

# 또는 디버그 패널에서 PWA 모드 토글
```

### 2. 캐시 동작 확인

```bash
# 1. PWA 모드에서 API 호출
# 2. 네트워크 탭에서 캐시 응답 확인
# 3. 디버그 패널에서 캐시 정보 확인

# API 캐시 테스트
curl -H "Cache-Control: no-cache" http://localhost:3000/api/posts
```

### 3. 오프라인 테스트

```bash
# 1. PWA 모드에서 페이지 로드
# 2. 개발자 도구에서 네트워크 오프라인 설정
# 3. 페이지 새로고침 및 기능 테스트
```

## 🚀 배포 시 고려사항

### 1. Service Worker 업데이트

```javascript
// Service Worker 업데이트 감지 및 처리
registration.addEventListener("updatefound", () => {
  const newWorker = registration.installing;

  if (newWorker) {
    newWorker.addEventListener("statechange", () => {
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        // 사용자에게 새로고침 알림 표시
        showUpdateAvailableNotification();
      }
    });
  }
});
```

### 2. 캐시 버전 관리

```javascript
const CACHE_NAME = "bible-daily-v2"; // 버전 업데이트 시 변경
const STATIC_CACHE = "bible-daily-static-v2";
const DYNAMIC_CACHE = "bible-daily-dynamic-v2";
```

### 3. 환경별 설정

```typescript
// 프로덕션 환경에서는 디버그 패널 숨김
if (!isVisible && process.env.NODE_ENV === "production") {
  return null;
}
```

## 📊 모니터링 및 디버깅

### 1. 콘솔 로그 확인

```bash
# 브라우저 콘솔에서 확인할 수 있는 로그
- "PWA 환경에서 실행 중 - Service Worker 등록"
- "일반 브라우저 환경에서 실행 중 - Service Worker 정리"
- "API 캐시가 삭제되었습니다."
- "전체 캐시가 삭제되었습니다."
```

### 2. 네트워크 요청 헤더

```
# 캐시된 응답 확인
x-served-from: cache
x-cache-stale: false
sw-cached-at: 1703123456789
cache-control: max-age=60
```

### 3. Application 탭 확인

- Service Workers: 등록된 SW 상태
- Cache Storage: 캐시된 리소스 목록
- Manifest: PWA 매니페스트 정보

## ⚠️ 주의사항

### 1. 캐시 무효화

- API 데이터가 변경되었을 때 캐시가 오래된 데이터를 반환할 수 있음
- 중요한 데이터는 캐시 시간을 짧게 설정하거나 수동으로 캐시 무효화

### 2. 브라우저 호환성

- Service Worker는 HTTPS 환경에서만 동작 (localhost 제외)
- iOS Safari의 PWA 지원에 일부 제한사항 있음

### 3. 메모리 사용량

- 캐시된 데이터가 많을 경우 브라우저 저장소 사용량 증가
- 정기적인 캐시 정리 필요

## 🔗 관련 파일

- `frontend/src/lib/pwa.ts`: PWA 관리 유틸리티
- `frontend/src/components/PWADebugPanel.tsx`: 디버그 패널 컴포넌트
- `frontend/public/sw.js`: Service Worker 구현
- `frontend/src/main.tsx`: Service Worker 등록 로직
- `frontend/public/manifest.json`: PWA 매니페스트

## 📝 FAQ

**Q: 일반 브라우저에서 API가 캐시되는 문제가 있었는데 해결되었나요?**
A: 네, 이제 PWA 환경에서만 Service Worker가 등록되므로 일반 브라우저에서는 API가 캐시되지 않습니다.

**Q: 개발 중에 캐시 때문에 최신 API 응답을 받지 못할 때는 어떻게 하나요?**
A: `Ctrl + Shift + P`로 디버그 패널을 열어서 "API 캐시" 버튼을 클릭하면 API 캐시만 삭제할 수 있습니다.

**Q: PWA 모드를 강제로 테스트하려면 어떻게 하나요?**
A: URL에 `?pwa=true` 파라미터를 추가하거나 디버그 패널에서 "PWA 모드 강제" 스위치를 켜세요.

**Q: Service Worker가 업데이트되지 않을 때는?**
A: 디버그 패널에서 "SW 해제" → "SW 등록" 순서로 클릭하거나 브라우저의 Application 탭에서 "Unregister" 후 새로고침하세요.
