import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  type ActionCodeSettings 
} from 'firebase/auth';
import { auth } from './firebase';

// 이메일 링크 인증 설정
const actionCodeSettings: ActionCodeSettings = {
  url: `${window.location.origin}/auth/email-callback`,
  handleCodeInApp: true,
  iOS: {
    bundleId: 'com.bible-daily.app'
  },
  android: {
    packageName: 'com.bible_daily.app',
    installApp: true,
    minimumVersion: '12'
  },
  dynamicLinkDomain: undefined // Firebase Dynamic Links를 사용하는 경우 설정
};

/**
 * 이메일 링크 인증 요청
 */
export const sendEmailSignInLink = async (email: string): Promise<void> => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    // 이메일을 로컬 스토리지에 저장 (인증 완료 시 필요)
    localStorage.setItem('emailForSignIn', email);
    
    console.log('Email sign-in link sent successfully');
  } catch (error: unknown) {
    console.error('Failed to send email sign-in link:', error);
    const errorCode = (error as { code?: string }).code || 'unknown';
    throw new Error(getEmailAuthErrorMessage(errorCode));
  }
};

/**
 * 이메일 링크로 로그인 완료
 */
export const completeEmailSignIn = async (emailLink: string): Promise<void> => {
  try {
    // 이메일 링크인지 확인
    if (!isSignInWithEmailLink(auth, emailLink)) {
      throw new Error('유효하지 않은 인증 링크입니다.');
    }

    // 저장된 이메일 가져오기
    let email = localStorage.getItem('emailForSignIn');
    
    // 이메일이 없으면 사용자에게 입력 요청
    if (!email) {
      email = window.prompt('인증을 완료하기 위해 이메일 주소를 입력해주세요:');
    }

    if (!email) {
      throw new Error('이메일 주소가 필요합니다.');
    }

    // 이메일 링크로 로그인
    await signInWithEmailLink(auth, email, emailLink);
    
    // 저장된 이메일 제거
    localStorage.removeItem('emailForSignIn');
    
    console.log('Email sign-in completed successfully');
  } catch (error: unknown) {
    console.error('Failed to complete email sign-in:', error);
    const errorCode = (error as { code?: string }).code || 'unknown';
    throw new Error(getEmailAuthErrorMessage(errorCode));
  }
};

/**
 * 현재 URL이 이메일 인증 링크인지 확인
 */
export const checkEmailSignInLink = (): boolean => {
  return isSignInWithEmailLink(auth, window.location.href);
};

/**
 * 이메일 유효성 검사
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 에러 코드를 사용자 친화적인 메시지로 변환
 */
const getEmailAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 주소입니다.';
    case 'auth/user-disabled':
      return '비활성화된 계정입니다. 관리자에게 문의하세요.';
    case 'auth/user-not-found':
      return '등록되지 않은 이메일 주소입니다.';
    case 'auth/invalid-action-code':
      return '인증 링크가 만료되었거나 유효하지 않습니다.';
    case 'auth/expired-action-code':
      return '인증 링크가 만료되었습니다. 새로운 링크를 요청해주세요.';
    case 'auth/invalid-continue-uri':
      return '잘못된 리다이렉트 URL입니다.';
    case 'auth/missing-continue-uri':
      return '리다이렉트 URL이 누락되었습니다.';
    case 'auth/too-many-requests':
      return '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해주세요.';
    default:
      return '인증 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
};

/**
 * 이메일 도메인 검증 (교육기관 이메일 등)
 */
export const validateEmailDomain = (email: string): { isValid: boolean; message?: string } => {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return { isValid: false, message: '유효하지 않은 이메일 형식입니다.' };
  }

  // 허용된 도메인 목록 (필요시 확장)
  const allowedDomains = [
    'gmail.com',
    'naver.com',
    'daum.net',
    'kakao.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    // 교육기관 도메인들
    'edu',
    'ac.kr',
    'school.kr'
  ];

  const isAllowed = allowedDomains.some(allowedDomain => 
    domain === allowedDomain || domain.endsWith('.' + allowedDomain)
  );

  if (!isAllowed) {
    return { 
      isValid: false, 
      message: '지원되지 않는 이메일 도메인입니다. 일반적인 이메일 서비스를 사용해주세요.' 
    };
  }

  return { isValid: true };
};
