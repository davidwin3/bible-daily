// PWA 환경 감지 및 관리 유틸리티

/**
 * PWA 환경인지 확인
 * - standalone 모드로 실행 중인지 확인
 * - 홈 스크린에서 실행된 앱인지 확인
 */
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

/**
 * PWA 설치 가능 여부 확인
 */
export function isPWAInstallable(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * 현재 브라우저 환경 정보 반환
 */
export function getBrowserEnvironment() {
  const isPWA = isPWAEnvironment();
  const isInstallable = isPWAInstallable();
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return {
    isPWA,
    isInstallable,
    isStandalone,
    userAgent: navigator.userAgent,
    displayMode: isPWA ? "pwa" : "browser",
  };
}

/**
 * Service Worker 등록 (PWA 환경 또는 개발 환경에서)
 */
export async function registerServiceWorkerForPWA(): Promise<ServiceWorkerRegistration | null> {
  const isDev = import.meta.env.DEV;

  if (!isDev && !isPWAEnvironment()) {
    console.log("PWA 환경이 아니므로 Service Worker를 등록하지 않습니다.");
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker를 지원하지 않는 브라우저입니다.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("PWA Service Worker 등록 성공:", registration);

    // Service Worker 업데이트 확인
    registration.addEventListener("updatefound", () => {
      console.log("Service Worker 업데이트 발견");
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log(
              "새로운 Service Worker 설치됨. 새로고침이 필요할 수 있습니다."
            );
            // 사용자에게 새로고침 알림을 표시할 수 있습니다.
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error("Service Worker 등록 실패:", error);
    return null;
  }
}

/**
 * Service Worker 해제 (일반 브라우저 환경에서)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log("Service Worker 해제:", result);
      return result;
    }
    return false;
  } catch (error) {
    console.error("Service Worker 해제 실패:", error);
    return false;
  }
}

/**
 * 캐시 정리 (일반 브라우저 환경에서)
 */
export async function clearPWACache(): Promise<void> {
  if (!("caches" in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map((cacheName) =>
      caches.delete(cacheName)
    );
    await Promise.all(deletePromises);
    console.log("PWA 캐시 정리 완료");
  } catch (error) {
    console.error("캐시 정리 실패:", error);
  }
}

/**
 * 환경 변경 감지 및 처리
 */
export function setupEnvironmentChangeListener(): void {
  // display-mode 변경 감지
  const mediaQuery = window.matchMedia("(display-mode: standalone)");

  const handleDisplayModeChange = (e: MediaQueryListEvent) => {
    const environment = getBrowserEnvironment();
    console.log("Display mode 변경:", environment);

    if (e.matches) {
      // PWA 모드로 변경됨 - Service Worker 등록
      registerServiceWorkerForPWA();
    } else {
      // 브라우저 모드로 변경됨 - Service Worker 해제 고려
      console.log("브라우저 모드로 변경됨");
    }
  };

  mediaQuery.addListener(handleDisplayModeChange);

  // 초기 환경 로그
  console.log("현재 브라우저 환경:", getBrowserEnvironment());
}

/**
 * Service Worker와 통신하여 캐시 관리
 */
export async function sendMessageToServiceWorker(message: any): Promise<any> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported");
  }

  const registration = await navigator.serviceWorker.ready;
  if (!registration.active) {
    throw new Error("No active Service Worker");
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    messageChannel.port1.onmessageerror = (error) => {
      reject(error);
    };

    registration.active!.postMessage(message, [messageChannel.port2]);

    // 타임아웃 설정 (5초)
    setTimeout(() => {
      reject(new Error("Service Worker message timeout"));
    }, 5000);
  });
}

/**
 * 모든 캐시 삭제
 */
export async function clearAllCaches(): Promise<void> {
  try {
    await sendMessageToServiceWorker({ type: "CLEAR_CACHE" });
    console.log("모든 캐시가 삭제되었습니다.");
  } catch (error) {
    console.error("캐시 삭제 실패:", error);
    // Service Worker가 없어도 직접 캐시 삭제 시도
    await clearPWACache();
  }
}

/**
 * API 캐시만 삭제
 */
export async function clearAPICacheOnly(): Promise<void> {
  try {
    await sendMessageToServiceWorker({ type: "CLEAR_API_CACHE" });
    console.log("API 캐시가 삭제되었습니다.");
  } catch (error) {
    console.error("API 캐시 삭제 실패:", error);
  }
}

/**
 * Service Worker 캐시 정보 조회
 */
export async function getCacheInfo(): Promise<any> {
  try {
    const info = await sendMessageToServiceWorker({ type: "GET_CACHE_INFO" });
    return info;
  } catch (error) {
    console.error("캐시 정보 조회 실패:", error);
    return {};
  }
}

/**
 * Service Worker 업데이트 강제 적용
 */
export async function skipWaitingServiceWorker(): Promise<void> {
  try {
    await sendMessageToServiceWorker({ type: "SKIP_WAITING" });
    console.log("Service Worker 업데이트가 적용됩니다.");
  } catch (error) {
    console.error("Service Worker 업데이트 실패:", error);
  }
}
