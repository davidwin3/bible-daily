# PWA 로그인 후 알림 권한 요청 테스트 가이드

## 🎯 구현된 기능

PWA 애플리케이션에서 최초 로그인 완료 시 알림 권한을 요청하는 기능이 구현되었습니다.

### 주요 컴포넌트

1. **NotificationPermissionModal** - 알림 권한 요청 모달
2. **usePWAEnvironment** - PWA 환경 감지 훅
3. **LoginPage** - 로그인 후 알림 권한 요청 로직 통합

## 🔧 테스트 방법

### 1. 개발 환경에서 PWA 테스트

```bash
# 개발 서버 실행
cd frontend
npm run dev

# 또는 pnpm 사용 시
pnpm dev
```

### 2. PWA 환경 시뮬레이션

#### Chrome DevTools 사용:

1. 개발자 도구 열기 (F12)
2. Application 탭 → Manifest 확인
3. Console에서 PWA 환경 확인:
   ```javascript
   // PWA 환경 확인
   console.log(
     "isPWA:",
     window.matchMedia("(display-mode: standalone)").matches
   );
   console.log("Notification permission:", Notification.permission);
   ```

#### 실제 PWA 설치 테스트:

1. Chrome에서 주소창 옆 "앱 설치" 아이콘 클릭
2. 설치된 PWA 앱에서 테스트

### 3. 알림 권한 테스트 시나리오

#### 시나리오 1: 최초 로그인 (권한 요청)

1. 브라우저 알림 권한 초기화:
   - Chrome 설정 → 개인정보 보호 및 보안 → 사이트 설정 → 알림
   - 해당 사이트 권한 삭제
2. 로컬 스토리지 초기화:
   ```javascript
   localStorage.removeItem("notificationPermissionRequested");
   localStorage.removeItem("notificationEnabled");
   ```
3. PWA에서 로그인 → 알림 권한 모달 표시 확인

#### 시나리오 2: 권한 허용

1. 모달에서 "알림 받기" 클릭
2. 브라우저 권한 요청 대화상자에서 "허용" 클릭
3. 홈페이지로 이동 확인

#### 시나리오 3: 권한 거부

1. 모달에서 "받지 않기" 클릭
2. 홈페이지로 이동 확인
3. 다음 로그인 시 모달이 다시 표시되지 않음 확인

#### 시나리오 4: 나중에 선택

1. 모달에서 "나중에" 클릭
2. 홈페이지로 이동 확인
3. 다음 로그인 시 모달이 다시 표시됨 확인

### 4. 로컬 스토리지 상태 확인

```javascript
// 개발자 도구 Console에서 실행
console.log(
  "Permission requested:",
  localStorage.getItem("notificationPermissionRequested")
);
console.log(
  "Notification enabled:",
  localStorage.getItem("notificationEnabled")
);
console.log("Current permission:", Notification.permission);
```

## 🚀 배포 환경 테스트

### 1. 프로덕션 빌드 테스트

```bash
# 프로덕션 빌드
cd frontend
npm run build

# 빌드된 파일 서빙 (예: serve 사용)
npx serve dist
```

### 2. HTTPS 환경에서 테스트

PWA와 알림 기능은 HTTPS 환경에서만 정상 작동합니다.

```bash
# SSL 인증서가 있는 경우
npm run preview

# 또는 로컬 HTTPS 서버 실행
# (SSL 설정 가이드는 SSL-DEPLOYMENT-GUIDE.md 참조)
```

## 🐛 트러블슈팅

### 알림 모달이 표시되지 않는 경우

1. **PWA 환경 확인**:

   ```javascript
   import { getBrowserEnvironment } from "@/lib/pwa";
   console.log(getBrowserEnvironment());
   ```

2. **권한 상태 확인**:

   ```javascript
   console.log("Notification permission:", Notification.permission);
   console.log(
     "Has requested before:",
     localStorage.getItem("notificationPermissionRequested")
   );
   ```

3. **Service Worker 등록 확인**:
   ```javascript
   navigator.serviceWorker.getRegistrations().then((registrations) => {
     console.log("SW registrations:", registrations);
   });
   ```

### 일반 브라우저에서 모달이 표시되는 경우

- PWA 환경 감지 로직 확인
- `usePWAEnvironment` 훅의 `isPWA` 값 확인

### FCM 토큰 관련 오류

- Firebase 설정 확인
- VAPID 키 설정 확인
- 네트워크 연결 상태 확인

## 📝 추가 개선 사항

1. **사용자 경험 개선**:

   - 알림 권한 거부 시 설정 방법 안내
   - 알림 설정 페이지로의 바로가기 제공

2. **분석 및 모니터링**:

   - 알림 권한 허용/거부 비율 추적
   - PWA 설치율 모니터링

3. **접근성 개선**:
   - 키보드 네비게이션 지원
   - 스크린 리더 지원

## 🔗 관련 파일

- `frontend/src/components/notifications/NotificationPermissionModal.tsx`
- `frontend/src/hooks/usePWAEnvironment.ts`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/constants/storage.ts`
- `frontend/src/lib/firebase.ts`
- `frontend/src/lib/pwa.ts`
