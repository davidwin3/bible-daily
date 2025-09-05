/**
 * 인앱 브라우저 감지 및 우회 유틸리티
 * 참고: https://burndogfather.com/271
 */

export interface InAppBrowserInfo {
  isInApp: boolean;
  browserType:
    | "kakaotalk"
    | "line"
    | "naver"
    | "instagram"
    | "facebook"
    | "other"
    | "none";
  userAgent: string;
  isIOS: boolean;
  isAndroid: boolean;
}

/**
 * 현재 브라우저가 인앱 브라우저인지 감지
 */
export function detectInAppBrowser(): InAppBrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);

  // 카카오톡 인앱 브라우저 감지
  if (userAgent.includes("kakaotalk")) {
    return {
      isInApp: true,
      browserType: "kakaotalk",
      userAgent,
      isIOS,
      isAndroid,
    };
  }

  // 라인 인앱 브라우저 감지
  if (userAgent.includes("line")) {
    return {
      isInApp: true,
      browserType: "line",
      userAgent,
      isIOS,
      isAndroid,
    };
  }

  // 네이버 인앱 브라우저 감지
  if (userAgent.includes("naver")) {
    return {
      isInApp: true,
      browserType: "naver",
      userAgent,
      isIOS,
      isAndroid,
    };
  }

  // 인스타그램 인앱 브라우저 감지
  if (userAgent.includes("instagram")) {
    return {
      isInApp: true,
      browserType: "instagram",
      userAgent,
      isIOS,
      isAndroid,
    };
  }

  // 페이스북 인앱 브라우저 감지
  if (
    userAgent.includes("fb_iab") ||
    userAgent.includes("fban") ||
    userAgent.includes("fbios")
  ) {
    return {
      isInApp: true,
      browserType: "facebook",
      userAgent,
      isIOS,
      isAndroid,
    };
  }

  // 기타 인앱 브라우저들
  const inAppPatterns = [
    "inapp",
    "snapchat",
    "wirtschaftswoche",
    "thunderbird",
    "everytimeapp",
    "whatsapp",
    "electron",
    "wadiz",
    "aliapp",
    "zumapp",
    "kakaostory",
    "band",
    "twitter",
    "daumapps",
    "daumdevice/mobile",
    "trill",
  ];

  const isOtherInApp = inAppPatterns.some((pattern) =>
    userAgent.includes(pattern)
  );

  if (isOtherInApp) {
    return {
      isInApp: true,
      browserType: "other",
      userAgent,
      isIOS,
      isAndroid,
    };
  }

  return {
    isInApp: false,
    browserType: "none",
    userAgent,
    isIOS,
    isAndroid,
  };
}

/**
 * 클립보드에 URL 복사
 */
export function copyToClipboard(text: string): boolean {
  try {
    // 모던 브라우저의 Clipboard API 사용
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      return true;
    }

    // 레거시 방법
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand("copy");
    document.body.removeChild(textArea);

    return result;
  } catch (error) {
    console.error("클립보드 복사 실패:", error);
    return false;
  }
}

/**
 * 카카오톡 인앱 브라우저에서 외부 브라우저로 리다이렉트
 */
export function redirectFromKakaoTalk(targetUrl?: string): void {
  const url = targetUrl || window.location.href;
  const kakaoScheme = `kakaotalk://web/openExternal?url=${encodeURIComponent(
    url
  )}`;

  try {
    window.location.href = kakaoScheme;
  } catch (error) {
    console.error("카카오톡 외부 브라우저 실행 실패:", error);
    fallbackRedirect(url);
  }
}

/**
 * 라인 인앱 브라우저에서 외부 브라우저로 리다이렉트
 */
export function redirectFromLine(targetUrl?: string): void {
  const url = targetUrl || window.location.href;

  try {
    const separator = url.includes("?") ? "&" : "?";
    const lineUrl = `${url}${separator}openExternalBrowser=1`;
    window.location.href = lineUrl;
  } catch (error) {
    console.error("라인 외부 브라우저 실행 실패:", error);
    fallbackRedirect(url);
  }
}

/**
 * 안드로이드에서 Chrome으로 강제 리다이렉트
 */
export function redirectToChrome(targetUrl?: string): void {
  const url = targetUrl || window.location.href;
  const cleanUrl = url.replace(/https?:\/\//i, "");
  const chromeIntent = `intent://${cleanUrl}#Intent;scheme=http;package=com.android.chrome;end`;

  try {
    window.location.href = chromeIntent;
  } catch (error) {
    console.error("Chrome 실행 실패:", error);
    fallbackRedirect(url);
  }
}

/**
 * 대체 리다이렉트 방법 (URL 복사 및 안내)
 */
export function fallbackRedirect(targetUrl?: string): void {
  const url = targetUrl || window.location.href;
  copyToClipboard(url);

  alert(
    "URL이 클립보드에 복사되었습니다.\n" +
      "외부 브라우저(Safari/Chrome)를 열어서\n" +
      "주소창에 붙여넣기 하여 접속해주세요."
  );
}

/**
 * 인앱 브라우저 우회 실행
 */
export function bypassInAppBrowser(targetUrl?: string): void {
  const browserInfo = detectInAppBrowser();

  if (!browserInfo.isInApp) {
    return; // 인앱 브라우저가 아니면 아무것도 하지 않음
  }

  const url = targetUrl || window.location.href;

  switch (browserInfo.browserType) {
    case "kakaotalk":
      redirectFromKakaoTalk(url);
      break;

    case "line":
      redirectFromLine(url);
      break;

    default:
      if (browserInfo.isAndroid) {
        redirectToChrome(url);
      } else {
        fallbackRedirect(url);
      }
      break;
  }
}

/**
 * 인앱 브라우저 감지 시 자동 우회 실행
 */
export function autoBypassInAppBrowser(): void {
  const browserInfo = detectInAppBrowser();

  if (browserInfo.isInApp) {
    // 페이지 로드 후 잠시 대기 후 실행 (사용자 경험 개선)
    setTimeout(() => {
      bypassInAppBrowser();
    }, 1000);
  }
}
