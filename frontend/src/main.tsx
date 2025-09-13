import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./lib/dayjs"; // dayjs 초기화
import { setupForegroundMessageListener } from "./lib/firebase";
import {
  registerServiceWorkerForPWA,
  unregisterServiceWorker,
  clearPWACache,
  setupEnvironmentChangeListener,
  getBrowserEnvironment,
} from "./lib/pwa";

// Locator.js 개발 도구 (개발 환경에서만)
if (import.meta.env.DEV) {
  import("@locator/runtime")
    .then((locatorModule) => {
      const setupLocator =
        (locatorModule as any).setupLocator ||
        (locatorModule as any).default?.setupLocator;
      if (setupLocator) {
        setupLocator({
          adapter: "vscode",
        });
      }
    })
    .catch(console.error);
}

// 브라우저 환경 초기화 및 Service Worker 관리
window.addEventListener("load", async () => {
  const environment = getBrowserEnvironment();
  console.log("브라우저 환경:", environment);

  // 환경 변경 리스너 설정
  setupEnvironmentChangeListener();

  // 개발 환경에서는 항상 Service Worker 등록
  const isDev = import.meta.env.DEV;

  if (environment.isPWA || isDev) {
    // PWA 환경 또는 개발 환경에서 Service Worker 등록
    console.log(
      isDev
        ? "개발 환경에서 실행 중 - Service Worker 등록"
        : "PWA 환경에서 실행 중 - Service Worker 등록"
    );

    const registration = await registerServiceWorkerForPWA();

    if (registration) {
      console.log("Service Worker 등록 성공:", registration);

      // Firebase 포그라운드 메시지 리스너 설정
      setupForegroundMessageListener();
    }
  } else {
    // 일반 브라우저 환경에서는 Service Worker 해제 및 캐시 정리
    console.log("일반 브라우저 환경에서 실행 중 - Service Worker 정리");

    // 기존 Service Worker 해제
    const unregistered = await unregisterServiceWorker();
    if (unregistered) {
      console.log("기존 Service Worker 해제 완료");
    }

    // PWA 캐시 정리
    await clearPWACache();

    // Firebase는 일반 브라우저에서도 사용 (푸시 알림 제외)
    try {
      setupForegroundMessageListener();
    } catch (error) {
      console.log("Firebase 설정 건너뜀 (일반 브라우저 모드):", error);
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
