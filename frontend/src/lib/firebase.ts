import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google OAuth 보안 정책 준수를 위한 설정
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // 보안 브라우저 사용 정책 준수 - 도메인 제한 없음
});

// 추가 스코프 설정 (필요시)
googleProvider.addScope('email');
googleProvider.addScope('profile');

// 리다이렉트 기반 로그인 함수 (안드로이드 브라우저 호환)
export const signInWithGoogleRedirect = () => {
  return signInWithRedirect(auth, googleProvider);
};

// 리다이렉트 결과 처리
export const handleRedirectResult = () => {
  return getRedirectResult(auth);
};

// 브라우저 호환성 체크
export const isMobileWebView = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // WebView 감지 패턴들
  const webViewPatterns = [
    /wv/i, // Android WebView
    /Version\/[\d.]+.*Mobile.*Safari/i, // iOS WebView
    /FB_IAB/i, // Facebook In-App Browser
    /FBAN/i, // Facebook App
    /FBAV/i, // Facebook App
    /Instagram/i, // Instagram In-App Browser
  ];
  
  return webViewPatterns.some(pattern => pattern.test(userAgent));
};

// 안전한 브라우저인지 확인
export const isSecureBrowser = () => {
  // HTTPS 체크
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    return false;
  }
  
  // WebView가 아닌 일반 브라우저인지 확인
  return !isMobileWebView();
};
