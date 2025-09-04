# Bible Daily PWA 푸시 알림 설정 가이드

이 문서는 Bible Daily 프로젝트의 PWA 푸시 알림 기능 설정과 문제 해결 가이드입니다.

## 📋 목차

1. [수정된 문제점들](#수정된-문제점들)
2. [Firebase 설정](#firebase-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [배포 및 테스트](#배포-및-테스트)
5. [문제 해결](#문제-해결)

## 🔧 수정된 문제점들

### 1. Dockerfile PWA 파일 처리

**문제**: `manifest.json`과 `sw.js` 파일이 중복으로 복사되어 빌드 오류 발생

**해결**:

- Dockerfile에서 중복 복사 라인 제거
- Vite 빌드 결과물에 이미 포함된 파일들을 별도로 복사하지 않도록 수정

```dockerfile
# 수정 전
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY --from=build /app/frontend/dist/manifest.json /usr/share/nginx/html/
COPY --from=build /app/frontend/dist/sw.js /usr/share/nginx/html/

# 수정 후
COPY --from=build /app/frontend/dist /usr/share/nginx/html
```

### 2. Service Worker 캐시 전략 개선

**문제**: 하드코딩된 번들 파일명으로 인한 캐시 실패

**해결**:

- 동적 캐시 전략 구현
- 파일 확장자별 캐시 정책 적용
- 정적/동적 캐시 분리

```javascript
// 캐시할 파일 유형 결정
const cacheName = url.pathname.match(
  /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/
)
  ? STATIC_CACHE
  : DYNAMIC_CACHE;
```

### 3. 푸시 알림 처리 개선

**문제**: 기본적인 푸시 알림 처리로 인한 제한적 기능

**해결**:

- JSON 페이로드 파싱 지원
- 포그라운드/백그라운드 알림 구분 처리
- 알림 클릭 시 앱 포커스 기능 추가

## 🔥 Firebase 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "프로젝트 설정" → "일반" 탭에서 웹 앱 추가

### 2. Firebase 서비스 계정 설정

1. "프로젝트 설정" → "서비스 계정" 탭
2. "새 비공개 키 생성" 클릭하여 서비스 계정 키 다운로드
3. 다운로드한 JSON 파일의 내용을 환경 변수에 설정

### 3. Cloud Messaging 설정

1. "프로젝트 설정" → "클라우드 메시징" 탭
2. "웹 푸시 인증서" 섹션에서 키 쌍 생성
3. VAPID 키를 환경 변수에 설정

## 🔐 환경 변수 설정

### Frontend 환경 변수 (`.env`)

```bash
# Firebase 설정
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

### Backend 환경 변수 (`.env`)

```bash
# Firebase Admin SDK 설정
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

## 🚀 배포 및 테스트

### 1. 개발 환경 테스트

```bash
# 프론트엔드 실행
cd frontend
pnpm dev

# 백엔드 실행
cd backend
pnpm dev
```

### 2. 프로덕션 빌드

```bash
# Docker Compose로 빌드 및 실행
docker-compose up --build
```

### 3. 알림 테스트 방법

1. 브라우저에서 애플리케이션 접속
2. 설정 페이지에서 "푸시 알림 받기" 활성화
3. "테스트 알림 보내기" 버튼 클릭
4. 알림이 정상적으로 표시되는지 확인

## 🔍 문제 해결

### 1. 알림이 표시되지 않는 경우

**확인 사항:**

- 브라우저 알림 권한이 허용되어 있는지 확인
- Service Worker가 정상적으로 등록되었는지 개발자 도구에서 확인
- Firebase 설정이 올바른지 확인
- HTTPS 환경에서 테스트하고 있는지 확인 (localhost 제외)

**디버깅 방법:**

```javascript
// 브라우저 콘솔에서 실행
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log("Registered service workers:", registrations);
});
```

### 2. FCM 토큰을 가져올 수 없는 경우

**원인:**

- VAPID 키가 잘못되었거나 설정되지 않음
- Service Worker가 등록되지 않음
- 브라우저가 FCM을 지원하지 않음

**해결:**

```javascript
// Firebase 초기화 확인
import { getFCMToken } from "@/lib/firebase";

getFCMToken().then((token) => {
  if (token) {
    console.log("FCM Token:", token);
  } else {
    console.log("No token available");
  }
});
```

### 3. 백그라운드 알림이 작동하지 않는 경우

**확인 사항:**

- `firebase-messaging-sw.js` 파일이 올바른 위치에 있는지 확인
- Firebase 프로젝트 설정이 Service Worker에 적용되었는지 확인
- 브라우저가 백그라운드에서 실행 중인지 확인

### 4. 일부 브라우저에서 알림이 작동하지 않는 경우

**지원 브라우저:**

- Chrome 42+
- Firefox 44+
- Safari 16.4+ (제한적 지원)
- Edge 17+

**참고:** iOS Safari는 PWA로 설치된 경우에만 푸시 알림을 지원합니다.

## 📱 브라우저별 설정 가이드

### Chrome

1. 주소창 왼쪽 자물쇠/정보 아이콘 클릭
2. "알림" → "허용" 선택

### Firefox

1. 주소창 왼쪽 방패 아이콘 클릭
2. "알림" → "허용" 선택

### Safari

1. Safari → 환경설정 → 웹사이트 → 알림
2. 해당 사이트를 "허용"으로 설정

## 🔄 업데이트 사항

### v2.0 (현재)

- ✅ Dockerfile PWA 파일 처리 문제 해결
- ✅ Service Worker 캐시 전략 개선
- ✅ Firebase Cloud Messaging 통합
- ✅ 포그라운드/백그라운드 알림 지원
- ✅ 알림 권한 관리 개선
- ✅ FCM 토큰 관리 API 추가

### 향후 계획

- [ ] 알림 템플릿 시스템
- [ ] 사용자별 알림 설정 세분화
- [ ] 알림 통계 및 분석
- [ ] A/B 테스트 지원

## 📞 지원

문제가 지속되는 경우:

1. 브라우저 개발자 도구의 콘솔 로그 확인
2. Network 탭에서 API 요청 상태 확인
3. Application 탭에서 Service Worker 상태 확인

더 자세한 정보는 [Firebase 공식 문서](https://firebase.google.com/docs/cloud-messaging/js/client)를 참조하세요.
