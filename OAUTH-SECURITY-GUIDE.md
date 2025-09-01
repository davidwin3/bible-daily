# Google OAuth 보안 정책 준수 가이드

## 문제 상황

안드로이드 브라우저에서 다음과 같은 오류 메시지가 발생하는 경우:

```
이 요청이 Google의 '보안 브라우저 사용' 정책을 준수하지 않습니다. 
Bible-Daily에 웹사이트가 있는 경우 웹브라우저를 열고 웹사이트에서 로그인할 수 있습니다.
```

## 해결 방법

### 1. 즉시 해결 방법

#### 사용자 측면
1. **일반 브라우저 사용**: 앱 내 브라우저가 아닌 Chrome, Safari 등 일반 브라우저에서 접속
2. **HTTPS 연결 확인**: 보안 연결(https://)로 접속하는지 확인
3. **이메일 로그인 사용**: 구글 로그인이 안 되는 경우 이메일 링크 인증 사용

#### 개발자 측면
1. **리다이렉트 방식 적용**: WebView 환경에서는 자동으로 리다이렉트 방식 사용
2. **대체 인증 제공**: 이메일 링크 인증 옵션 제공
3. **사용자 가이드**: 브라우저 환경에 따른 적절한 안내 메시지 표시

### 2. 구현된 해결책

#### A. 브라우저 환경 감지
```typescript
// WebView 감지
export const isMobileWebView = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  const webViewPatterns = [
    /wv/i, // Android WebView
    /Version\/[\d.]+.*Mobile.*Safari/i, // iOS WebView
    /FB_IAB/i, // Facebook In-App Browser
    /FBAN/i, // Facebook App
    /Instagram/i, // Instagram In-App Browser
  ];
  
  return webViewPatterns.some(pattern => pattern.test(userAgent));
};

// 보안 브라우저 확인
export const isSecureBrowser = () => {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    return false;
  }
  return !isMobileWebView();
};
```

#### B. 적응형 로그인 방식
```typescript
const login = async () => {
  // WebView나 보안이 취약한 환경에서는 리다이렉트 방식 사용
  if (isWebView || !isSecure) {
    await signInWithGoogleRedirect();
    return;
  }

  // 일반 브라우저에서는 팝업 방식 사용
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (popupError) {
    // 팝업 실패 시 리다이렉트로 대체
    if (popupError.code === 'auth/popup-blocked') {
      await signInWithGoogleRedirect();
      return;
    }
    throw popupError;
  }
};
```

#### C. 이메일 링크 인증
```typescript
// 이메일 링크 전송
export const sendEmailSignInLink = async (email: string) => {
  const actionCodeSettings = {
    url: `${window.location.origin}/auth/email-callback`,
    handleCodeInApp: true,
    iOS: { bundleId: 'com.bible-daily.app' },
    android: { packageName: 'com.bible_daily.app', installApp: true }
  };
  
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem('emailForSignIn', email);
};

// 이메일 링크 인증 완료
export const completeEmailSignIn = async (emailLink: string) => {
  if (!isSignInWithEmailLink(auth, emailLink)) {
    throw new Error('유효하지 않은 인증 링크입니다.');
  }

  const email = localStorage.getItem('emailForSignIn');
  await signInWithEmailLink(auth, email, emailLink);
  localStorage.removeItem('emailForSignIn');
};
```

### 3. PWA 설정 개선

#### manifest.json 보안 정책 준수
```json
{
  "name": "Bible Daily - 성경말씀 소감 공유",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
  "scope": "/",
  "id": "bible-daily-pwa",
  "prefer_related_applications": false,
  "protocol_handlers": [
    {
      "protocol": "web+bible-daily",
      "url": "/?action=%s"
    }
  ]
}
```

### 4. 사용자 경험 개선

#### A. 브라우저 환경 표시
- 앱 내 브라우저 감지 시 배지 표시
- 보안 상태에 따른 시각적 피드백
- 적절한 안내 메시지 제공

#### B. 에러 처리 및 가이드
```typescript
// 구체적인 에러 메시지
if (error.code === 'auth/popup-blocked') {
  setError("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
} else if (error.message?.includes('보안 브라우저')) {
  setError("보안상의 이유로 로그인할 수 없습니다. 일반 브라우저에서 다시 시도해주세요.");
}

// 브라우저 가이드 제공
const browserGuide = (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertDescription>
      <div className="font-medium">로그인 문제가 발생했나요?</div>
      <div className="text-sm space-y-1">
        <p>• 일반 브라우저(Chrome, Safari 등)에서 접속해보세요</p>
        <p>• 앱 내 브라우저가 아닌 기본 브라우저를 사용해주세요</p>
        <p>• HTTPS 연결인지 확인해주세요</p>
      </div>
    </AlertDescription>
  </Alert>
);
```

## 테스트 방법

### 1. 다양한 환경에서 테스트
- Chrome 브라우저 (데스크톱/모바일)
- Safari 브라우저 (iOS)
- Samsung Internet (Android)
- 앱 내 브라우저 (Facebook, Instagram 등)

### 2. 시나리오별 테스트
1. **일반 브라우저**: 팝업 로그인 → 성공
2. **WebView**: 리다이렉트 로그인 → 성공
3. **팝업 차단**: 팝업 실패 → 리다이렉트로 대체 → 성공
4. **보안 정책 위반**: 구글 로그인 실패 → 이메일 로그인 안내 → 성공

### 3. 이메일 인증 테스트
1. 이메일 주소 입력 → 링크 전송
2. 이메일에서 링크 클릭 → 인증 완료
3. 같은 기기/브라우저에서 링크 클릭 확인

## 모니터링 및 분석

### 1. 로그 수집
```typescript
// 로그인 방식별 성공률 추적
console.log(`Login method: ${isWebView ? 'redirect' : 'popup'}`);
console.log(`Browser: ${navigator.userAgent}`);
console.log(`Secure: ${isSecureBrowser()}`);
```

### 2. 에러 추적
```typescript
// 에러 발생 시 환경 정보 수집
const logAuthError = (error, context) => {
  console.error('Auth Error:', {
    error: error.message,
    code: error.code,
    userAgent: navigator.userAgent,
    isWebView: isMobileWebView(),
    isSecure: isSecureBrowser(),
    context
  });
};
```

## 추가 권장사항

### 1. Firebase 프로젝트 설정
- 승인된 도메인에 모든 배포 도메인 추가
- OAuth 리다이렉트 URI 정확히 설정
- 앱 등록 시 패키지명/번들ID 정확히 입력

### 2. 보안 강화
- HTTPS 강제 적용
- CSP(Content Security Policy) 설정
- 민감한 정보 로컬 스토리지 암호화

### 3. 사용자 교육
- 로그인 가이드 페이지 제공
- FAQ에 브라우저 관련 문제 해결 방법 추가
- 고객 지원 채널에서 빠른 대응

## 결론

Google의 보안 브라우저 사용 정책은 사용자 보안을 위한 중요한 조치입니다. 이 가이드에 따라 구현하면:

1. **다양한 브라우저 환경에서 안정적인 로그인 제공**
2. **보안 정책을 준수하면서 사용자 경험 유지**
3. **문제 발생 시 적절한 대안 제공**
4. **명확한 사용자 가이드로 혼란 최소화**

이를 통해 안드로이드 브라우저에서 발생하는 OAuth 보안 정책 관련 문제를 효과적으로 해결할 수 있습니다.
